-- Black Navalha
-- Migration 051: auditoria administrativa de reconciliacao.
--
-- ESCOPO INICIAL:
-- Registrar somente verificacoes inconclusivas.
-- Nenhuma transicao de delivery e autorizada.
-- Nenhum retry e agendado.
-- Nenhuma mensagem e enviada.
--
-- Aplicacao remota exige autorizacao separada.

create table public.notification_reconciliation_audit (
  id uuid primary key default gen_random_uuid(),

  operation_id uuid not null unique,

  delivery_id uuid not null
    references public.notification_deliveries(id)
    on delete restrict,

  operator_user_id uuid not null
    references auth.users(id)
    on delete restrict,

  previous_status text not null,
  requested_decision text not null,
  resulting_status text not null,

  evidence text not null,
  evidence_reference text not null,
  reason text not null,

  created_at timestamptz not null default now(),

  constraint notification_reconciliation_audit_status_valid
    check (
      previous_status = 'reconciliation_required'
      and requested_decision = 'reconciliation_required'
      and resulting_status = 'reconciliation_required'
    ),

  constraint notification_reconciliation_audit_evidence_valid
    check (evidence = 'provider_outcome_unknown'),

  constraint notification_reconciliation_audit_reference_valid
    check (
      pg_catalog.length(evidence_reference) between 1 and 200
      and evidence_reference = pg_catalog.btrim(evidence_reference)
    ),

  constraint notification_reconciliation_audit_reason_valid
    check (
      pg_catalog.length(reason) between 1 and 500
      and reason = pg_catalog.btrim(reason)
    )
);

create index notification_reconciliation_audit_delivery_idx
  on public.notification_reconciliation_audit (
    delivery_id,
    created_at
  );

alter table public.notification_reconciliation_audit
  enable row level security;

revoke all on table
  public.notification_reconciliation_audit
from public, anon, authenticated, service_role;

-- Auditoria deve ser append-only.
-- A protecao nao limita administradores privilegiados do banco.

create function public.prevent_notification_reconciliation_audit_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  raise exception 'notification reconciliation audit is immutable';
end;
$function$;

create trigger notification_reconciliation_audit_immutable
before update or delete
on public.notification_reconciliation_audit
for each row
execute function public.prevent_notification_reconciliation_audit_change();

revoke all on function
  public.prevent_notification_reconciliation_audit_change()
from public, anon, authenticated, service_role;

-- A RPC usa a identidade autenticada do PostgreSQL.
-- Nunca aceita operator_user_id fornecido pelo navegador.

create function public.record_notification_reconciliation_unknown(
  p_operation_id uuid,
  p_delivery_id uuid,
  p_evidence_reference text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_operator_id uuid;
  v_event_id uuid;
  v_event public.notification_events%rowtype;
  v_delivery public.notification_deliveries%rowtype;
  v_existing public.notification_reconciliation_audit%rowtype;
  v_audit_id uuid;
begin
  v_operator_id := auth.uid();

  if v_operator_id is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_operator_id
      and p.role = 'admin'
  ) then
    raise exception 'admin authorization required';
  end if;

  if p_operation_id is null or p_delivery_id is null then
    raise exception 'operation and delivery required';
  end if;

  if p_evidence_reference is null
     or pg_catalog.length(p_evidence_reference) not between 1 and 200
     or p_evidence_reference <> pg_catalog.btrim(p_evidence_reference) then
    raise exception 'invalid evidence reference';
  end if;

  if p_reason is null
     or pg_catalog.length(p_reason) not between 1 and 500
     or p_reason <> pg_catalog.btrim(p_reason) then
    raise exception 'invalid reconciliation reason';
  end if;

  -- Serializa repeticoes da mesma operacao.
  -- Nao modifica registros de auditoria anteriores.

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_operation_id::text, 0)
  );

  select a.*
  into v_existing
  from public.notification_reconciliation_audit a
  where a.operation_id = p_operation_id;

  if found then
    if v_existing.delivery_id = p_delivery_id
       and v_existing.operator_user_id = v_operator_id
       and v_existing.evidence_reference = p_evidence_reference
       and v_existing.reason = p_reason
       and v_existing.previous_status = 'reconciliation_required'
       and v_existing.requested_decision = 'reconciliation_required'
       and v_existing.resulting_status = 'reconciliation_required'
       and v_existing.evidence = 'provider_outcome_unknown' then
      return v_existing.id;
    end if;

    raise exception 'reconciliation operation conflict';
  end if;

  -- Descobre o evento sem bloquear a delivery primeiro.

  select d.event_id
  into v_event_id
  from public.notification_deliveries d
  where d.id = p_delivery_id;

  if not found then
    raise exception 'notification delivery not found';
  end if;

  -- Ordem obrigatoria: evento -> delivery.

  select e.*
  into v_event
  from public.notification_events e
  where e.id = v_event_id
  for update;

  if not found or v_event.status = 'cancelled' then
    raise exception 'notification event unavailable';
  end if;

  select d.*
  into v_delivery
  from public.notification_deliveries d
  where d.id = p_delivery_id
  for update;

  if not found
     or v_delivery.event_id <> v_event_id
     or v_delivery.status <> 'reconciliation_required' then
    raise exception 'delivery is not awaiting reconciliation';
  end if;

  insert into public.notification_reconciliation_audit (
    operation_id,
    delivery_id,
    operator_user_id,
    previous_status,
    requested_decision,
    resulting_status,
    evidence,
    evidence_reference,
    reason
  )
  values (
    p_operation_id,
    p_delivery_id,
    v_operator_id,
    'reconciliation_required',
    'reconciliation_required',
    'reconciliation_required',
    'provider_outcome_unknown',
    p_evidence_reference,
    p_reason
  )
  returning id into v_audit_id;

  return v_audit_id;
end;
$function$;

revoke all on function
  public.record_notification_reconciliation_unknown(
    uuid, uuid, text, text
  )
from public, anon, authenticated, service_role;

grant execute on function
  public.record_notification_reconciliation_unknown(
    uuid, uuid, text, text
  )
to authenticated;
