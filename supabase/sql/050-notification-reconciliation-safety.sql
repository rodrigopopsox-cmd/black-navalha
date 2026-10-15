-- BLACK NAVALHA
-- Migration 050
-- Seguranca de reconciliacao de notificacoes.
--
-- NAO APLICADA.
-- Nenhum consumidor automatico e habilitado.
-- Nenhuma mensagem e enviada.

begin;

alter table public.notification_deliveries
  drop constraint notification_deliveries_status_valid;

alter table public.notification_deliveries
  add constraint notification_deliveries_status_valid
  check (
    status in (
      'pending',
      'processing',
      'retry',
      'sent',
      'failed',
      'cancelled',
      'reconciliation_required'
    )
  );

-- Conclusao protegida por lock_token.

create or replace function public.complete_notification_delivery(
  p_delivery_id uuid,
  p_lock_token uuid,
  p_result text,
  p_provider text default null,
  p_provider_message_id text default null,
  p_error text default null,
  p_next_attempt_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_event_id uuid;
  v_delivery public.notification_deliveries%rowtype;
  v_event public.notification_events%rowtype;
  v_remaining integer;
begin
  if p_delivery_id is null or p_lock_token is null then
    raise exception 'delivery and lock token required';
  end if;

  if p_result is null
     or p_result not in ('sent', 'retry', 'failed', 'reconciliation_required') then
    raise exception 'invalid delivery result';
  end if;

  select d.event_id
  into v_event_id
  from public.notification_deliveries d
  where d.id = p_delivery_id;

  if not found then
    return false;
  end if;

  -- Primeiro lock: evento.

  select e.*
  into v_event
  from public.notification_events e
  where e.id = v_event_id
  for update;

  if not found or v_event.status = 'cancelled' then
    return false;
  end if;

  -- Segundo lock: delivery.

  select d.*
  into v_delivery
  from public.notification_deliveries d
  where d.id = p_delivery_id
  for update;

  if not found
     or v_delivery.status <> 'processing'
     or v_delivery.lock_token is distinct from p_lock_token then
    return false;
  end if;

  if p_result = 'retry' then
    if v_delivery.attempt_count >= v_delivery.max_attempts then
      raise exception 'retry limit reached';
    end if;

    if p_next_attempt_at is null
       or p_next_attempt_at <= now() then
      raise exception 'retry requires future attempt time';
    end if;
  end if;

  if p_result = 'reconciliation_required' then
    if p_error is null
       or pg_catalog.btrim(p_error) = '' then
      raise exception 'reconciliation requires reason';
    end if;

    if p_next_attempt_at is not null then
      raise exception 'reconciliation cannot schedule retry';
    end if;
  end if;

  if p_result <> 'retry' and p_next_attempt_at is not null then
    raise exception 'next attempt only allowed for retry';
  end if;
  if p_result = 'sent' and p_error is not null then
    raise exception 'sent delivery cannot contain error';
  end if;

  if p_provider is not null
     and btrim(p_provider) = '' then
    raise exception 'invalid provider';
  end if;

  if p_provider_message_id is not null
     and btrim(p_provider_message_id) = '' then
    raise exception 'invalid provider message id';
  end if;

  update public.notification_deliveries d
  set
    status = p_result,
    provider = coalesce(p_provider, d.provider),
    provider_message_id =
      case
        when p_result in ('sent', 'reconciliation_required')
          then coalesce(p_provider_message_id, d.provider_message_id)
        else d.provider_message_id
      end,
    next_attempt_at =
      case
        when p_result = 'retry'
          then p_next_attempt_at
        else d.next_attempt_at
      end,
    last_error =
      case
        when p_result = 'sent'
          then null
        else pg_catalog.left(
          coalesce(p_error, 'Delivery unsuccessful'),
          1000
        )
      end,
    sent_at =
      case
        when p_result = 'sent'
          then now()
        else d.sent_at
      end,
    locked_at = null,
    lock_token = null,
    updated_at = now()
  where d.id = p_delivery_id;

  select count(*)
  into v_remaining
  from public.notification_deliveries d
  where d.event_id = v_event_id
    and d.status not in ('sent', 'failed', 'cancelled');

  if v_remaining = 0 then
    update public.notification_events e
    set status = 'completed',
        updated_at = now()
    where e.id = v_event_id
      and e.status = 'processing';
  end if;

  return true;
end;
$function$;

-- Recuperacao conservadora de lease expirado.
-- Resultado desconhecido nao recebe retry automatico.

create or replace function public.recover_stale_notification_deliveries(
  p_timeout_seconds integer default 300,
  p_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_event public.notification_events%rowtype;
  v_delivery public.notification_deliveries%rowtype;
  v_count integer := 0;
  v_remaining integer;
begin
  if p_timeout_seconds is null
     or p_timeout_seconds < 60
     or p_timeout_seconds > 86400 then
    raise exception 'invalid recovery timeout';
  end if;

  if p_limit is null
     or p_limit < 1
     or p_limit > 1000 then
    raise exception 'invalid recovery limit';
  end if;

  for v_event in
    select e.*
    from public.notification_events e
    where exists (
      select 1
      from public.notification_deliveries d
      where d.event_id = e.id
        and d.status = 'processing'
        and d.locked_at <=
          now() - pg_catalog.make_interval(secs => p_timeout_seconds)
    )
    order by e.id
    for update skip locked
  loop
    exit when v_count >= p_limit;

    for v_delivery in
      select d.*
      from public.notification_deliveries d
      where d.event_id = v_event.id
        and d.status = 'processing'
        and d.locked_at <=
          now() - pg_catalog.make_interval(secs => p_timeout_seconds)
      order by d.locked_at, d.id
      for update skip locked
    loop
      exit when v_count >= p_limit;

      update public.notification_deliveries d
      set
        status =
          case
            when v_event.status = 'cancelled'
              then 'cancelled'
            else 'reconciliation_required'
          end,
        next_attempt_at = d.next_attempt_at,
        last_error =
          case
            when v_event.status = 'cancelled'
              then 'Event cancelled'
            else 'Processing lease expired; reconciliation required'
          end,
        locked_at = null,
        lock_token = null,
        updated_at = now()
      where d.id = v_delivery.id;

      v_count := v_count + 1;
    end loop;

    if v_event.status = 'processing' then
      select count(*)
      into v_remaining
      from public.notification_deliveries d
      where d.event_id = v_event.id
        and d.status not in ('sent', 'failed', 'cancelled');

      if v_remaining = 0 then
        update public.notification_events e
        set status = 'completed',
            updated_at = now()
        where e.id = v_event.id
          and e.status = 'processing';
      end if;
    end if;
  end loop;

  return v_count;
end;
$function$;

-- Preservacao do privilegio minimo.

revoke all on function
  public.complete_notification_delivery(
    uuid, uuid, text, text, text, text, timestamptz
  )
from public, anon, authenticated;

revoke all on function
  public.recover_stale_notification_deliveries(integer, integer)
from public, anon, authenticated;

grant execute on function
  public.complete_notification_delivery(
    uuid, uuid, text, text, text, text, timestamptz
  )
to service_role;

grant execute on function
  public.recover_stale_notification_deliveries(integer, integer)
to service_role;

commit;
