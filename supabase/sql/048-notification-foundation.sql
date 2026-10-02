-- Fundação interna de notificações do Black Navalha.
--
-- Escopo desta migration:
-- - registrar eventos internos de forma idempotente;
-- - separar evento lógico de entrega por canal;
-- - suportar agendamento futuro e retries;
-- - manter estado/erro de entrega auditável;
-- - permanecer desacoplada de WhatsApp, n8n e fornecedores.
--
-- Esta migration NÃO:
-- - envia mensagens;
-- - cria integração WhatsApp;
-- - cria integração n8n;
-- - confirma pagamentos;
-- - altera regras de appointments, assinaturas ou capacidade.

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),

  idempotency_key text not null,
  event_type text not null,

  entity_type text null,
  entity_id uuid null,

  recipient_type text not null,
  recipient_id uuid not null,

  scheduled_for timestamptz not null default now(),

  payload jsonb not null default '{}'::jsonb,

  status text not null default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notification_events_idempotency_key_not_blank
    check (btrim(idempotency_key) <> ''),

  constraint notification_events_event_type_not_blank
    check (btrim(event_type) <> ''),

  constraint notification_events_recipient_type_not_blank
    check (btrim(recipient_type) <> ''),

  constraint notification_events_entity_reference_consistent
    check (
      (entity_type is null and entity_id is null)
      or
      (
        entity_type is not null
        and btrim(entity_type) <> ''
        and entity_id is not null
      )
    ),

  constraint notification_events_status_valid
    check (
      status in (
        'pending',
        'processing',
        'completed',
        'cancelled'
      )
    ),

  constraint notification_events_idempotency_key_unique
    unique (idempotency_key)
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.notification_events(id)
    on delete restrict,

  channel text not null,
  provider text null,

  status text not null default 'pending',

  attempt_count integer not null default 0,
  max_attempts integer not null default 5,

  next_attempt_at timestamptz not null,

  last_attempt_at timestamptz null,
  locked_at timestamptz null,

  last_error text null,
  provider_message_id text null,

  sent_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notification_deliveries_channel_not_blank
    check (btrim(channel) <> ''),

  constraint notification_deliveries_provider_not_blank
    check (provider is null or btrim(provider) <> ''),

  constraint notification_deliveries_attempt_count_valid
    check (attempt_count >= 0),

  constraint notification_deliveries_max_attempts_valid
    check (max_attempts > 0),

  constraint notification_deliveries_attempts_within_limit
    check (attempt_count <= max_attempts),

  constraint notification_deliveries_status_valid
    check (
      status in (
        'pending',
        'processing',
        'retry',
        'sent',
        'failed',
        'cancelled'
      )
    ),

  constraint notification_deliveries_event_channel_unique
    unique (event_id, channel)
);

create index notification_events_due_idx
  on public.notification_events (scheduled_for, id)
  where status = 'pending';

create index notification_events_entity_idx
  on public.notification_events (entity_type, entity_id)
  where entity_id is not null;

create index notification_events_recipient_idx
  on public.notification_events (recipient_type, recipient_id, created_at desc);

create index notification_deliveries_due_idx
  on public.notification_deliveries (next_attempt_at, id)
  where status in ('pending', 'retry');

create index notification_deliveries_processing_idx
  on public.notification_deliveries (locked_at, id)
  where status = 'processing';

alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

-- A fila interna não é uma API pública.
-- Clientes, barbeiros e demais usuários authenticated não recebem acesso
-- direto às tabelas. Fronteiras server-side específicas serão adicionadas
-- quando produtores/consumidores reais forem implementados.
revoke all on table public.notification_events from public, anon, authenticated;
revoke all on table public.notification_deliveries from public, anon, authenticated;

-- O service_role também recebe somente os privilégios necessários.
-- REVOKE ALL é explícito porque privilégios previamente disponíveis ao papel
-- não são removidos por um GRANT mais restrito.
revoke all on table public.notification_events from service_role;
revoke all on table public.notification_deliveries from service_role;

-- O código interno server-side poderá produzir e processar a fila sem
-- conceder DELETE, TRUNCATE, TRIGGER ou REFERENCES.
-- Eventos e entregas formam histórico operacional.
grant select, insert, update
  on table public.notification_events
  to service_role;

grant select, insert, update
  on table public.notification_deliveries
  to service_role;
