create or replace function public.get_my_subscription()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_customer_id uuid;
  v_subscription_id uuid;
  v_result jsonb;
begin
  if v_user_id is null then
    return null;
  end if;

  select c.id
  into v_customer_id
  from public.customers c
  where c.auth_user_id = v_user_id
  limit 1;

  if v_customer_id is null then
    return null;
  end if;

  select s.id
  into v_subscription_id
  from public.subscriptions s
  where s.customer_id = v_customer_id
    and s.plan_id is not null
  order by
    case s.status
      when 'active' then 0
      when 'paused' then 1
      when 'expired' then 2
      when 'cancelled' then 3
      else 4
    end,
    s.created_at desc
  limit 1;

  if v_subscription_id is null then
    return jsonb_build_object('has_subscription', false);
  end if;

  select jsonb_build_object(
    'has_subscription', true,
    'subscription', jsonb_build_object(
      'name', s.name,
      'status', s.status,
      'starts_at', s.starts_at,
      'expires_at', s.expires_at
    ),
    'plan', case
      when p.id is null then null
      else jsonb_build_object(
        'name', p.name,
        'price', p.price,
        'billing_interval_months', p.billing_interval_months,
        'grace_days', p.grace_days
      )
    end,
    'cycle', case
      when cy.id is null then null
      else jsonb_build_object(
        'period_start', cy.period_start,
        'period_end', cy.period_end,
        'grace_until', cy.grace_until,
        'status', cy.status,
        'price_amount', cy.price_amount,
        'barber_id', cy.barber_id,
        'barber_name', b.name
      )
    end,
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object('name', sv.name)
        order by sv.name
      )
      from public.subscription_services ss
      join public.services sv on sv.id = ss.service_id
      where ss.subscription_id = s.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.subscriptions s
  left join public.subscription_plans p on p.id = s.plan_id
  left join lateral (
    select
      sc.id,
      sc.barber_id,
      sc.period_start,
      sc.period_end,
      sc.grace_until,
      sc.status,
      sc.price_amount
    from public.subscription_cycles sc
    where sc.subscription_id = s.id
    order by sc.period_start desc, sc.created_at desc
    limit 1
  ) cy on true
  left join public.barbers b on b.id = cy.barber_id
  where s.id = v_subscription_id;

  return v_result;
end;
$$;

revoke all on function public.get_my_subscription() from public;
revoke all on function public.get_my_subscription() from anon;
grant execute on function public.get_my_subscription() to authenticated;
