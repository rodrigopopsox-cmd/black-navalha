begin;

-- Comissão sobre serviços concluídos.
-- Independente da comissão de assinatura.
-- O percentual atual do barbeiro só afeta conclusões futuras.
-- O ledger congela base, percentual e valor historicamente.

alter table public.barbers
  add column if not exists service_commission_rate numeric(5,2)
    not null default 0;

alter table public.barbers
  drop constraint if exists barbers_service_commission_rate_valid;

alter table public.barbers
  add constraint barbers_service_commission_rate_valid
  check (
    service_commission_rate >= 0
    and service_commission_rate <= 100
  );


create table if not exists public.service_commission_entries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null
    references public.appointments(id)
    on delete restrict,
  barber_id uuid not null
    references public.barbers(id)
    on delete restrict,
  entry_type text not null
    check (entry_type in ('commission', 'reversal')),
  base_amount numeric(10,2) not null
    check (base_amount >= 0),
  rate numeric(5,2) not null
    check (rate >= 0 and rate <= 100),
  amount numeric(10,2) not null
    check (amount >= 0),
  reverses_entry_id uuid null
    references public.service_commission_entries(id)
    on delete restrict,
  created_at timestamptz not null default now(),

  constraint service_commission_reversal_shape
  check (
    (entry_type = 'commission' and reverses_entry_id is null)
    or
    (entry_type = 'reversal' and reverses_entry_id is not null)
  )
);

create index if not exists service_commission_entries_barber_created_idx
  on public.service_commission_entries(barber_id, created_at);

create index if not exists service_commission_entries_appointment_idx
  on public.service_commission_entries(appointment_id);

create unique index if not exists service_commission_entries_reversal_unique
  on public.service_commission_entries(reverses_entry_id)
  where reverses_entry_id is not null;

alter table public.service_commission_entries enable row level security;


create or replace function public.sync_service_commission_for_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_rate numeric(5,2);
  v_base_amount numeric(10,2);
  v_amount numeric(10,2);
  v_existing_commission public.service_commission_entries%rowtype;
begin
  -- Entrou em completed: cria uma comissão somente se não houver
  -- lançamento vigente (não revertido) para este appointment.
  if new.status = 'completed'
     and old.status is distinct from 'completed' then

    select sce.*
    into v_existing_commission
    from public.service_commission_entries sce
    where sce.appointment_id = new.id
      and sce.entry_type = 'commission'
      and not exists (
        select 1
        from public.service_commission_entries reversal
        where reversal.reverses_entry_id = sce.id
          and reversal.entry_type = 'reversal'
      )
    order by sce.created_at desc, sce.id desc
    limit 1;

    if found then
      return new;
    end if;

    select b.service_commission_rate
    into v_rate
    from public.barbers b
    where b.id = new.barber_id;

    if not found then
      raise exception 'barber not found for service commission';
    end if;

    v_base_amount := round(coalesce(new.price, 0)::numeric, 2);
    v_amount := round((v_base_amount * v_rate) / 100, 2);

    -- Taxa zero ou atendimento sem valor não geram obrigação financeira.
    if v_rate > 0 and v_base_amount > 0 and v_amount > 0 then
      insert into public.service_commission_entries (
        appointment_id,
        barber_id,
        entry_type,
        base_amount,
        rate,
        amount
      )
      values (
        new.id,
        new.barber_id,
        'commission',
        v_base_amount,
        v_rate,
        v_amount
      );
    end if;

    return new;
  end if;

  -- Saiu de completed: preserva histórico criando reversão,
  -- nunca apagando a comissão original.
  if old.status = 'completed'
     and new.status is distinct from 'completed' then

    select sce.*
    into v_existing_commission
    from public.service_commission_entries sce
    where sce.appointment_id = new.id
      and sce.entry_type = 'commission'
      and not exists (
        select 1
        from public.service_commission_entries reversal
        where reversal.reverses_entry_id = sce.id
          and reversal.entry_type = 'reversal'
      )
    order by sce.created_at desc, sce.id desc
    limit 1
    for update;

    if found then
      insert into public.service_commission_entries (
        appointment_id,
        barber_id,
        entry_type,
        base_amount,
        rate,
        amount,
        reverses_entry_id
      )
      values (
        v_existing_commission.appointment_id,
        v_existing_commission.barber_id,
        'reversal',
        v_existing_commission.base_amount,
        v_existing_commission.rate,
        v_existing_commission.amount,
        v_existing_commission.id
      )
      on conflict do nothing;
    end if;

    return new;
  end if;

  return new;
end;
$function$;

revoke all
on function public.sync_service_commission_for_appointment()
from public, anon, authenticated;


drop trigger if exists sync_service_commission_on_appointment_status
on public.appointments;

create trigger sync_service_commission_on_appointment_status
after update of status
on public.appointments
for each row
when (old.status is distinct from new.status)
execute function public.sync_service_commission_for_appointment();

commit;