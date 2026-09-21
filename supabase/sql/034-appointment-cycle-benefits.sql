begin;

-- ============================================================
-- BENEFÍCIO DE ASSINATURA CONGELADO POR CICLO
-- ============================================================
--
-- O catálogo do plano pode mudar no Admin, mas um ciclo já pago
-- preserva os serviços contratados em subscription_cycle_services.
--
-- A carência preserva capacidade/vaga, não estende benefícios além
-- do period_end já pago.

create or replace function public.get_subscription_for_appointment_service(
  p_customer_id uuid,
  p_service_id uuid,
  p_appointment_date date
)
returns uuid
language sql
stable
security definer
set search_path = public
as $function$
  select sub.id
  from public.subscriptions sub
  join public.subscription_cycles cy
    on cy.subscription_id = sub.id
  join public.subscription_cycle_services cs
    on cs.cycle_id = cy.id
   and cs.service_id = p_service_id
  where sub.customer_id = p_customer_id
    and sub.status = 'active'
    and cy.status in ('paid', 'grace')
    and cy.period_start <= p_appointment_date
    and cy.period_end >= p_appointment_date
  order by
    cy.period_start desc,
    cy.created_at desc,
    sub.created_at desc
  limit 1;
$function$;

revoke all on function public.get_subscription_for_appointment_service(
  uuid,
  uuid,
  date
) from public, anon, authenticated;

-- A definição atual de create_public_multi_appointment será
-- preservada integralmente e somente as duas buscas de benefício
-- serão direcionadas para o helper acima.

-- ============================================================
-- AGENDAMENTO PÚBLICO — BENEFÍCIO PELO SNAPSHOT DO CICLO
-- ============================================================
--
-- Definição versionada a partir da função vigente no banco.
-- Somente as duas buscas de benefício foram alteradas.

CREATE OR REPLACE FUNCTION public.create_public_multi_appointment(p_customer_name text, p_customer_phone text, p_barber_id uuid, p_service_ids uuid[], p_start_at timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_customer_id uuid;
    v_appointment_id uuid;

    v_total_duration integer;
    v_total_price numeric(10,2);

    v_end_at timestamptz;

    v_day_of_week integer;
    v_local_start time;
    v_local_end time;
    v_appointment_date date;

    v_first_service_id uuid;

    v_requested_count integer;
    v_valid_count integer;

    v_service record;
    v_subscription_id uuid;
begin

    -- CLIENTE

    if length(trim(p_customer_name)) < 2 then
        raise exception 'Nome inválido';
    end if;

    if length(
        regexp_replace(
            p_customer_phone,
            '\D',
            '',
            'g'
        )
    ) < 10 then
        raise exception 'Telefone inválido';
    end if;


    -- SERVIÇOS

    if p_service_ids is null
       or cardinality(p_service_ids) = 0 then

        raise exception
        'Selecione pelo menos um serviço';

    end if;


    -- IMPEDE IDs DUPLICADOS

    if cardinality(p_service_ids) <>
       (
           select count(distinct value)
           from unnest(p_service_ids)
           as t(value)
       ) then

        raise exception
        'Serviços duplicados';

    end if;


    v_requested_count :=
        cardinality(p_service_ids);


    -- BARBEIRO

    if not exists (
        select 1
        from public.barbers
        where id = p_barber_id
          and active = true
    ) then

        raise exception
        'Profissional indisponível';

    end if;


    -- CONFIRMA QUE O BARBEIRO REALIZA
    -- TODOS OS SERVIÇOS

    select count(*)
    into v_valid_count

    from public.services s

    join public.barber_services bs
      on bs.service_id = s.id
     and bs.barber_id = p_barber_id

    where s.id = any(p_service_ids)
      and s.active = true;


    if v_valid_count <> v_requested_count then

        raise exception
        'O profissional não realiza todos os serviços selecionados';

    end if;


    -- DURAÇÃO TOTAL

    select
        coalesce(
            sum(s.duration_minutes),
            0
        )::integer

    into v_total_duration

    from public.services s

    where s.id = any(p_service_ids)
      and s.active = true;


    if v_total_duration <= 0 then

        raise exception
        'Serviços inválidos';

    end if;


    -- PRIMEIRO SERVIÇO
    -- Mantém compatibilidade com appointments.service_id

    select s.id
    into v_first_service_id

    from public.services s

    where s.id = any(p_service_ids)
      and s.active = true

    order by s.name

    limit 1;


    -- FIM DO ATENDIMENTO

    v_end_at :=
        p_start_at +
        make_interval(
            mins => v_total_duration
        );


    -- NÃO PERMITE PASSADO

    if p_start_at <= now() then

        raise exception
        'Este horário já passou';

    end if;


    -- DATA LOCAL DO AGENDAMENTO

    v_appointment_date :=
        (
            p_start_at
            at time zone 'America/Sao_Paulo'
        )::date;


    -- HORÁRIO LOCAL DE SÃO PAULO

    v_day_of_week :=
        extract(
            dow from
            p_start_at
            at time zone 'America/Sao_Paulo'
        )::integer;


    v_local_start :=
        (
            p_start_at
            at time zone 'America/Sao_Paulo'
        )::time;


    v_local_end :=
        (
            v_end_at
            at time zone 'America/Sao_Paulo'
        )::time;


    -- JORNADA

    if not exists (
        select 1

        from public.working_hours

        where barber_id = p_barber_id
          and day_of_week = v_day_of_week
          and active = true
          and start_time <= v_local_start
          and end_time >= v_local_end
    ) then

        raise exception
        'Horário fora da jornada do profissional';

    end if;


    -- BLOQUEIOS

    if exists (
        select 1

        from public.blocked_times

        where barber_id = p_barber_id

          and tstzrange(
                start_at,
                end_at,
                '[)'
              )
              &&
              tstzrange(
                p_start_at,
                v_end_at,
                '[)'
              )
    ) then

        raise exception
        'Horário indisponível';

    end if;


    -- CLIENTE EXISTENTE

    select id
    into v_customer_id

    from public.customers

    where regexp_replace(
        phone,
        '\D',
        '',
        'g'
    )
    =
    regexp_replace(
        p_customer_phone,
        '\D',
        '',
        'g'
    )

    order by created_at

    limit 1;


    if v_customer_id is null then

        insert into public.customers (
            name,
            phone
        )

        values (
            trim(p_customer_name),
            trim(p_customer_phone)
        )

        returning id
        into v_customer_id;

    else

        update public.customers

        set name = trim(p_customer_name)

        where id = v_customer_id;

    end if;


    -- =====================================================
    -- VALIDA ASSINATURAS E CALCULA PREÇO REAL
    -- =====================================================

    v_total_price := 0;


    for v_service in

        select
            s.id,
            s.price,
            s.subscriber_service

        from public.services s

        where s.id = any(p_service_ids)
          and s.active = true

    loop

        if v_service.subscriber_service = true then

            v_subscription_id := null;


            -- Procura assinatura válida PARA A DATA
            -- DO AGENDAMENTO e que contenha este serviço.

            select public.get_subscription_for_appointment_service(
                v_customer_id,
                v_service.id,
                v_appointment_date
            )
            into v_subscription_id;


            if v_subscription_id is null then

                raise exception
                'Este serviço é exclusivo para assinantes. Não encontramos uma assinatura ativa para este WhatsApp.';

            end if;

            -- Serviço coberto não soma preço.

        else

            -- Serviço comum mantém preço normal.

            v_total_price :=
                v_total_price +
                coalesce(v_service.price, 0);

        end if;

    end loop;


    -- AGENDAMENTO

    insert into public.appointments (
        customer_id,
        barber_id,
        service_id,
        start_at,
        end_at,
        price,
        status
    )

    values (
        v_customer_id,
        p_barber_id,
        v_first_service_id,
        p_start_at,
        v_end_at,
        v_total_price,
        'scheduled'
    )

    returning id
    into v_appointment_id;


    -- =====================================================
    -- SERVIÇOS DO AGENDAMENTO
    -- =====================================================

    for v_service in

        select
            s.id,
            s.name,
            s.price,
            s.duration_minutes,
            s.subscriber_service

        from public.services s

        where s.id = any(p_service_ids)
          and s.active = true

    loop

        v_subscription_id := null;


        if v_service.subscriber_service = true then

            select public.get_subscription_for_appointment_service(
                v_customer_id,
                v_service.id,
                v_appointment_date
            )
            into v_subscription_id;

        end if;


        insert into public.appointment_services (
            appointment_id,
            service_id,
            service_name,
            price,
            duration_minutes,
            subscription_id
        )

        values (
            v_appointment_id,
            v_service.id,
            v_service.name,

            case
                when v_service.subscriber_service = true
                    then 0
                else v_service.price
            end,

            v_service.duration_minutes,
            v_subscription_id
        );

    end loop;


    return v_appointment_id;


exception

    when exclusion_violation then

        raise exception
        'Este horário acabou de ser reservado por outra pessoa';

end;
$function$;



commit;