# CONTEXTO-PROJETO — Black Navalha

Última atualização: 2026-09-04

## Projeto

Projeto: Black Navalha

Repositório:
https://github.com/rodrigopopsox-cmd/black-navalha

Branch principal:
main

Diretório local:
C:\Users\Digo Nego\black-navalha

Stack:
- Next.js 16.3.4
- React 19.2.8
- TypeScript
- Supabase / PostgreSQL
- @supabase/ssr
- lucide-react
- CSS próprio
- Tailwind CSS 4 instalado

IMPORTANTE:
- Respeitar AGENTS.md.
- Antes de alterações relacionadas às APIs/convenções do Next.js 16, consultar a documentação local indicada em AGENTS.md.
- Nunca registrar senhas, tokens, chaves ou conteúdo de .env.local neste arquivo.

---

## REGRA PRINCIPAL DE CONTINUIDADE

Este projeto já está em andamento.

NÃO reiniciar a análise do zero.

NÃO refazer funcionalidades registradas neste documento como concluídas sem evidência concreta de defeito.

NÃO pedir novamente verificações que estejam registradas como concluídas.

NÃO reconstruir a integração entre assinaturas e agendamentos: ela já está funcional.

Quando faltar informação sobre uma implementação atual:
- consultar somente o arquivo necessário;
- ou executar somente a consulta SQL mínima necessária.

Git representa o estado oficial do código.

Fluxo de trabalho:

ESTADO ATUAL
→ próxima tarefa
→ implementação
→ teste
→ confirmação
→ Git checkpoint
→ atualizar CONTEXTO-PROJETO.md
→ próxima tarefa

Antes de alterações de risco:

git status

Depois de uma funcionalidade concluída e testada:

git add .
git commit -m "descricao clara da etapa"
git push

Não pedir commits para cada pequena alteração.

---

## GIT — ESTADO CONFIRMADO

Verificado em 2026-09-04:

Branch:

main

Estado:

sincronizada com origin/main

Commit atual:

9e86fcf Projeto Black Navalha - estado atual

Resultado de:

git status

- nenhuma alteração rastreada pendente;
- existe somente CODIGO-COMPLETO.txt como untracked.

CODIGO-COMPLETO.txt não faz parte atualmente do estado versionado.

Não adicionar, apagar ou alterar CODIGO-COMPLETO.txt sem necessidade específica.

O histórico observado possui somente o commit:

9e86fcf Projeto Black Navalha - estado atual

Portanto não usar o histórico de commits para tentar separar implementações anteriores desse snapshot.

---

## Autenticação e Admin

CONCLUÍDO E EXISTENTE:

- autenticação administrativa via Supabase Auth;
- autorização usando profiles.role = admin;
- usuários não autenticados são enviados para /login;
- usuários sem role admin também são enviados para /login.

Arquivo principal:
- app/admin/layout.tsx

Tabela:
- profiles

---

## Barbeiros

CONCLUÍDO E EXISTENTE:

- cadastro;
- listagem;
- status ativo/inativo;
- serviços realizados por barbeiro;
- jornada semanal.

Arquivos principais:
- app/admin/barbeiros/page.tsx
- app/admin/barbeiros/novo/page.tsx
- app/admin/barbeiros/[id]/servicos/page.tsx
- app/admin/barbeiros/[id]/servicos/barber-services-form.tsx
- app/admin/barbeiros/[id]/horarios/page.tsx
- app/admin/barbeiros/[id]/horarios/working-hours-form.tsx

Tabelas:
- barbers
- barber_services
- working_hours

---

## Assinaturas

CONCLUÍDO E EXISTENTE:

- cadastro de assinatura;
- edição de assinatura;
- listagem de assinantes;
- cliente;
- WhatsApp;
- nome do plano;
- início;
- validade;
- status;
- serviços incluídos.

Status utilizados:
- active
- paused
- cancelled
- expired

Arquivos principais:
- app/admin/assinantes/page.tsx
- app/admin/assinantes/novo/page.tsx
- app/admin/assinantes/novo/subscription-form.tsx
- app/admin/assinantes/[id]/page.tsx
- app/admin/assinantes/[id]/subscription-edit-form.tsx

Tabelas:
- customers
- subscriptions
- subscription_services
- services

Campos conhecidos de subscriptions:
- id
- customer_id
- name
- status
- starts_at
- expires_at
- created_at

subscription_services relaciona:
- subscription_id
- service_id

---

## Serviços de plano

A tabela services possui:

subscriber_service

Quando:

subscriber_service = true

o serviço é destinado ao uso por assinaturas.

No agendamento público esses serviços aparecem como:

PLANO

No cadastro e edição de assinaturas somente serviços ativos com:

subscriber_service = true

são apresentados para inclusão no plano.

IMPORTANTE:

A indicação visual PLANO não concede benefício por si só.

O benefício depende da validação da assinatura do cliente.

Um serviço que aparece por R$ 0,00 para assinante elegível NÃO é um produto gratuito independente.

O valor R$ 0,00 representa um serviço já incluído no pagamento mensal da assinatura.

Sem assinatura válida/ativa aplicável, o cliente não deve conseguir utilizar indevidamente esse benefício.

---

## Agendamento público

CONCLUÍDO E EXISTENTE:

Rota:

/agendar

Fluxo:

1. seleção de serviços;
2. seleção do profissional;
3. seleção da data;
4. seleção do horário;
5. confirmação;
6. sucesso.

Suporta múltiplos serviços no mesmo agendamento.

Arquivos principais:
- app/agendar/page.tsx
- app/agendar/booking-flow.tsx
- app/globals.css

O sistema filtra barbeiros capazes de executar TODOS os serviços selecionados.

A duração total é a soma de:

duration_minutes

dos serviços selecionados.

Disponibilidade utiliza:
- working_hours
- barber_services
- get_busy_periods

A criação do agendamento utiliza:
- create_public_multi_appointment

Parâmetros historicamente confirmados dessa RPC:
- p_customer_name
- p_customer_phone
- p_barber_id
- p_service_ids
- p_start_at

---

## Integração ASSINATURAS + AGENDAMENTO

STATUS ATUAL:

CONCLUÍDA E FUNCIONAL.

NÃO RECONSTRUIR ESSA FUNCIONALIDADE DO ZERO.

Foi confirmado anteriormente diretamente no banco que a RPC:

create_public_multi_appointment

implementa validações e criação do agendamento.

Comportamentos confirmados:

- validação do nome do cliente;
- validação do telefone;
- normalização do WhatsApp;
- identificação/localização do cliente;
- validação dos serviços;
- rejeição de IDs duplicados;
- validação de barbeiro ativo;
- validação de que o barbeiro executa os serviços;
- cálculo da duração total;
- rejeição de agendamento no passado;
- cálculo de data local usando America/Sao_Paulo;
- validação da jornada;
- validação de blocked_times;
- validação de serviços subscriber_service;
- assinatura válida necessária para benefício do plano;
- validação do status da assinatura;
- validação de starts_at;
- validação de expires_at;
- validade considerando a DATA DO AGENDAMENTO;
- validação do vínculo em subscription_services;
- serviço coberto pelo plano com preço R$ 0,00;
- serviço comum mantendo preço normal;
- combinação de serviço comum + serviço PLANO;
- cálculo do total no backend;
- gravação do total em appointments.price;
- gravação dos serviços em appointment_services;
- registro histórico da assinatura utilizada em appointment_services.subscription_id;
- proteção contra conflitos de horário.

---

## Regra de benefício do plano

A regra funcional confirmada é:

Somente assinatura válida e com status:

active

concede o benefício.

Status como:

paused
cancelled
expired

não concedem o benefício.

Para um serviço de assinatura, também são considerados:
- cliente identificado;
- serviço pertencente ao plano;
- starts_at;
- expires_at;
- data futura do atendimento;
- relacionamento em subscription_services.

Quando o benefício é válido:

appointment_services.price = 0

e a assinatura utilizada é historicamente associada ao serviço.

Esse R$ 0,00 significa que o serviço está incluído no pagamento mensal do assinante.

Não significa serviço gratuito para qualquer cliente.

Clientes comuns continuam pagando normalmente pelos serviços comuns.

O sistema também suporta combinação de:
- benefício do plano;
- serviços comuns pagos.

---

## PREÇO NO FRONTEND — ESTADO ATUAL ATUALIZADO

IMPORTANTE:

A versão anterior deste CONTEXTO-PROJETO.md registrava como pendência que o frontend poderia mostrar um total incorreto para assinantes.

ESSA PENDÊNCIA NÃO DEVE MAIS SER TRATADA COMO ABERTA.

Em outro trabalho já realizado, o fluxo foi ajustado.

Confirmação funcional fornecida em 2026-09-04:

Na tela de confirmação do agendamento, um cliente com assinatura mensal ativa e serviço coberto visualizou:

Valor total:
R$ 0,00

O serviço demonstrado foi:

Barba Assinante Mensal

Também foi demonstrado que, na seleção dos serviços, os serviços de assinatura aparecem como:

PLANO

e o total do serviço coberto aparece como:

R$ 0,00

A integração de pagamento/preço entre cliente comum e assinante mensal já foi realizada segundo confirmação do responsável pelo projeto.

Portanto:

NÃO criar outra solução de cotação apenas porque a versão antiga deste documento dizia que isso estava pendente.

NÃO criar uma nova RPC de cotação sem primeiro verificar o estado atual caso uma necessidade real apareça.

NÃO voltar a implementar o cálculo de assinatura no frontend.

Se futuramente for necessário alterar essa área, primeiro verificar a implementação atual específica no código/banco.

---

## Observação sobre booking-flow.tsx recebido neste chat

Durante este chat foi fornecido um conteúdo de:

app/agendar/booking-flow.tsx

no qual existia cálculo local:

totalPrice

somando:

Number(service.price)

Entretanto, posteriormente foi confirmado pelo responsável e demonstrado visualmente que a versão funcional atual do sistema já apresenta R$ 0,00 corretamente para o assinante elegível.

Portanto existe uma possível diferença entre:
- o conteúdo de arquivo enviado anteriormente ao chat;
- e o estado/fluxo funcional demonstrado posteriormente.

NÃO concluir automaticamente que existe bug.

Se uma futura tarefa depender especificamente da implementação de preço atual, verificar SOMENTE o arquivo atual necessário e/ou a RPC atual pertinente antes de modificar.

---

## Autoridade sobre preços e benefícios

DECISÃO DE ARQUITETURA MANTIDA:

PostgreSQL/Supabase/backend é a autoridade sobre a concessão do benefício da assinatura.

Não confiar apenas em informação visual do React.

Não duplicar desnecessariamente no React toda a regra de autorização de assinatura.

O frontend pode apresentar o resultado, mas a concessão real do benefício deve permanecer protegida no backend.

---

## Registro histórico da assinatura

DECISÃO DE ARQUITETURA CONFIRMADA:

A assinatura utilizada é registrada por serviço em:

appointment_services.subscription_id

Não adicionar:

appointments.subscription_id

sem nova necessidade arquitetural.

Isso permite que um mesmo agendamento contenha:
- serviço comum;
- serviço de plano;
- múltiplos serviços;
- preços históricos individuais.

---

## Schema confirmado — appointments

Schema consultado diretamente no Supabase em 2026-09-04.

Tabela:

appointments

Colunas confirmadas:

- id uuid NOT NULL
- customer_id uuid NOT NULL
- barber_id uuid NOT NULL
- service_id uuid NOT NULL
- start_at timestamptz NOT NULL
- end_at timestamptz NOT NULL
- price numeric NOT NULL
- status text NOT NULL
- notes text NULL
- created_at timestamptz NOT NULL

appointments.price armazena o preço total do agendamento calculado pelo backend.

---

## Schema confirmado — appointment_services

Schema consultado diretamente no Supabase em 2026-09-04.

Tabela:

appointment_services

Colunas confirmadas:

- id uuid NOT NULL
- appointment_id uuid NOT NULL
- service_id uuid NOT NULL
- service_name text NOT NULL
- price numeric NOT NULL
- duration_minutes integer NOT NULL
- created_at timestamptz NOT NULL
- subscription_id uuid NULL

Para serviço coberto por assinatura:

price = 0

e:

subscription_id = assinatura utilizada

Para serviço comum:

price = preço normal

e normalmente:

subscription_id = null

---

## Banco / Supabase conhecido

Tabelas conhecidas pelo código e consultas anteriores:

- profiles
- services
- barbers
- barber_services
- working_hours
- customers
- subscriptions
- subscription_services
- appointments
- appointment_services
- blocked_times

RPCs historicamente conhecidas:
- get_busy_periods
- create_public_multi_appointment

IMPORTANTE:

Podem existir atualmente outras RPCs/funções criadas depois das verificações antigas.

Não presumir que não existem.

Também não inventar nomes ou assinaturas.

Quando uma futura tarefa depender delas, fazer somente a consulta SQL mínima necessária.

Não presumir sem consulta:
- índices adicionais;
- constraints adicionais;
- triggers;
- policies;
- funções adicionais;
- RPCs adicionais.

---

## create_public_multi_appointment

Definição consultada anteriormente no Supabase.

Assinatura que estava confirmada na consulta:

create_public_multi_appointment(
    p_customer_name text,
    p_customer_phone text,
    p_barber_id uuid,
    p_service_ids uuid[],
    p_start_at timestamptz
)

Na consulta realizada anteriormente, o retorno observado era:

uuid

correspondendo ao:

appointment_id

ATENÇÃO:

Como houve implementação posterior relacionada à apresentação correta do preço, não assumir que essa assinatura/retorno continua necessariamente idêntica se uma nova tarefa depender disso.

Antes de modificar essa RPC no futuro, consultar sua definição ATUAL no banco.

Não reconstruí-la do zero.

---

## SQL versionado

VERIFICAÇÃO MAIS RECENTE:

Em 2026-09-04 foi executada consulta local para verificar:

supabase/sql/

Resultado:

supabase/sql NAO EXISTE

Portanto, no estado local confirmado neste momento:

supabase/sql/

ainda não existe.

Não criar migrations antigas artificialmente apenas para documentar alterações passadas.

REGRA DAQUI PARA FRENTE:

Na próxima alteração REAL e permanente de banco, criar:

supabase/sql/

e salvar o SQL correspondente.

Exemplo:

supabase/sql/001-nome-da-alteracao.sql

Toda nova alteração envolvendo:
- tabelas;
- colunas;
- índices;
- constraints;
- triggers;
- policies;
- RPCs;
- funções

deverá possuir arquivo correspondente em:

supabase/sql/

Nunca registrar credenciais.

---

## Arquivos importantes conhecidos

Admin:
- app/admin/layout.tsx
- app/admin/page.tsx

Barbeiros:
- app/admin/barbeiros/page.tsx
- app/admin/barbeiros/novo/page.tsx
- app/admin/barbeiros/[id]/servicos/page.tsx
- app/admin/barbeiros/[id]/servicos/barber-services-form.tsx
- app/admin/barbeiros/[id]/horarios/page.tsx
- app/admin/barbeiros/[id]/horarios/working-hours-form.tsx

Assinaturas:
- app/admin/assinantes/page.tsx
- app/admin/assinantes/novo/page.tsx
- app/admin/assinantes/novo/subscription-form.tsx
- app/admin/assinantes/[id]/page.tsx
- app/admin/assinantes/[id]/subscription-edit-form.tsx

Agendamento:
- app/agendar/page.tsx
- app/agendar/booking-flow.tsx

Supabase:
- lib/supabase/client.ts
- lib/supabase/server.ts

Estilos:
- app/globals.css

Configuração:
- AGENTS.md
- package.json
- tsconfig.json
- next.config.ts

Memória:
- CONTEXTO-PROJETO.md

Arquivo local não rastreado:
- CODIGO-COMPLETO.txt

---

## Decisões de arquitetura consolidadas

- PostgreSQL/Supabase/backend é autoridade sobre benefícios da assinatura.
- Não confiar somente no React para autorização.
- WhatsApp normalizado é utilizado para identificação do cliente na integração existente.
- Validade da assinatura considera a data do atendimento.
- Somente assinatura active concede benefício.
- subscription_services define os serviços cobertos.
- Serviço coberto custa R$ 0,00 no agendamento porque está incluído na mensalidade.
- R$ 0,00 não significa produto gratuito disponível para qualquer cliente.
- Cliente sem benefício válido não deve obter serviço do plano indevidamente.
- Serviços comuns mantêm seus preços normais.
- Um agendamento pode combinar serviços comuns e serviços de plano.
- appointments.price registra o total.
- appointment_services.price registra preço histórico individual.
- appointment_services.subscription_id registra a assinatura usada no benefício.
- Não adicionar appointments.subscription_id sem nova necessidade.
- Não reconstruir create_public_multi_appointment do zero.
- Não reconstruir integração de preço/assinatura já funcional.
- Código React/TypeScript permanece em .ts/.tsx.
- SQL futuro deve ser versionado em supabase/sql/.
- CONTEXTO-PROJETO.md é a memória entre chats.
- Git representa o estado oficial do código.

---

# CONCLUÍDO NESTE CHAT

1. Foi lido o CONTEXTO-PROJETO.md anterior.

2. Foi analisado o conteúdo fornecido de:

app/agendar/booking-flow.tsx

3. Inicialmente foi identificada, com base no documento antigo, a aparente pendência de preço de assinante no frontend.

4. Antes de qualquer alteração, o responsável informou que essa funcionalidade já havia sido implementada em outros trabalhos/chats.

5. Foi confirmado pelo responsável que:
- cliente comum e assinante mensal já possuem tratamento de preço implementado;
- assinatura precisa estar ativa para conceder o benefício;
- sem benefício válido não deve ser possível obter indevidamente o serviço de plano por R$ 0,00;
- o serviço R$ 0,00 está incluído no pagamento mensal da assinatura.

6. Foram fornecidas evidências visuais do fluxo funcionando.

7. A tela de seleção demonstrou serviços de assinatura marcados como:

PLANO

8. A tela de confirmação demonstrou:

Barba Assinante Mensal

com:

Valor total: R$ 0,00

para cliente identificado no fluxo demonstrado.

9. Decidido NÃO criar novamente uma RPC de cotação e NÃO reconstruir a integração já concluída.

10. Foi verificado o estado atual do Git.

11. Foi verificada a existência de supabase/sql/.

---

# TESTES / VERIFICAÇÕES REALIZADOS

Git:

Executado:

git status

Resultado:

- branch main;
- sincronizada com origin/main;
- CODIGO-COMPLETO.txt como untracked;
- nenhuma alteração rastreada pendente.

Executado:

git log --oneline -10

Resultado:

9e86fcf (HEAD -> main, origin/main) Projeto Black Navalha - estado atual

SQL local:

Verificado:

supabase/sql/

Resultado:

supabase/sql NAO EXISTE

Validação funcional informada/demonstrada:

- serviço PLANO visível no agendamento;
- assinante mensal ativo consegue utilizar serviço incluído;
- preço apresentado para serviço coberto: R$ 0,00;
- regra de R$ 0,00 corresponde a serviço incluído na mensalidade;
- integração de cliente comum + assinante foi informada como já concluída.

---

# ARQUIVOS CRIADOS/ALTERADOS NESTE CHAT

Até antes desta atualização:

Nenhum arquivo de código foi alterado neste chat.

Agora deverá ser substituído:

- CONTEXTO-PROJETO.md

por esta versão atualizada.

Nenhuma alteração deve ser feita em:

CODIGO-COMPLETO.txt

---

# ALTERAÇÕES SUPABASE/SQL NESTE CHAT

Nenhuma.

Nenhum SQL foi executado neste chat.

Nenhuma RPC foi criada neste chat.

Nenhuma tabela/coluna/constraint/policy foi alterada neste chat.

supabase/sql/ continua inexistente no estado verificado.

---

# COMMITS

Commit atual confirmado:

9e86fcf Projeto Black Navalha - estado atual

HEAD:
main

origin/main:
sincronizado com main

Nenhum novo commit foi criado durante as verificações deste chat.

A atualização deste CONTEXTO-PROJETO.md ainda precisa ser salva antes de decidir se haverá checkpoint documental.

---

# ESTADO ATUAL

Projeto está em estado estável no Git no commit:

9e86fcf

A integração principal de:
- assinaturas;
- serviços PLANO;
- benefício de R$ 0,00;
- cliente comum;
- assinante mensal ativo;
- agendamento;

deve ser considerada CONCLUÍDA.

Não retomar a antiga pendência de totalPrice automaticamente.

O documento antigo estava desatualizado nesse ponto.

Não há alteração de código pendente identificada neste chat.

Existe apenas:

CODIGO-COMPLETO.txt

como arquivo untracked, que deve ser ignorado salvo necessidade específica.

supabase/sql/ ainda não existe.

---

# CONCLUÍDO NESTE CHAT — INÍCIO DO DASHBOARD REAL

Foi iniciada uma nova funcionalidade após a conclusão da integração de assinaturas/agendamento.

Objetivo escolhido:

Transformar o dashboard administrativo atualmente estático em um dashboard com dados reais do Supabase, começando pela:

Agenda de hoje

Arquivo principal:

app/admin/page.tsx

Antes da alteração foi inspecionado o conteúdo atual de:

app/admin/page.tsx

Estado encontrado:

- página "Visão Geral" já existe;
- card "Agendamentos hoje" estava fixo em 0;
- card "Faturamento hoje" estava fixo em R$ 0,00;
- card "Clientes" estava fixo em 0;
- card "Barbeiros ativos" estava fixo em 0;
- seção "Agenda de hoje" mostrava estado vazio fixo;
- nenhum dado real do Supabase era carregado nessa página.

Também foi inspecionado:

lib/supabase/server.ts

Confirmado que existe:

createClient()

assíncrono usando:

createServerClient
cookies()
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Esse client pode ser utilizado em Server Components.

---

# VERIFICAÇÕES SUPABASE REALIZADAS

Foi executada consulta somente de leitura para conhecer os status atualmente utilizados em:

public.appointments

Consulta:

select
  status,
  count(*) as quantidade
from public.appointments
group by status
order by status;

Resultado observado:

status:
scheduled

quantidade:
7

Neste momento, o único status encontrado nos registros existentes é:

scheduled

Não criar novos status ou regras de status com base somente nisso sem necessidade funcional.

Também foi consultada a existência das foreign keys de:

appointments
appointment_services

Resultado confirmado:

appointment_services.appointment_id
→ appointments.id

appointment_services.service_id
→ services.id

appointment_services.subscription_id
→ subscriptions.id

appointments.barber_id
→ barbers.id

appointments.customer_id
→ customers.id

appointments.service_id
→ services.id

Essas consultas foram somente leitura.

Nenhuma alteração foi feita no Supabase.

---

# IMPLEMENTAÇÃO INICIADA

Foi preparada uma alteração em:

app/admin/page.tsx

Objetivo dessa alteração:

- transformar AdminPage em async Server Component;
- utilizar createClient() de lib/supabase/server.ts;
- carregar os agendamentos do dia;
- considerar timezone America/Sao_Paulo;
- filtrar agendamentos com status scheduled;
- mostrar quantidade real de agendamentos do dia;
- calcular faturamento do dia usando appointments.price;
- contar clientes;
- contar barbeiros ativos;
- listar a Agenda de hoje;
- mostrar horário;
- cliente;
- profissional;
- serviços de appointment_services;
- valor do agendamento.

A alteração foi salva no arquivo, porém AINDA NÃO ESTÁ CONCLUÍDA.

NÃO fazer commit dessa implementação antes de corrigir e testar.

---

# ERRO ATUAL

Após substituir app/admin/page.tsx pela primeira implementação do dashboard real, o VS Code apresentou erro TypeScript TS2352.

O erro ocorre aproximadamente na conversão:

(appointmentsResult.data ?? []) as TodayAppointment[]

O tipo manual atualmente declarou:

customers: {
  name: string;
  phone: string | null;
} | null;

barbers: {
  name: string;
} | null;

Porém o tipo inferido pela consulta atual do Supabase está retornando os relacionamentos como arrays:

customers: {
  name: any;
  phone: any;
}[]

barbers: {
  name: any;
}[]

Mensagem principal observada:

Conversion of type ... to type 'TodayAppointment[]' may be a mistake...

e:

Types of property 'customers' are incompatible.

O tipo:

{ name: any; phone: any; }[]

não é compatível com:

{ name: string; phone: string | null; } | null

Portanto o problema imediato é de tipagem/formato dos relacionamentos retornados pela query.

NÃO reiniciar a implementação.

NÃO refazer as consultas de status ou foreign keys.

NÃO alterar banco para corrigir esse erro.

Corrigir somente a consulta/tipagem/consumo dos relacionamentos em app/admin/page.tsx.

---

# TESTES REALIZADOS NESTA ETAPA

Ainda NÃO existe teste final bem-sucedido dessa funcionalidade.

O erro TypeScript foi detectado antes da conclusão.

O build ainda precisa ser executado com sucesso após a correção.

Depois do build, o dashboard deverá ser validado visualmente em:

/admin

Verificar:
- agendamentos de hoje;
- faturamento de hoje;
- quantidade de clientes;
- barbeiros ativos;
- lista Agenda de hoje;
- horário;
- cliente;
- profissional;
- serviços;
- valor.

---

# ARQUIVOS ALTERADOS NESTA ETAPA

Alterado e ainda NÃO concluído:

app/admin/page.tsx

CONTEXTO-PROJETO.md será alterado agora somente para registrar este checkpoint intermediário.

Nenhum outro arquivo de código precisa ser alterado neste momento.

CODIGO-COMPLETO.txt continua untracked e não deve ser incluído.

---

# ALTERAÇÕES SUPABASE/SQL NESTA ETAPA

Nenhuma.

Foram realizadas somente consultas de leitura.

Nenhuma tabela foi alterada.

Nenhuma coluna foi alterada.

Nenhuma RPC foi alterada/criada.

Nenhuma policy foi alterada.

supabase/sql/ continua inexistente.

Não criar supabase/sql/ apenas por causa das consultas de leitura.

---

# COMMITS

Último checkpoint estável enviado anteriormente:

6c8aa76 Corrige proximo passo do contexto

A implementação atual de:

app/admin/page.tsx

NÃO deve ser commitada enquanto estiver com erro.

Se for feito um commit agora, deve incluir SOMENTE a atualização de CONTEXTO-PROJETO.md, preservando app/admin/page.tsx como modificação local não commitada.

---

# ESTADO ATUAL

Integração de assinaturas + agendamento:

CONCLUÍDA.
NÃO mexer.

Nova funcionalidade:

Dashboard administrativo com dados reais.

Status:

EM IMPLEMENTAÇÃO.

Banco:

Nenhuma alteração permanente nesta etapa.

Problema atual:

Erro TypeScript TS2352 causado pela incompatibilidade entre o tipo manual TodayAppointment e os relacionamentos customers/barbers inferidos como arrays pelo Supabase.

app/admin/page.tsx contém a implementação iniciada e deve ser corrigido a partir do estado atual, não refeito do zero.

---

# CONCLUÍDO NESTE CHAT — INÍCIO DO DASHBOARD REAL

Foi iniciada uma nova funcionalidade após a conclusão da integração de assinaturas/agendamento.

Objetivo escolhido:

Transformar o dashboard administrativo atualmente estático em um dashboard com dados reais do Supabase, começando pela:

Agenda de hoje

Arquivo principal:

app/admin/page.tsx

Antes da alteração foi inspecionado o conteúdo atual de:

app/admin/page.tsx

Estado encontrado:

- página "Visão Geral" já existe;
- card "Agendamentos hoje" estava fixo em 0;
- card "Faturamento hoje" estava fixo em R$ 0,00;
- card "Clientes" estava fixo em 0;
- card "Barbeiros ativos" estava fixo em 0;
- seção "Agenda de hoje" mostrava estado vazio fixo;
- nenhum dado real do Supabase era carregado nessa página.

Também foi inspecionado:

lib/supabase/server.ts

Confirmado que existe:

createClient()

assíncrono usando:

createServerClient
cookies()
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Esse client pode ser utilizado em Server Components.

---

# VERIFICAÇÕES SUPABASE REALIZADAS

Foi executada consulta somente de leitura para conhecer os status atualmente utilizados em:

public.appointments

Consulta:

select
  status,
  count(*) as quantidade
from public.appointments
group by status
order by status;

Resultado observado:

status:
scheduled

quantidade:
7

Neste momento, o único status encontrado nos registros existentes é:

scheduled

Não criar novos status ou regras de status com base somente nisso sem necessidade funcional.

Também foi consultada a existência das foreign keys de:

appointments
appointment_services

Resultado confirmado:

appointment_services.appointment_id
→ appointments.id

appointment_services.service_id
→ services.id

appointment_services.subscription_id
→ subscriptions.id

appointments.barber_id
→ barbers.id

appointments.customer_id
→ customers.id

appointments.service_id
→ services.id

Essas consultas foram somente leitura.

Nenhuma alteração foi feita no Supabase.

---

# IMPLEMENTAÇÃO INICIADA

Foi preparada uma alteração em:

app/admin/page.tsx

Objetivo dessa alteração:

- transformar AdminPage em async Server Component;
- utilizar createClient() de lib/supabase/server.ts;
- carregar os agendamentos do dia;
- considerar timezone America/Sao_Paulo;
- filtrar agendamentos com status scheduled;
- mostrar quantidade real de agendamentos do dia;
- calcular faturamento do dia usando appointments.price;
- contar clientes;
- contar barbeiros ativos;
- listar a Agenda de hoje;
- mostrar horário;
- cliente;
- profissional;
- serviços de appointment_services;
- valor do agendamento.

A alteração foi salva no arquivo, porém AINDA NÃO ESTÁ CONCLUÍDA.

NÃO fazer commit dessa implementação antes de corrigir e testar.

---

# ERRO ATUAL

Após substituir app/admin/page.tsx pela primeira implementação do dashboard real, o VS Code apresentou erro TypeScript TS2352.

O erro ocorre aproximadamente na conversão:

(appointmentsResult.data ?? []) as TodayAppointment[]

O tipo manual atualmente declarou:

customers: {
  name: string;
  phone: string | null;
} | null;

barbers: {
  name: string;
} | null;

Porém o tipo inferido pela consulta atual do Supabase está retornando os relacionamentos como arrays:

customers: {
  name: any;
  phone: any;
}[]

barbers: {
  name: any;
}[]

Mensagem principal observada:

Conversion of type ... to type 'TodayAppointment[]' may be a mistake...

e:

Types of property 'customers' are incompatible.

O tipo:

{ name: any; phone: any; }[]

não é compatível com:

{ name: string; phone: string | null; } | null

Portanto o problema imediato é de tipagem/formato dos relacionamentos retornados pela query.

NÃO reiniciar a implementação.

NÃO refazer as consultas de status ou foreign keys.

NÃO alterar banco para corrigir esse erro.

Corrigir somente a consulta/tipagem/consumo dos relacionamentos em app/admin/page.tsx.

---

# TESTES REALIZADOS NESTA ETAPA

Ainda NÃO existe teste final bem-sucedido dessa funcionalidade.

O erro TypeScript foi detectado antes da conclusão.

O build ainda precisa ser executado com sucesso após a correção.

Depois do build, o dashboard deverá ser validado visualmente em:

/admin

Verificar:
- agendamentos de hoje;
- faturamento de hoje;
- quantidade de clientes;
- barbeiros ativos;
- lista Agenda de hoje;
- horário;
- cliente;
- profissional;
- serviços;
- valor.

---

# ARQUIVOS ALTERADOS NESTA ETAPA

Alterado e ainda NÃO concluído:

app/admin/page.tsx

CONTEXTO-PROJETO.md será alterado agora somente para registrar este checkpoint intermediário.

Nenhum outro arquivo de código precisa ser alterado neste momento.

CODIGO-COMPLETO.txt continua untracked e não deve ser incluído.

---

# ALTERAÇÕES SUPABASE/SQL NESTA ETAPA

Nenhuma.

Foram realizadas somente consultas de leitura.

Nenhuma tabela foi alterada.

Nenhuma coluna foi alterada.

Nenhuma RPC foi alterada/criada.

Nenhuma policy foi alterada.

supabase/sql/ continua inexistente.

Não criar supabase/sql/ apenas por causa das consultas de leitura.

---

# COMMITS

Último checkpoint estável enviado anteriormente:

6c8aa76 Corrige proximo passo do contexto

A implementação atual de:

app/admin/page.tsx

NÃO deve ser commitada enquanto estiver com erro.

Se for feito um commit agora, deve incluir SOMENTE a atualização de CONTEXTO-PROJETO.md, preservando app/admin/page.tsx como modificação local não commitada.

---

# ESTADO ATUAL

Integração de assinaturas + agendamento:

CONCLUÍDA.
NÃO mexer.

Nova funcionalidade:

Dashboard administrativo com dados reais.

Status:

EM IMPLEMENTAÇÃO.

Banco:

Nenhuma alteração permanente nesta etapa.

Problema atual:

Erro TypeScript TS2352 causado pela incompatibilidade entre o tipo manual TodayAppointment e os relacionamentos customers/barbers inferidos como arrays pelo Supabase.

app/admin/page.tsx contém a implementação iniciada e deve ser corrigido a partir do estado atual, não refeito do zero.

---

# CONCLUÍDO NESTE CHAT — INÍCIO DO DASHBOARD REAL

Foi iniciada uma nova funcionalidade após a conclusão da integração de assinaturas/agendamento.

Objetivo escolhido:

Transformar o dashboard administrativo atualmente estático em um dashboard com dados reais do Supabase, começando pela:

Agenda de hoje

Arquivo principal:

app/admin/page.tsx

Antes da alteração foi inspecionado o conteúdo atual de:

app/admin/page.tsx

Estado encontrado:

- página "Visão Geral" já existe;
- card "Agendamentos hoje" estava fixo em 0;
- card "Faturamento hoje" estava fixo em R$ 0,00;
- card "Clientes" estava fixo em 0;
- card "Barbeiros ativos" estava fixo em 0;
- seção "Agenda de hoje" mostrava estado vazio fixo;
- nenhum dado real do Supabase era carregado nessa página.

Também foi inspecionado:

lib/supabase/server.ts

Confirmado que existe:

createClient()

assíncrono usando:

createServerClient
cookies()
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Esse client pode ser utilizado em Server Components.

---

# VERIFICAÇÕES SUPABASE REALIZADAS

Foi executada consulta somente de leitura para conhecer os status atualmente utilizados em:

public.appointments

Consulta:

select
  status,
  count(*) as quantidade
from public.appointments
group by status
order by status;

Resultado observado:

status:
scheduled

quantidade:
7

Neste momento, o único status encontrado nos registros existentes é:

scheduled

Não criar novos status ou regras de status com base somente nisso sem necessidade funcional.

Também foi consultada a existência das foreign keys de:

appointments
appointment_services

Resultado confirmado:

appointment_services.appointment_id
→ appointments.id

appointment_services.service_id
→ services.id

appointment_services.subscription_id
→ subscriptions.id

appointments.barber_id
→ barbers.id

appointments.customer_id
→ customers.id

appointments.service_id
→ services.id

Essas consultas foram somente leitura.

Nenhuma alteração foi feita no Supabase.

---

# IMPLEMENTAÇÃO INICIADA

Foi preparada uma alteração em:

app/admin/page.tsx

Objetivo dessa alteração:

- transformar AdminPage em async Server Component;
- utilizar createClient() de lib/supabase/server.ts;
- carregar os agendamentos do dia;
- considerar timezone America/Sao_Paulo;
- filtrar agendamentos com status scheduled;
- mostrar quantidade real de agendamentos do dia;
- calcular faturamento do dia usando appointments.price;
- contar clientes;
- contar barbeiros ativos;
- listar a Agenda de hoje;
- mostrar horário;
- cliente;
- profissional;
- serviços de appointment_services;
- valor do agendamento.

A alteração foi salva no arquivo, porém AINDA NÃO ESTÁ CONCLUÍDA.

NÃO fazer commit dessa implementação antes de corrigir e testar.

---

# ERRO ATUAL

Após substituir app/admin/page.tsx pela primeira implementação do dashboard real, o VS Code apresentou erro TypeScript TS2352.

O erro ocorre aproximadamente na conversão:

(appointmentsResult.data ?? []) as TodayAppointment[]

O tipo manual atualmente declarou:

customers: {
  name: string;
  phone: string | null;
} | null;

barbers: {
  name: string;
} | null;

Porém o tipo inferido pela consulta atual do Supabase está retornando os relacionamentos como arrays:

customers: {
  name: any;
  phone: any;
}[]

barbers: {
  name: any;
}[]

Mensagem principal observada:

Conversion of type ... to type 'TodayAppointment[]' may be a mistake...

e:

Types of property 'customers' are incompatible.

O tipo:

{ name: any; phone: any; }[]

não é compatível com:

{ name: string; phone: string | null; } | null

Portanto o problema imediato é de tipagem/formato dos relacionamentos retornados pela query.

NÃO reiniciar a implementação.

NÃO refazer as consultas de status ou foreign keys.

NÃO alterar banco para corrigir esse erro.

Corrigir somente a consulta/tipagem/consumo dos relacionamentos em app/admin/page.tsx.

---

# TESTES REALIZADOS NESTA ETAPA

Ainda NÃO existe teste final bem-sucedido dessa funcionalidade.

O erro TypeScript foi detectado antes da conclusão.

O build ainda precisa ser executado com sucesso após a correção.

Depois do build, o dashboard deverá ser validado visualmente em:

/admin

Verificar:
- agendamentos de hoje;
- faturamento de hoje;
- quantidade de clientes;
- barbeiros ativos;
- lista Agenda de hoje;
- horário;
- cliente;
- profissional;
- serviços;
- valor.

---

# ARQUIVOS ALTERADOS NESTA ETAPA

Alterado e ainda NÃO concluído:

app/admin/page.tsx

CONTEXTO-PROJETO.md será alterado agora somente para registrar este checkpoint intermediário.

Nenhum outro arquivo de código precisa ser alterado neste momento.

CODIGO-COMPLETO.txt continua untracked e não deve ser incluído.

---

# ALTERAÇÕES SUPABASE/SQL NESTA ETAPA

Nenhuma.

Foram realizadas somente consultas de leitura.

Nenhuma tabela foi alterada.

Nenhuma coluna foi alterada.

Nenhuma RPC foi alterada/criada.

Nenhuma policy foi alterada.

supabase/sql/ continua inexistente.

Não criar supabase/sql/ apenas por causa das consultas de leitura.

---

# COMMITS

Último checkpoint estável enviado anteriormente:

6c8aa76 Corrige proximo passo do contexto

A implementação atual de:

app/admin/page.tsx

NÃO deve ser commitada enquanto estiver com erro.

Se for feito um commit agora, deve incluir SOMENTE a atualização de CONTEXTO-PROJETO.md, preservando app/admin/page.tsx como modificação local não commitada.

---

# ESTADO ATUAL

Integração de assinaturas + agendamento:

CONCLUÍDA.
NÃO mexer.

Nova funcionalidade:

Dashboard administrativo com dados reais.

Status:

EM IMPLEMENTAÇÃO.

Banco:

Nenhuma alteração permanente nesta etapa.

Problema atual:

Erro TypeScript TS2352 causado pela incompatibilidade entre o tipo manual TodayAppointment e os relacionamentos customers/barbers inferidos como arrays pelo Supabase.

app/admin/page.tsx contém a implementação iniciada e deve ser corrigido a partir do estado atual, não refeito do zero.

---

# CONCLUÍDO NESTE CHAT — INÍCIO DO DASHBOARD REAL

Foi iniciada uma nova funcionalidade após a conclusão da integração de assinaturas/agendamento.

Objetivo escolhido:

Transformar o dashboard administrativo atualmente estático em um dashboard com dados reais do Supabase, começando pela:

Agenda de hoje

Arquivo principal:

app/admin/page.tsx

Antes da alteração foi inspecionado o conteúdo atual de:

app/admin/page.tsx

Estado encontrado:

- página "Visão Geral" já existe;
- card "Agendamentos hoje" estava fixo em 0;
- card "Faturamento hoje" estava fixo em R$ 0,00;
- card "Clientes" estava fixo em 0;
- card "Barbeiros ativos" estava fixo em 0;
- seção "Agenda de hoje" mostrava estado vazio fixo;
- nenhum dado real do Supabase era carregado nessa página.

Também foi inspecionado:

lib/supabase/server.ts

Confirmado que existe:

createClient()

assíncrono usando:

createServerClient
cookies()
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Esse client pode ser utilizado em Server Components.

---

# VERIFICAÇÕES SUPABASE REALIZADAS

Foi executada consulta somente de leitura para conhecer os status atualmente utilizados em:

public.appointments

Consulta:

select
  status,
  count(*) as quantidade
from public.appointments
group by status
order by status;

Resultado observado:

status:
scheduled

quantidade:
7

Neste momento, o único status encontrado nos registros existentes é:

scheduled

Não criar novos status ou regras de status com base somente nisso sem necessidade funcional.

Também foi consultada a existência das foreign keys de:

appointments
appointment_services

Resultado confirmado:

appointment_services.appointment_id
→ appointments.id

appointment_services.service_id
→ services.id

appointment_services.subscription_id
→ subscriptions.id

appointments.barber_id
→ barbers.id

appointments.customer_id
→ customers.id

appointments.service_id
→ services.id

Essas consultas foram somente leitura.

Nenhuma alteração foi feita no Supabase.

---

# IMPLEMENTAÇÃO INICIADA

Foi preparada uma alteração em:

app/admin/page.tsx

Objetivo dessa alteração:

- transformar AdminPage em async Server Component;
- utilizar createClient() de lib/supabase/server.ts;
- carregar os agendamentos do dia;
- considerar timezone America/Sao_Paulo;
- filtrar agendamentos com status scheduled;
- mostrar quantidade real de agendamentos do dia;
- calcular faturamento do dia usando appointments.price;
- contar clientes;
- contar barbeiros ativos;
- listar a Agenda de hoje;
- mostrar horário;
- cliente;
- profissional;
- serviços de appointment_services;
- valor do agendamento.

A alteração foi salva no arquivo, porém AINDA NÃO ESTÁ CONCLUÍDA.

NÃO fazer commit dessa implementação antes de corrigir e testar.

---

# ERRO ATUAL

Após substituir app/admin/page.tsx pela primeira implementação do dashboard real, o VS Code apresentou erro TypeScript TS2352.

O erro ocorre aproximadamente na conversão:

(appointmentsResult.data ?? []) as TodayAppointment[]

O tipo manual atualmente declarou:

customers: {
  name: string;
  phone: string | null;
} | null;

barbers: {
  name: string;
} | null;

Porém o tipo inferido pela consulta atual do Supabase está retornando os relacionamentos como arrays:

customers: {
  name: any;
  phone: any;
}[]

barbers: {
  name: any;
}[]

Mensagem principal observada:

Conversion of type ... to type 'TodayAppointment[]' may be a mistake...

e:

Types of property 'customers' are incompatible.

O tipo:

{ name: any; phone: any; }[]

não é compatível com:

{ name: string; phone: string | null; } | null

Portanto o problema imediato é de tipagem/formato dos relacionamentos retornados pela query.

NÃO reiniciar a implementação.

NÃO refazer as consultas de status ou foreign keys.

NÃO alterar banco para corrigir esse erro.

Corrigir somente a consulta/tipagem/consumo dos relacionamentos em app/admin/page.tsx.

---

# TESTES REALIZADOS NESTA ETAPA

Ainda NÃO existe teste final bem-sucedido dessa funcionalidade.

O erro TypeScript foi detectado antes da conclusão.

O build ainda precisa ser executado com sucesso após a correção.

Depois do build, o dashboard deverá ser validado visualmente em:

/admin

Verificar:
- agendamentos de hoje;
- faturamento de hoje;
- quantidade de clientes;
- barbeiros ativos;
- lista Agenda de hoje;
- horário;
- cliente;
- profissional;
- serviços;
- valor.

---

# ARQUIVOS ALTERADOS NESTA ETAPA

Alterado e ainda NÃO concluído:

app/admin/page.tsx

CONTEXTO-PROJETO.md será alterado agora somente para registrar este checkpoint intermediário.

Nenhum outro arquivo de código precisa ser alterado neste momento.

CODIGO-COMPLETO.txt continua untracked e não deve ser incluído.

---

# ALTERAÇÕES SUPABASE/SQL NESTA ETAPA

Nenhuma.

Foram realizadas somente consultas de leitura.

Nenhuma tabela foi alterada.

Nenhuma coluna foi alterada.

Nenhuma RPC foi alterada/criada.

Nenhuma policy foi alterada.

supabase/sql/ continua inexistente.

Não criar supabase/sql/ apenas por causa das consultas de leitura.

---

# COMMITS

Último checkpoint estável enviado anteriormente:

6c8aa76 Corrige proximo passo do contexto

A implementação atual de:

app/admin/page.tsx

NÃO deve ser commitada enquanto estiver com erro.

Se for feito um commit agora, deve incluir SOMENTE a atualização de CONTEXTO-PROJETO.md, preservando app/admin/page.tsx como modificação local não commitada.

---

# ESTADO ATUAL

Integração de assinaturas + agendamento:

CONCLUÍDA.
NÃO mexer.

Nova funcionalidade:

Dashboard administrativo com dados reais.

Status:

EM IMPLEMENTAÇÃO.

Banco:

Nenhuma alteração permanente nesta etapa.

Problema atual:

Erro TypeScript TS2352 causado pela incompatibilidade entre o tipo manual TodayAppointment e os relacionamentos customers/barbers inferidos como arrays pelo Supabase.

app/admin/page.tsx contém a implementação iniciada e deve ser corrigido a partir do estado atual, não refeito do zero.

---

# PRÓXIMO PASSO EXATO

Abrir o estado atual de:

app/admin/page.tsx

e corrigir somente o erro TypeScript relacionado aos relacionamentos retornados pelo Supabase.

Estado conhecido do erro:

customers está sendo inferido como array:

{ name; phone }[]

barbers está sendo inferido como array:

{ name }[]

enquanto TodayAppointment espera objetos únicos.

Escolher a solução mais simples e segura compatível com o retorno real do Supabase.

NÃO executar novamente as consultas SQL de status ou foreign keys.

NÃO alterar o banco.

Depois da correção:

1. executar npm run build;
2. se o build passar, testar /admin visualmente;
3. conferir os quatro cards;
4. conferir a Agenda de hoje;
5. somente depois fazer Git checkpoint da funcionalidade;
6. atualizar CONTEXTO-PROJETO.md com o resultado final.

---

# ATUALIZAÇÃO FINAL — DASHBOARD ADMINISTRATIVO COM DADOS REAIS

Data: 2026-09-04

Este bloco mais recente substitui os registros anteriores que indicavam que o dashboard estava EM IMPLEMENTAÇÃO ou com erro TS2352.

## FUNCIONALIDADE CONCLUÍDA

Foi concluída a primeira etapa do dashboard administrativo com dados reais do Supabase.

Arquivo alterado:

- app/admin/page.tsx

Implementação concluída:

- AdminPage transformada em async Server Component;
- utilização de createClient() de lib/supabase/server.ts;
- carregamento dos agendamentos do dia;
- intervalo do dia considerando America/Sao_Paulo;
- filtro dos agendamentos com status scheduled;
- quantidade real de agendamentos de hoje;
- faturamento de hoje calculado com appointments.price;
- contagem real de clientes;
- contagem real de barbeiros ativos;
- seção Agenda de hoje;
- preparação da listagem com horário, cliente, profissional, serviços e valor;
- estado vazio quando não existem agendamentos no dia.

## CORREÇÃO TYPESCRIPT

O erro TS2352 relacionado aos relacionamentos customers e barbers foi corrigido.

O retorno inferido pelo Supabase para esses relacionamentos é um array.

O tipo TodayAppointment foi ajustado para:

- customers como array;
- barbers como array.

O consumo no JSX foi ajustado para acessar com segurança o primeiro relacionamento:

- appointment.customers[0]?.name;
- appointment.barbers[0]?.name.

Nenhuma alteração de banco foi necessária.

## BUILD REALIZADO

Executado:

npm run build

Resultado:

- compilação concluída com sucesso;
- TypeScript concluído sem erros;
- geração das páginas concluída;
- rota /admin reconhecida como dinâmica;
- nenhum erro de build.

## TESTE VISUAL REALIZADO

Rota testada:

/admin

Endereço local utilizado:

http://localhost:3000/admin

Resultado observado:

- página Visão Geral carregada corretamente;
- Agendamentos hoje: 0;
- Faturamento hoje: R$ 0,00;
- Clientes: 4;
- Barbeiros ativos: 1;
- Agenda de hoje exibiu corretamente o estado vazio;
- mensagem exibida: Nenhum agendamento hoje.

Não havia agendamento no dia durante o teste. Por isso, as linhas com horário, cliente, profissional, serviços e valor não foram exercitadas visualmente, e nenhum dado artificial foi criado no banco apenas para o teste.

## ALTERAÇÕES SUPABASE/SQL

Nenhuma.

- nenhuma tabela alterada;
- nenhuma coluna alterada;
- nenhuma RPC alterada ou criada;
- nenhuma policy alterada;
- nenhum SQL executado;
- supabase/sql/ continua inexistente.

As consultas anteriores de status e foreign keys não foram repetidas.

## GIT CHECKPOINT

Commit da funcionalidade:

61e026c Implementa dashboard administrativo com dados reais

Push realizado com sucesso:

main → origin/main

O arquivo CODIGO-COMPLETO.txt continua untracked e não foi incluído no commit.

## ESTADO ATUAL

Dashboard administrativo com dados reais:

CONCLUÍDO E TESTADO.

Erro TypeScript TS2352:

RESOLVIDO.

Build:

APROVADO.

Teste visual de /admin:

APROVADO para o estado atual sem agendamentos no dia.

Integração de assinaturas + agendamento:

CONTINUA CONCLUÍDA E NÃO FOI ALTERADA.

Banco de dados:

NENHUMA ALTERAÇÃO PERMANENTE.

## PRÓXIMO PASSO EXATO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois do checkpoint documental, verificar que o Git ficou limpo, exceto por CODIGO-COMPLETO.txt como untracked.

Somente depois iniciar uma nova etapa funcional do projeto.

---

# CHECKPOINT — AGENDA ADMINISTRATIVA

Data: 2026-09-04

Status:

CONCLUÍDA a primeira versão da página:

app/admin/agenda/page.tsx

Rota:

/admin/agenda

Objetivo desta versão:

Visualização somente leitura dos agendamentos do dia atual.

Implementado:

- nova rota /admin/agenda;
- Server Component;
- integração com Supabase usando createClient();
- filtro dos agendamentos do dia;
- timezone America/Sao_Paulo;
- ordenação por start_at;
- quantidade de agendamentos do dia;
- horário inicial e final;
- cliente;
- telefone do cliente;
- profissional;
- serviços via appointment_services;
- valor;
- status;
- estado vazio quando não existem agendamentos.

Nenhuma funcionalidade de edição ou cancelamento foi adicionada nesta etapa.

Documentação local do Next.js 16 consultada conforme AGENTS.md:

node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md

Foi confirmado que a rota aninhada deve ser criada com:

app/admin/agenda/page.tsx

e utiliza automaticamente o layout de:

app/admin/layout.tsx

## TESTES

Executado:

npm run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript concluído sem erros;
- rota /admin/agenda reconhecida pelo build como dinâmica.

Teste visual realizado em:

http://localhost:3000/admin/agenda

Resultado observado em 2026-09-04:

- página carregou corretamente;
- data apresentada: sexta-feira, 04 de setembro de 2026;
- quantidade: 0 agendamentos;
- estado vazio apresentado corretamente;
- layout/sidebar administrativo preservado.

Não havia agendamento na data do teste.

Por isso, a renderização com dados de horário, cliente, profissional, serviços e valor ainda não foi validada visualmente com um registro real.

Não foram criados dados artificiais no banco apenas para esse teste.

## BANCO / SUPABASE

Nenhuma alteração permanente.

Nenhuma tabela, coluna, RPC, policy, constraint ou função foi modificada.

supabase/sql/ continua sem necessidade de criação nesta etapa.

As consultas de schema/status já documentadas anteriormente NÃO foram repetidas.

## GIT

Commit da funcionalidade:

8eaed25 Cria pagina da Agenda administrativa de hoje

Push realizado com sucesso para:

origin/main

CODIGO-COMPLETO.txt continua untracked e não deve ser versionado.

## ESTADO ATUAL

Integração assinaturas + agendamento:

CONCLUÍDA.

Dashboard administrativo:

CONCLUÍDO.

Agenda administrativa — visualização do dia:

CONCLUÍDA.

Nenhuma tarefa funcional está atualmente em implementação.

## PRÓXIMO PASSO EXATO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Depois verificar git status.

Somente após o checkpoint documental iniciar a próxima funcionalidade administrativa, uma etapa por vez.

---

# CHECKPOINT — CLIENTES ADMINISTRATIVO

Data: 2026-09-04

Status:

CONCLUÍDA a primeira versão da página administrativa de clientes.

Arquivo:

app/admin/clientes/page.tsx

Rota:

/admin/clientes

Implementado:

- Server Component;
- leitura de clientes reais do Supabase;
- ordenação por nome;
- quantidade total exibida;
- nome;
- WhatsApp com formatação visual;
- e-mail;
- observações;
- data de cadastro;
- layout responsivo em cards;
- estado vazio quando não existirem clientes.

Esta etapa é somente leitura.

Não foram implementados:
- cadastro administrativo de cliente;
- edição;
- exclusão;
- busca/filtros.

Schema de public.customers confirmado por consulta somente leitura:

- id uuid NOT NULL
- name text NOT NULL
- phone text NOT NULL
- email text NULL
- notes text NULL
- created_at timestamptz NOT NULL

Não repetir essa consulta sem nova necessidade.

## TESTES

Executado:

npm run build

Resultado:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /admin/clientes reconhecida como rota dinâmica.

Teste visual realizado em:

http://localhost:3000/admin/clientes

Resultado:

APROVADO.

Foram exibidos 4 clientes reais.

Foi identificada inicialmente largura excessiva da tabela. Antes do checkpoint, a página foi ajustada para cards responsivos.

Após o ajuste:
- nenhum campo ficou cortado;
- nomes exibidos;
- WhatsApp formatado;
- e-mail exibido;
- cadastro exibido;
- observações exibidas;
- quatro clientes visíveis.

Novo npm run build após o ajuste:

APROVADO.

## BANCO / SUPABASE

Nenhuma alteração permanente.

Foi executada somente consulta de leitura ao schema de customers.

Nenhuma tabela, coluna, RPC, policy, função ou constraint foi modificada.

supabase/sql/ não precisou ser criado.

## GIT

Commit da funcionalidade:

3994cc6 Cria listagem administrativa de clientes

Push realizado com sucesso para origin/main.

CODIGO-COMPLETO.txt continua untracked e não deve ser versionado.

## ESTADO ATUAL

Integração assinaturas + agendamento:

CONCLUÍDA.

Dashboard administrativo:

CONCLUÍDO.

Agenda administrativa do dia:

CONCLUÍDA.

Listagem administrativa de clientes:

CONCLUÍDA.

## PRÓXIMO PASSO EXATO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Depois executar git status.

Somente depois iniciar outra funcionalidade administrativa, uma etapa por vez.

---

# CHECKPOINT FINAL DA SESSÃO — 2026-09-04

Este é o checkpoint mais recente e deve ter prioridade sobre blocos antigos deste documento caso exista alguma divergência.

## GIT ATUAL

Branch:

main

Último commit funcional criado nesta sessão:

e234442 Cria listagem administrativa de servicos

Commits recentes relevantes:

e234442 Cria listagem administrativa de servicos
af80cc3 Registra conclusao da listagem de clientes
3994cc6 Cria listagem administrativa de clientes
d989be2 Registra conclusao da Agenda administrativa
8eaed25 Cria pagina da Agenda administrativa de hoje
f75190f Registra conclusao do dashboard administrativo
61e026c Implementa dashboard administrativo com dados reais

Após o push de e234442:

main foi enviado com sucesso para origin/main.

CODIGO-COMPLETO.txt continua untracked e NÃO deve ser versionado.

Depois de salvar este checkpoint, criar também um commit documental e fazer push.

---

# ESTADO FUNCIONAL CONSOLIDADO

## Assinaturas + agendamento

CONCLUÍDO anteriormente.

NÃO reconstruir.

A integração existente entre:
- clientes;
- assinaturas;
- serviços PLANO;
- preço R$ 0,00 para benefício válido;
- serviços comuns;
- agendamento;

continua considerada funcional.

Backend/Supabase continua sendo autoridade sobre concessão do benefício.

Nenhuma alteração dessa integração foi feita nesta sessão.

---

# DASHBOARD ADMINISTRATIVO

Rota:

/admin

Status:

CONCLUÍDO.

Commit funcional:

61e026c Implementa dashboard administrativo com dados reais

Implementado:

- dados reais do Supabase;
- agendamentos de hoje;
- faturamento de hoje;
- quantidade de clientes;
- barbeiros ativos;
- Agenda de hoje;
- timezone America/Sao_Paulo;
- somente appointments.status = scheduled considerado nos indicadores do dia.

Erro TS2352 dos relacionamentos customers/barbers foi resolvido.

Build aprovado.

Teste visual aprovado para o estado existente no dia, quando não havia agendamentos hoje.

---

# AGENDA ADMINISTRATIVA

Rota:

/admin/agenda

Arquivo:

app/admin/agenda/page.tsx

Status:

CONCLUÍDA a primeira versão somente leitura.

Commit funcional:

8eaed25 Cria pagina da Agenda administrativa de hoje

Commit documental:

d989be2 Registra conclusao da Agenda administrativa

Implementado:

- Server Component;
- agendamentos do dia;
- timezone America/Sao_Paulo;
- horário inicial/final;
- cliente;
- telefone;
- barbeiro;
- serviços;
- valor;
- status;
- estado vazio.

Build aprovado.

Teste visual aprovado para o estado sem agendamentos no dia.

Não foram criados dados artificiais apenas para testar a lista preenchida.

Nenhuma edição/cancelamento foi implementada nessa etapa.

---

# CLIENTES ADMINISTRATIVO

Rota:

/admin/clientes

Arquivo:

app/admin/clientes/page.tsx

Status:

CONCLUÍDA a primeira versão somente leitura.

Commit funcional:

3994cc6 Cria listagem administrativa de clientes

Commit documental:

af80cc3 Registra conclusao da listagem de clientes

Implementado:

- leitura de customers;
- quantidade total;
- nome;
- WhatsApp;
- formatação visual do telefone;
- e-mail;
- observações;
- data de cadastro;
- ordenação por nome;
- layout responsivo em cards;
- estado vazio.

Schema de public.customers confirmado em consulta somente leitura:

- id uuid NOT NULL
- name text NOT NULL
- phone text NOT NULL
- email text NULL
- notes text NULL
- created_at timestamptz NOT NULL

NÃO repetir essa consulta sem nova necessidade.

Durante o teste a primeira tabela ficou larga e cortava campos.

Isso foi corrigido ANTES do commit substituindo a apresentação por cards responsivos.

Build final aprovado.

Teste visual final aprovado com 4 clientes reais.

Não foram implementados:
- criação administrativa de cliente;
- edição;
- exclusão;
- filtros/busca.

Nenhuma alteração de banco.

---

# SERVIÇOS ADMINISTRATIVO

Rota:

/admin/servicos

Arquivo:

app/admin/servicos/page.tsx

Status:

CONCLUÍDA a primeira versão somente leitura.

Commit funcional:

e234442 Cria listagem administrativa de servicos

Implementado:

- Server Component;
- leitura de services;
- ordenação por nome;
- card com quantidade de serviços cadastrados;
- card com quantidade de serviços ativos;
- card com quantidade de serviços de plano;
- nome;
- categoria;
- preço;
- duração;
- descrição;
- status ATIVO/INATIVO;
- identificação visual PLANO quando subscriber_service = true;
- layout responsivo em cards;
- estado vazio.

Schema de public.services confirmado em consulta somente leitura:

- id uuid NOT NULL
- name text NOT NULL
- description text NULL
- category text NOT NULL
- price numeric NOT NULL
- duration_minutes integer NOT NULL
- subscriber_service boolean NOT NULL
- active boolean NOT NULL
- created_at timestamptz NOT NULL

NÃO repetir essa consulta sem nova necessidade.

Teste visual realizado com dados reais.

Resultado observado:

- 24 serviços cadastrados;
- 24 serviços ativos;
- 4 serviços de plano;
- cards de resumo visíveis;
- serviços comuns com preço/duração;
- serviços subscriber_service identificados com selo PLANO;
- exemplo observado: Barba Assinante Mensal com PLANO e R$ 0,00;
- layout visual aprovado.

Executado:

npm run build

Resultado:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /admin/servicos reconhecida como rota dinâmica.

Nenhuma alteração de banco foi feita.

---

# DOCUMENTAÇÃO NEXT.JS 16 CONSULTADA

AGENTS.md foi respeitado antes da criação das novas rotas.

Foi consultado:

node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md

Foi confirmado o uso de:

app/<segmento>/page.tsx

para criação de rotas aninhadas no App Router.

Não é necessário repetir essa mesma leitura para criar outra rota simples equivalente, salvo nova necessidade relacionada a outra API/convenção do Next.js 16.

---

# SUPABASE / BANCO NESTA SESSÃO

Nenhuma alteração permanente de banco foi realizada.

Foram feitas somente consultas de leitura necessárias para conhecer schemas.

Schema de customers já registrado acima.

Schema de services já registrado acima.

As consultas antigas de:
- status de appointments;
- foreign keys de appointments;
- foreign keys de appointment_services;

já estavam realizadas e NÃO foram repetidas.

Nenhuma RPC foi alterada.

Nenhuma tabela foi alterada.

Nenhuma coluna foi alterada.

Nenhuma policy foi alterada.

Nenhuma constraint foi alterada.

supabase/sql/ continua sem necessidade de criação porque não houve alteração real de banco.

Na próxima alteração REAL de banco, versionar obrigatoriamente o SQL em:

supabase/sql/

---

# ROTAS ADMIN ATUALMENTE CONCLUÍDAS/EXISTENTES

/admin
Dashboard real — concluído.

/admin/agenda
Agenda do dia somente leitura — concluída.

/admin/barbeiros
Funcionalidade existente anteriormente.

/admin/barbeiros/novo
Existente anteriormente.

/admin/barbeiros/[id]/servicos
Existente anteriormente.

/admin/barbeiros/[id]/horarios
Existente anteriormente.

/admin/assinantes
Existente anteriormente.

/admin/assinantes/novo
Existente anteriormente.

/admin/assinantes/[id]
Existente anteriormente.

/admin/clientes
Listagem somente leitura — concluída nesta sessão.

/admin/servicos
Listagem somente leitura — concluída nesta sessão.

---

# ITENS DO MENU AINDA NÃO IMPLEMENTADOS/CONFIRMADOS

No menu administrativo existem links para:

/admin/bloqueios
/admin/configuracoes

Essas rotas ainda não foram trabalhadas nesta sequência.

Antes de implementá-las:
- testar a URL;
- se for 404, confirmar que não existe;
- verificar somente o schema/arquivo específico necessário;
- não fazer auditoria geral.

---

# TESTES FINAIS DESTA SESSÃO

Build aprovado após Agenda.

Build aprovado após Clientes.

Build aprovado após ajuste responsivo de Clientes.

Build aprovado após Serviços.

Páginas testadas visualmente:

/admin
/admin/agenda
/admin/clientes
/admin/servicos

Nenhuma funcionalidade foi commitada com erro conhecido.

---

# REGRAS PARA O PRÓXIMO CHAT

Usar este CONTEXTO-PROJETO.md como fonte principal.

NÃO reiniciar análise do zero.

NÃO reconstruir assinaturas + agendamento.

NÃO refazer:
- dashboard;
- Agenda administrativa;
- Clientes administrativo;
- Serviços administrativo.

NÃO repetir consultas de schema de customers/services.

NÃO repetir consultas já registradas de status/FKs.

CODIGO-COMPLETO.txt deve continuar ignorado.

Trabalhar UMA ETAPA POR VEZ.

Antes de nova API/convenção específica do Next.js 16, respeitar AGENTS.md e consultar a documentação local relevante.

Git representa o estado oficial.

---

# PRÓXIMO PASSO EXATO PARA O NOVO CHAT

Primeiro confirmar que este checkpoint documental está no Git e que:

git status

mostra somente:

CODIGO-COMPLETO.txt

como untracked.

Depois iniciar a próxima funcionalidade:

BLOQUEIOS ADMINISTRATIVOS

Primeiro abrir/testar:

http://localhost:3000/admin/bloqueios

Se retornar 404, considerar a rota ainda não criada.

Depois, antes de implementar, verificar somente o schema necessário de:

public.blocked_times

Não alterar banco.

Criar inicialmente uma página de visualização/gestão compatível com o schema real existente.

Trabalhar uma etapa por vez.

Depois:
implementação → npm run build → teste visual → Git checkpoint → atualizar CONTEXTO-PROJETO.md.

Não avançar automaticamente para Configurações antes de concluir Bloqueios.
---

# CHECKPOINT INTERMEDIÁRIO — BLOQUEIOS ADMINISTRATIVOS

Data: 2026-09-06

Este é o checkpoint mais recente e deve ter prioridade sobre blocos anteriores quando houver divergência.

## GIT OFICIAL NO INÍCIO DESTA ETAPA

Branch:

main

Checkpoint confirmado:

3f29108 Registra checkpoint final da sessao

main estava sincronizada com origin/main.

Antes do início de Bloqueios, o único arquivo untracked era:

CODIGO-COMPLETO.txt

CODIGO-COMPLETO.txt deve continuar ignorado e NÃO ser versionado.

## FUNCIONALIDADE ATUAL

BLOQUEIOS ADMINISTRATIVOS

Rota:

/admin/bloqueios

Status:

EM IMPLEMENTAÇÃO.

NÃO considerar concluída ainda.

NÃO avançar para Configurações.

## VERIFICAÇÃO DA ROTA

Foi iniciado o servidor com:

npm.cmd run dev

Foi necessário usar npm.cmd porque o PowerShell local bloqueia npm.ps1 pela ExecutionPolicy.

A URL:

http://localhost:3000/admin/bloqueios

retornava inicialmente 404.

Portanto a rota não existia antes desta implementação.

## SCHEMA CONFIRMADO — public.blocked_times

Consulta somente leitura realizada.

Colunas confirmadas:

- id uuid NOT NULL
- barber_id uuid NOT NULL
- start_at timestamptz NOT NULL
- end_at timestamptz NOT NULL
- reason text NULL
- created_at timestamptz NOT NULL

Foreign key confirmada:

blocked_times.barber_id
→ barbers.id

NÃO repetir essas consultas sem nova necessidade.

## SEGURANÇA / RLS DE blocked_times

Foi identificado durante o primeiro teste que /admin/bloqueios apresentava:

permission denied for table blocked_times

Estado encontrado antes da correção:

- RLS habilitado;
- RLS forced = false;
- authenticated sem SELECT;
- authenticated sem INSERT;
- authenticated sem DELETE;
- nenhuma policy em blocked_times.

Foi consultado o padrão existente de policies de public.barbers.

Padrão administrativo confirmado:

profiles.id = auth.uid()
AND profiles.role = 'admin'

Também foi confirmado:

authenticated possui SELECT em profiles.

anon não possuía SELECT em blocked_times.

Não foi concedido acesso público/anon a blocked_times.

## ALTERAÇÃO REAL DE BANCO

Esta foi a primeira nova alteração permanente de banco registrada após a regra de versionamento.

Foi criado:

supabase/sql/001-admin-blocked-times-policies.sql

Conteúdo versionado localmente:

grant select, insert, update, delete
on table public.blocked_times
to authenticated;

create policy "Admin pode visualizar bloqueios"
on public.blocked_times
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admin pode cadastrar bloqueios"
on public.blocked_times
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admin pode alterar bloqueios"
on public.blocked_times
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admin pode excluir bloqueios"
on public.blocked_times
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

## OBSERVAÇÃO SOBRE A EXECUÇÃO DO SQL

Ao executar o SQL no Supabase foi exibido erro:

policy "Admin pode visualizar bloqueios" for table "blocked_times" already exists

Não executar o arquivo novamente automaticamente.

Foi verificado imediatamente depois o estado REAL do banco.

Policies atualmente existentes:

- Admin pode alterar bloqueios — UPDATE
- Admin pode cadastrar bloqueios — INSERT
- Admin pode excluir bloqueios — DELETE
- Admin pode visualizar bloqueios — SELECT

Privilégios atuais de authenticated confirmados:

- SELECT = true
- INSERT = true
- UPDATE = true
- DELETE = true

Portanto o banco ficou no estado necessário.

NÃO recriar nem apagar essas policies sem nova necessidade.

## PRIMEIRA VERSÃO DE /admin/bloqueios

Criado:

app/admin/bloqueios/page.tsx

Implementado inicialmente:

- Server Component;
- leitura de blocked_times;
- título Bloqueios;
- estado vazio;
- listagem de bloqueios;
- profissional;
- período;
- motivo;
- timezone America/Sao_Paulo.

Depois da correção das permissões, teste visual apresentou corretamente:

Nenhum bloqueio cadastrado

sem erro de permissão.

## CADASTRO DE BLOQUEIO

Criado:

app/admin/bloqueios/block-form.tsx

Implementado:

- Client Component;
- createClient de @/lib/supabase/client;
- seleção de barbeiro ativo;
- início com datetime-local;
- fim com datetime-local;
- motivo opcional;
- validação de profissional;
- validação de início/fim;
- validação de fim posterior ao início;
- insert em blocked_times;
- router.refresh();
- estados de loading/erro.

app/admin/bloqueios/page.tsx foi conectado ao BlockForm.

A página carrega somente barbeiros ativos para o formulário.

## TESTE REAL DE CADASTRO

Foi criado um registro real para validação com:

Motivo:

Teste administrativo

Registro:

id:
b4777e2b-c19e-4463-b318-0b365357a5f4

barber_id:
bb5130bb-62f3-47f1-93ef-9cc58df132b0

barber:
Rodrigo Alves Correa

start_at:
2026-09-08 01:31:00+00

end_at:
2026-09-09 01:32:00+00

reason:
Teste administrativo

Esse registro É DADO DE TESTE e deve ser removido pela própria funcionalidade administrativa antes do checkpoint final.

Não deixar esse bloqueio de teste no banco.

## CORREÇÃO DA EXIBIÇÃO DO PROFISSIONAL

Na primeira listagem após o cadastro, PROFISSIONAL apareceu como:

-

O banco foi consultado somente para confirmar o registro.

Foi confirmado que barber_id estava corretamente gravado e correspondia a:

Rodrigo Alves Correa

Portanto o defeito era somente da leitura/renderização do relacionamento.

A solução aplicada foi:

- incluir barber_id na leitura de blocked_times;
- deixar de depender do relacionamento aninhado barbers na listagem;
- usar a lista de barbeiros já carregada pela página;
- localizar o profissional por barber.id === blockedTime.barber_id.

Depois da correção, teste visual confirmou:

Rodrigo Alves Correa

na listagem do bloqueio.

## BUILDS REALIZADOS

Primeiro build após criação da rota:

npm.cmd run build

APROVADO.

Build após integração do formulário:

npm.cmd run build

APROVADO.

Build depois da correção da exibição do profissional:

npm.cmd run build

APROVADO.

Último build registrado:

- Compiled successfully;
- TypeScript sem erros;
- /admin/bloqueios reconhecida como rota dinâmica.

## TESTE VISUAL ATUAL

A página /admin/bloqueios apresenta:

- layout administrativo correto;
- proteção administrativa confirmada;
- formulário Novo bloqueio;
- seletor de profissional;
- início;
- fim;
- motivo;
- botão CRIAR BLOQUEIO;
- cadastro real funcionando;
- listagem real funcionando;
- profissional exibido corretamente;
- período;
- motivo.

A rota administrativa não fica disponível ao cliente comum.

Ao acessar sem sessão administrativa válida, houve redirecionamento para /login pelo mecanismo administrativo existente.

## ARQUIVOS ATUAIS DA FUNCIONALIDADE

Novos e ainda não commitados:

app/admin/bloqueios/page.tsx
app/admin/bloqueios/block-form.tsx
supabase/sql/001-admin-blocked-times-policies.sql

CODIGO-COMPLETO.txt continua untracked e deve permanecer ignorado.

## GIT STATUS MAIS RECENTE REGISTRADO

Antes da criação de block-form.tsx, git status --short mostrou:

?? CODIGO-COMPLETO.txt
?? app/admin/bloqueios/
?? supabase/

Não houve commit funcional de Bloqueios até este checkpoint.

## IMPORTANTE — ENCODING

Ao visualizar block-form.tsx pelo PowerShell, alguns acentos apareceram corrompidos, por exemplo:

inÃcio
perÃodo
NÃ£o

Pode ser apenas interpretação/encoding da saída, mas antes do checkpoint final deve ser verificado visualmente no navegador e, se necessário, corrigido no arquivo para UTF-8.

Não ignorar esse ponto.

## O QUE AINDA FALTA

Bloqueios NÃO está concluído.

Falta:

- implementar exclusão de bloqueio pela interface administrativa;
- usar a exclusão para remover o registro "Teste administrativo";
- confirmar que a listagem volta ao estado esperado;
- verificar textos/accentuação;
- executar npm.cmd run build depois da última alteração;
- realizar teste funcional/visual final;
- verificar git status;
- fazer commit somente dos arquivos corretos;
- NÃO incluir CODIGO-COMPLETO.txt;
- push para origin/main;
- atualizar CONTEXTO-PROJETO.md com checkpoint final.

Não avançar para /admin/configuracoes antes disso.

## PRÓXIMO PASSO EXATO

Continuar a partir do estado atual de Bloqueios.

Primeiro implementar a EXCLUSÃO de bloqueios na interface administrativa.

Para isso, verificar somente os arquivos atuais necessários:

app/admin/bloqueios/page.tsx
app/admin/bloqueios/block-form.tsx

Não repetir consultas de schema, FK, RLS, policies ou privilégios já registradas acima.

Usar a policy DELETE administrativa que já está criada.

Depois:

1. testar exclusão pela interface;
2. excluir especificamente o registro de teste "Teste administrativo";
3. confirmar visualmente a remoção;
4. verificar accentuação;
5. npm.cmd run build;
6. teste visual final de /admin/bloqueios;
7. git status;
8. commit sem CODIGO-COMPLETO.txt;
9. push;
10. atualizar contexto final.

Não iniciar Configurações.
---

# CHECKPOINT FINAL — BLOQUEIOS ADMINISTRATIVOS

Data: 2026-09-06

Este é o checkpoint mais recente e substitui os checkpoints anteriores de Bloqueios que indicavam a funcionalidade como EM IMPLEMENTAÇÃO.

## STATUS

BLOQUEIOS ADMINISTRATIVOS:

CONCLUÍDO, TESTADO E VERSIONADO.

Rota:

/admin/bloqueios

## IMPLEMENTADO

Arquivos:

- app/admin/bloqueios/page.tsx
- app/admin/bloqueios/block-form.tsx
- app/admin/bloqueios/delete-block-button.tsx
- supabase/sql/001-admin-blocked-times-policies.sql

Funcionalidades concluídas:

- rota administrativa;
- proteção administrativa pelo layout existente;
- leitura de blocked_times;
- formulário de criação;
- seleção de barbeiros ativos;
- criação real de bloqueio;
- validação de início e fim;
- motivo opcional;
- listagem de bloqueios;
- profissional;
- período;
- motivo;
- exclusão pela interface;
- confirmação antes da exclusão;
- atualização da listagem após criação/exclusão;
- estado vazio;
- timezone America/Sao_Paulo.

## BANCO / SUPABASE

Alteração permanente versionada em:

supabase/sql/001-admin-blocked-times-policies.sql

Policies administrativas existentes para blocked_times:

- SELECT;
- INSERT;
- UPDATE;
- DELETE.

Privilégios necessários para authenticated confirmados anteriormente.

NÃO repetir consultas de:
- schema de blocked_times;
- foreign key;
- RLS;
- policies;
- privilégios;

sem nova necessidade concreta.

## TESTE DE EXCLUSÃO

O registro de teste com motivo:

Teste administrativo

foi excluído com sucesso pela própria interface administrativa.

Após a exclusão, a página apresentou:

Nenhum bloqueio cadastrado

Portanto o dado de teste não permaneceu no banco.

## ACENTUAÇÃO

A verificação visual no navegador confirmou que os textos são apresentados corretamente, incluindo:

- períodos;
- aparecerão;
- início;
- motivo.

A saída corrompida observada anteriormente no PowerShell era relacionada à interpretação de encoding da saída e não representou problema visual na aplicação.

## TESTES

Executado após a implementação da exclusão:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída com sucesso;
- TypeScript sem erros;
- /admin/bloqueios reconhecida como rota dinâmica.

Teste funcional/visual final:

APROVADO.

Confirmado:
- formulário renderizado;
- listagem renderizada;
- exclusão funcionando;
- confirmação de exclusão funcionando;
- registro Teste administrativo removido;
- estado vazio apresentado após remoção;
- acentuação correta.

## GIT

Commit funcional:

b90ea7b Implementa bloqueios administrativos

Push realizado com sucesso:

main → origin/main

CODIGO-COMPLETO.txt não foi incluído e deve continuar untracked.

## ESTADO CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

Dashboard administrativo:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO.

/admin/clientes:

CONCLUÍDO.

/admin/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

## PRÓXIMO PASSO EXATO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois executar git status e confirmar que permanece somente CODIGO-COMPLETO.txt como untracked.

Somente depois desse checkpoint documental poderá ser iniciada a próxima funcionalidade administrativa.

Não iniciar /admin/configuracoes antes de concluir esse checkpoint documental.

@'

---

# CHECKPOINT FINAL — CONFIGURAÇÕES ADMINISTRATIVAS

Data: 2026-09-06

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver divergência.

## GIT

Commit funcional:

87d5007 Implementa configuracoes administrativas

Push realizado com sucesso:

main → origin/main

CODIGO-COMPLETO.txt continua untracked e NÃO deve ser versionado.

## CONFIGURAÇÕES ADMINISTRATIVAS

Rota:

/admin/configuracoes

Status:

CONCLUÍDA E TESTADA a primeira versão.

Arquivos:

- app/admin/configuracoes/page.tsx
- app/admin/configuracoes/settings-form.tsx
- supabase/sql/002-business-settings.sql

Implementado:

- rota administrativa /admin/configuracoes;
- proteção administrativa herdada de app/admin/layout.tsx;
- Server Component para leitura das configurações;
- formulário Client Component;
- nome da barbearia;
- WhatsApp comercial;
- endereço;
- Instagram;
- criação do primeiro registro;
- edição do registro existente;
- persistência real no Supabase;
- validação do nome obrigatório;
- feedback de erro;
- feedback visual de sucesso;
- router.refresh() após salvamento.

Mensagem de sucesso confirmada visualmente:

Configurações salvas com sucesso.

## BUSINESS_SETTINGS

Foi criada a tabela:

public.business_settings

Schema confirmado:

- id uuid NOT NULL default gen_random_uuid()
- name text NOT NULL
- whatsapp text NULL
- address text NULL
- instagram text NULL
- created_at timestamptz NOT NULL default now()
- updated_at timestamptz NOT NULL default now()

Alteração real de banco versionada em:

supabase/sql/002-business-settings.sql

RLS habilitado.

Policies confirmadas:

- Publico visualiza configuracoes — SELECT
- Admin pode cadastrar configuracoes — INSERT
- Admin pode alterar configuracoes — UPDATE
- Admin pode excluir configuracoes — DELETE

Leitura pública foi concedida para permitir utilização futura das informações institucionais no site público.

Escrita permanece protegida para usuários authenticated com:

profiles.id = auth.uid()
AND profiles.role = 'admin'

NÃO repetir consultas de schema, policies ou privilégios de business_settings sem nova necessidade concreta.

## OBSERVAÇÃO SOBRE EXECUÇÃO DO SQL

O SQL de 002-business-settings.sql foi executado inicialmente no Supabase antes de o arquivo local ser criado.

Uma segunda tentativa produziu:

ERROR: 42P07: relation "business_settings" already exists

Isso ocorreu porque a primeira execução já havia criado a estrutura.

O estado real foi posteriormente verificado por consultas somente leitura.

Foi confirmado que:
- tabela existe;
- todas as colunas esperadas existem;
- policies esperadas existem;
- privilégios necessários existem.

NÃO executar novamente 002-business-settings.sql no banco atual.

O arquivo passou a existir corretamente em:

supabase/sql/002-business-settings.sql

para manter a alteração permanente versionada.

## DADOS REAIS SALVOS

Foi criado o primeiro registro de configurações pela própria interface administrativa.

O teste confirmou persistência de:

- nome;
- WhatsApp comercial;
- endereço;
- Instagram.

A captura visual confirmou que os dados continuam preenchidos após salvamento/refresh.

Esses dados são agora dados institucionais reais da configuração e NÃO devem ser apagados como dado de teste sem solicitação específica.

## TESTES

Executado:

npm.cmd run build

Resultado final:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /admin/configuracoes reconhecida como rota dinâmica.

Teste visual:

APROVADO.

Teste funcional de criação:

APROVADO.

Teste funcional de novo salvamento/edição:

APROVADO.

Feedback visual de sucesso:

APROVADO.

Proteção administrativa:

CONFIRMADA.

Quando a sessão administrativa não estava ativa, /admin/configuracoes redirecionou para /login conforme o mecanismo existente.

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO.

/admin/clientes:

CONCLUÍDO.

/admin/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

## REGRA DE TRABALHO — ARQUIVOS COMPLETOS

Preferência explícita do responsável pelo projeto:

Quando for necessário alterar um arquivo de código, fornecer preferencialmente o ARQUIVO COMPLETO pronto para substituir/copiar e colar.

Evitar instruções baseadas em:
- procurar um pequeno trecho;
- substituir partes isoladas;
- múltiplas alterações manuais espalhadas no mesmo arquivo.

Quando conveniente no Windows, fornecer também comando PowerShell completo usando Set-Content para gravar o arquivo inteiro.

Essa regra deve ser respeitada nos próximos chats para reduzir erros manuais e acelerar o trabalho.

Continuar trabalhando UMA ETAPA POR VEZ.

## BANCO / SQL VERSIONADO ATUAL

Arquivos conhecidos:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql

Toda nova alteração REAL de banco deve continuar sendo versionada em supabase/sql/.

Não alterar banco sem necessidade.

## PRÓXIMO PASSO EXATO

Primeiro versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar:

git status --short

Resultado esperado:

?? CODIGO-COMPLETO.txt

Depois encerrar esta sessão.

No próximo chat:
- usar CONTEXTO-PROJETO.md como fonte principal;
- ler prioritariamente este checkpoint;
- não refazer Configurações;
- não refazer Bloqueios;
- não reconstruir assinaturas + agendamento;
- não repetir consultas de business_settings já registradas;
- escolher a próxima evolução funcional somente depois de confirmar o estado do Git;
- trabalhar uma etapa por vez.

'@ | Add-Content -Encoding utf8 "CONTEXTO-PROJETO.md"

@'

---

# CHECKPOINT FINAL — NAVEGAÇÃO POR DATA NA AGENDA ADMINISTRATIVA

Data: 2026-09-06

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver divergência.

## STATUS

Agenda administrativa com navegação por data:

CONCLUÍDA, TESTADA E VERSIONADA.

Rota:

/admin/agenda

Commit funcional:

5067509 Adiciona navegacao por data na agenda administrativa

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivo alterado:

- app/admin/agenda/page.tsx

A Agenda administrativa deixou de ficar limitada exclusivamente ao dia atual.

Implementado:

- hoje continua sendo a data padrão;
- navegação para o dia anterior;
- navegação para o próximo dia;
- botão para retornar a Hoje;
- data selecionada mantida na URL através de:
  ?data=AAAA-MM-DD
- carregamento dos agendamentos correspondente à data selecionada;
- validação do parâmetro de data;
- fallback seguro para hoje quando a data recebida não é válida;
- timezone America/Sao_Paulo preservado;
- estado vazio específico para datas sem agendamentos;
- funcionamento mantido como Server Component;
- nenhuma alteração de banco.

## NEXT.JS 16

AGENTS.md foi respeitado antes da alteração.

Foi consultada a documentação local:

node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md

A documentação confirmou que, em uma page Server Component no Next.js 16:

searchParams

é recebido como Promise e deve ser aguardado.

Também confirmou que searchParams é apropriado quando parâmetros da URL são usados para carregar ou filtrar dados da página.

Implementação utilizada:

searchParams: Promise<...>

com await antes da leitura do parâmetro data.

## TESTES

Executado:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída com sucesso;
- TypeScript sem erros;
- /admin/agenda reconhecida como rota dinâmica.

Teste funcional/visual realizado em:

http://localhost:3000/admin/agenda

e com navegação por query string.

Exemplo confirmado:

http://localhost:3000/admin/agenda?data=2026-09-07

Resultado visual confirmado:

- segunda-feira, 07 de setembro de 2026;
- botões Dia anterior, Hoje e Próximo dia visíveis;
- navegação por data funcionando;
- estado vazio correto quando não existem agendamentos;
- acentuação correta;
- layout administrativo preservado.

Os três controles de navegação foram testados e funcionaram corretamente.

## BANCO / SUPABASE

Nenhuma alteração.

- nenhuma tabela alterada;
- nenhuma coluna alterada;
- nenhuma RPC alterada;
- nenhuma policy alterada;
- nenhum SQL executado.

Os arquivos SQL existentes permanecem:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO, agora com navegação por data.

/admin/clientes:

CONCLUÍDO.

/admin/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

Funcionalidades anteriores de barbeiros e assinantes permanecem concluídas.

## GIT

Commit funcional atual:

5067509 Adiciona navegacao por data na agenda administrativa

CODIGO-COMPLETO.txt deve continuar untracked e NÃO deve ser versionado.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que git status --short apresenta somente:

?? CODIGO-COMPLETO.txt

Somente depois escolher a próxima evolução funcional do projeto.

Continuar trabalhando UMA ETAPA POR VEZ.

'@ | Add-Content -Encoding utf8 "CONTEXTO-PROJETO.md"

@'

---

@'

---

# CHECKPOINT FINAL — BUSCA ADMINISTRATIVA DE CLIENTES

Data: 2026-09-06

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver divergência.

## STATUS

Busca na listagem administrativa de clientes:

CONCLUÍDA, TESTADA E VERSIONADA.

Rota:

/admin/clientes

Commit funcional:

73514f7 Adiciona busca na listagem de clientes

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivo alterado:

- app/admin/clientes/page.tsx

Implementado:

- campo de busca;
- busca por nome;
- busca por WhatsApp;
- busca por e-mail;
- parâmetro de URL ?busca=...;
- botão Buscar;
- botão Limpar;
- quantidade de resultados;
- estado vazio quando nenhum cliente corresponde à busca;
- lista completa preservada quando não existe busca;
- funcionamento mantido como Server Component;
- nenhuma alteração de banco.

A implementação utiliza searchParams conforme a documentação local do Next.js 16 consultada anteriormente nesta sessão.

## TESTES

Executado:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /admin/clientes reconhecida como rota dinâmica.

Teste funcional/visual:

APROVADO.

Confirmado:

- lista completa com 4 clientes;
- busca por nome funcionando;
- busca parcial por telefone funcionando;
- busca por 9888 retornou exatamente 1 cliente;
- botão Limpar funcionando;
- busca inexistente retornou 0 resultados;
- estado "Nenhum cliente encontrado" correto;
- layout e acentuação corretos.

## VERIFICAÇÃO DOS QUATRO CLIENTES EXISTENTES

Durante o teste foi observado que os quatro registros possuem o mesmo nome:

Rodrigo Alves Correa

Consulta somente de leitura confirmou que são quatro registros reais distintos em public.customers, com telefones diferentes:

- (41) 98888-1149 — 1 agendamento, 0 assinaturas;
- (55) 41998-4669 — 4 agendamentos, 0 assinaturas;
- (41) 99999-9990 — 1 agendamento, 1 assinatura;
- (41) 99825-4529 — 1 agendamento, 0 assinaturas.

Não se trata de duplicação visual causada pela busca.

Não excluir ou mesclar esses clientes automaticamente, pois todos possuem vínculos existentes.

O comportamento é compatível com a identificação atual baseada principalmente no WhatsApp normalizado.

O telefone (55) 41998-4669 possui formato que poderá ser investigado futuramente somente se houver tarefa específica de saneamento/normalização.

NÃO repetir essas consultas sem nova necessidade concreta.

## BANCO / SUPABASE

Nenhuma alteração permanente.

Foram realizadas somente consultas de leitura.

Nenhuma tabela, coluna, RPC, policy, função ou constraint foi alterada.

Arquivos SQL existentes permanecem:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql

## ESTADO CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO, com navegação por data.

/admin/clientes:

CONCLUÍDO, agora com busca por nome, WhatsApp e e-mail.

/admin/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

Funcionalidades anteriores de barbeiros e assinantes permanecem concluídas.

## GIT

Commit funcional atual:

73514f7 Adiciona busca na listagem de clientes

CODIGO-COMPLETO.txt continua untracked e NÃO deve ser versionado.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois confirmar que git status --short apresenta somente:

?? CODIGO-COMPLETO.txt

Somente depois escolher a próxima evolução funcional.

Continuar UMA ETAPA POR VEZ.

'@ | Add-Content -Encoding utf8 "CONTEXTO-PROJETO.md"
---

# CHECKPOINT FINAL — EDIÇÃO ADMINISTRATIVA DE CLIENTES

Data: 2026-09-06

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver divergência.

## STATUS

Edição administrativa de clientes:

CONCLUÍDA, TESTADA E VERSIONADA.

Rota de listagem:

/admin/clientes

Nova rota de edição:

/admin/clientes/[id]

Commit funcional:

97a75e5 Adiciona edicao administrativa de clientes

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivos alterados/criados:

- app/admin/clientes/page.tsx
- app/admin/clientes/[id]/page.tsx
- app/admin/clientes/[id]/customer-edit-form.tsx

A busca administrativa de Clientes existente foi preservada.

Foi adicionado botão EDITAR individual em cada card de cliente.

A nova página dinâmica carrega o cliente pelo próprio id.

Padrão do Next.js 16 utilizado:

params: Promise<{ id: string }>

com await antes da leitura do id.

Cliente inexistente utiliza notFound().

O formulário permite editar:

- nome;
- WhatsApp;
- e-mail;
- observações.

Validações implementadas:

- nome obrigatório;
- nome com pelo menos 2 caracteres;
- WhatsApp com 10 ou 11 dígitos;
- validação básica de e-mail quando preenchido.

O formulário possui:

- estado de salvamento;
- feedback de erro;
- feedback de sucesso;
- formatação de WhatsApp;
- botão SALVAR ALTERAÇÕES;
- botão CANCELAR;
- link VOLTAR PARA CLIENTES.

Mensagem de sucesso confirmada:

Cliente atualizado com sucesso.

## PRESERVAÇÃO DOS VÍNCULOS

A edição atualiza diretamente o registro existente em:

public.customers

utilizando:

update(...).eq("id", customer.id)

Não existe:

- delete do cliente;
- insert de novo cliente;
- merge automático;
- troca do id.

Portanto o mesmo customers.id é preservado e, consequentemente, os vínculos existentes por customer_id com agendamentos e assinaturas permanecem associados ao mesmo cliente.

Os quatro clientes chamados Rodrigo Alves Correa continuam sendo registros distintos e NÃO foram mesclados nem excluídos.

## TESTE FUNCIONAL

Cliente utilizado para validação:

Rodrigo Alves Correa

WhatsApp:

(41) 98888-1149

Foi confirmado que o botão EDITAR abriu o registro correto pelo id.

A tela apresentou corretamente:

- nome;
- WhatsApp;
- e-mail;
- observações;
- SALVAR ALTERAÇÕES;
- CANCELAR;
- VOLTAR PARA CLIENTES.

Para testar persistência sem alterar a identificação do cliente, foi utilizado temporariamente em OBSERVAÇÕES:

Teste edição administrativa

O salvamento foi realizado com sucesso.

Após F5, o conteúdo permaneceu, confirmando persistência real no Supabase.

Em seguida o texto de teste foi removido pela própria interface.

Novo salvamento foi realizado com sucesso.

Após a limpeza, OBSERVAÇÕES voltou a ficar vazio.

Portanto nenhum dado temporário desse teste permaneceu no cliente.

Nome e WhatsApp não foram alterados durante esse teste.

## TESTE DA LISTAGEM

Após a inclusão dos controles de edição foi confirmado visualmente:

- 4 clientes continuam aparecendo;
- busca permanece disponível;
- cada card possui botão EDITAR;
- os registros continuam individualizados pelos respectivos dados.

A busca existente NÃO foi refeita.

## BUILD

Executado após a implementação e teste funcional:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript concluído sem erros;
- geração das páginas concluída;
- /admin/clientes reconhecida;
- /admin/clientes/[id] reconhecida como rota dinâmica.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Foi consultada a documentação local:

node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md

Foi confirmado o padrão de rota dinâmica e o uso de:

params: Promise<{ id: string }>

com:

const { id } = await params

Não é necessário repetir essa consulta sem nova necessidade relacionada à convenção.

## BANCO / SUPABASE

Nenhuma alteração estrutural ou permanente de banco foi necessária.

Nenhuma:

- tabela;
- coluna;
- RPC;
- policy;
- constraint;
- função

foi criada ou alterada.

Nenhum novo arquivo SQL foi necessário.

Permanecem os SQLs existentes:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql

Não alterar banco para esta funcionalidade.

## GIT

Commit funcional:

97a75e5 Adiciona edicao administrativa de clientes

Push realizado com sucesso para origin/main.

Após o push foi executado:

git status --short

Resultado:

?? CODIGO-COMPLETO.txt

Portanto não existe alteração rastreada pendente neste momento antes desta atualização documental.

CODIGO-COMPLETO.txt continua untracked e NÃO deve ser versionado.

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO, com navegação por data.

/admin/clientes:

CONCLUÍDO, com listagem, busca e edição.

/admin/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

Funcionalidades anteriores de barbeiros e assinantes permanecem concluídas.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que:

git status --short

apresenta somente:

?? CODIGO-COMPLETO.txt

Depois encerrar esta etapa.

Não iniciar uma nova funcionalidade antes de concluir o checkpoint documental.


---

# CHECKPOINT FINAL — EDIÇÃO ADMINISTRATIVA DE SERVIÇOS

Data: 2026-09-07

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver divergência.

## STATUS

Edição administrativa de Serviços:

CONCLUÍDA, TESTADA E VERSIONADA.

Rota de listagem:

/admin/servicos

Nova rota de edição:

/admin/servicos/[id]

Commit funcional:

f859384 Adiciona edicao administrativa de servicos

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivos alterados/criados:

- app/admin/servicos/page.tsx
- app/admin/servicos/[id]/page.tsx
- app/admin/servicos/[id]/service-edit-form.tsx
- supabase/sql/003-admin-services-update-policy.sql

A listagem administrativa existente foi preservada.

Foi adicionado botão EDITAR individual nos cards dos serviços.

A nova página dinâmica carrega o serviço pelo próprio services.id.

Padrão utilizado no Next.js 16:

params: Promise<{ id: string }>

com await antes da leitura do id.

Serviço inexistente utiliza notFound().

O formulário permite editar:

- nome;
- categoria;
- preço;
- duração em minutos;
- descrição;
- subscriber_service / Serviço de plano;
- active / Serviço ativo.

Validações implementadas:

- nome obrigatório;
- nome com pelo menos 2 caracteres;
- categoria obrigatória;
- preço numérico e não negativo;
- duração inteira maior que zero.

O formulário possui:

- estado de salvamento;
- feedback de erro;
- feedback de sucesso;
- SALVAR ALTERAÇÕES;
- CANCELAR;
- VOLTAR PARA SERVIÇOS.

Mensagem de sucesso confirmada:

Serviço atualizado com sucesso.

## PRESERVAÇÃO DO REGISTRO

A edição utiliza UPDATE diretamente em:

public.services

com filtro pelo mesmo:

services.id

Não existe delete ou recriação do serviço durante a edição.

O registro existente e seu id são preservados.

## PERMISSÃO ADMINISTRATIVA DE UPDATE

No primeiro teste real, o Supabase retornou:

permission denied for table services

Foi realizada somente a verificação mínima necessária.

Estado confirmado antes da correção:

- RLS habilitado;
- RLS forced = false;
- authenticated SELECT = true;
- authenticated INSERT = false;
- authenticated UPDATE = false;
- authenticated DELETE = false.

Policy existente preservada:

Servicos ativos sao publicos — SELECT — anon, authenticated — active = true

Para permitir exclusivamente a edição administrativa foi criada a alteração versionada:

supabase/sql/003-admin-services-update-policy.sql

Ela concede:

UPDATE em public.services para authenticated

e cria a policy:

Admin pode alterar servicos

A policy exige:

profiles.id = auth.uid()
AND profiles.role = 'admin'

tanto em USING quanto em WITH CHECK.

Não foi concedido INSERT ou DELETE nesta etapa.

O SQL foi executado uma única vez no Supabase com sucesso.

Resultado:

Success. No rows returned

NÃO executar novamente 003-admin-services-update-policy.sql no banco atual sem necessidade concreta.

## TESTE FUNCIONAL REAL

Serviço utilizado:

Barba

Foi utilizado temporariamente no final da descrição:

Teste edição administrativa

O primeiro salvamento, anterior à policy administrativa, falhou com permission denied e não persistiu.

Após a criação da permissão/policy administrativa:

- salvamento realizado com sucesso;
- mensagem de sucesso exibida;
- F5 realizado;
- texto temporário permaneceu, confirmando persistência real.

Depois o texto de teste foi removido pela própria interface.

A descrição foi restaurada exatamente para:

Modelagem profissional da barba, do estilo moderno ao clássico.

Novo salvamento foi realizado com sucesso.

A restauração foi confirmada visualmente.

Nenhum dado temporário permaneceu no serviço.

Durante o teste não foram alterados:

- nome;
- categoria;
- preço;
- duração;
- Serviço de plano;
- Serviço ativo.

## TESTE VISUAL FINAL

/admin/servicos:

APROVADO.

Confirmado:

- 24 serviços cadastrados;
- 24 serviços ativos;
- 4 serviços de plano;
- cards preservados;
- indicadores preservados;
- botões EDITAR visíveis;
- serviço Barba com descrição original;
- nenhum erro visual observado.

/admin/servicos/[id]:

APROVADO.

Confirmado:

- carregamento pelo id;
- campos preenchidos;
- controles de plano e ativo;
- feedback de sucesso;
- persistência real.

## BUILD FINAL

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- geração das páginas concluída;
- /admin/servicos reconhecida;
- /admin/servicos/[id] reconhecida como rota dinâmica.

## BANCO / SQL VERSIONADO

Arquivos SQL conhecidos agora:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql

Toda nova alteração REAL de banco deve continuar sendo versionada em supabase/sql/.

Não repetir consultas de RLS, policies e privilégios de services sem nova necessidade concreta.

## GIT

Commit funcional:

f859384 Adiciona edicao administrativa de servicos

Push realizado com sucesso para origin/main.

CODIGO-COMPLETO.txt não foi incluído no commit e deve continuar untracked.

## REGRA OPERACIONAL — COMANDOS

Preferência explícita do responsável pelo projeto:

Sempre fornecer comandos completos e prontos para copiar e colar sempre que possível.

O responsável deve precisar apenas:

1. copiar o comando;
2. colar no PowerShell/terminal;
3. devolver o resultado.

Evitar pedir criação ou edição manual de arquivos quando um comando completo puder fazer a operação com segurança.

Para arquivos de código, continuar preferindo arquivo completo via PowerShell Set-Content.

Para leitura/verificação, fornecer também o comando exato.

Não incluir o prompt PS C:\... dentro dos comandos.

Na máquina atual, utilizar npm.cmd em vez de npm quando necessário por causa da ExecutionPolicy do PowerShell.

Para diretórios contendo [id], continuar usando System.IO.Directory quando for necessária criação compatível.

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO, com navegação por data.

/admin/clientes:

CONCLUÍDO, com listagem, busca e edição.

/admin/servicos:

CONCLUÍDO, agora com listagem e edição.

/admin/servicos/[id]:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

Funcionalidades anteriores de barbeiros e assinantes permanecem concluídas.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que o estado final permanece somente com:

?? CODIGO-COMPLETO.txt

como untracked.

Somente depois iniciar outra evolução funcional.

Continuar trabalhando UMA ETAPA POR VEZ.

---

# CHECKPOINT — CORREÇÃO DA LEITURA ADMINISTRATIVA DA AGENDA

Data: 2026-09-07

Este checkpoint registra uma correção real identificada durante a preparação da próxima evolução da Agenda.

## STATUS

Correção da leitura administrativa da Agenda:

CONCLUÍDA, TESTADA E VERSIONADA.

Commit funcional:

32c0525 Corrige leitura administrativa da agenda

Push realizado com sucesso:

main → origin/main

## PROBLEMA IDENTIFICADO

A rota:

/admin/agenda

aparentava funcionar anteriormente quando testada em datas sem agendamentos.

Durante nova validação foi confirmado no log do Next.js:

Erro ao carregar agenda: {}

A causa era de permissão no Supabase.

Estado confirmado de:

public.appointments
public.appointment_services

antes da correção:

- RLS habilitado;
- authenticated sem SELECT;
- nenhuma policy existente nas duas tabelas.

A página convertia a falha da consulta em lista vazia através de:

data ?? []

fazendo o erro aparecer visualmente como:

0 agendamentos

Portanto o estado vazio anterior podia mascarar uma falha de permissão.

## ALTERAÇÃO DE BANCO

Foi criada e executada uma única vez a alteração versionada:

supabase/sql/004-admin-appointments-read-policies.sql

Ela concede somente SELECT para authenticated em:

- public.appointments;
- public.appointment_services.

A leitura efetiva é protegida por RLS e exige:

profiles.id = auth.uid()
AND profiles.role = 'admin'

Policies criadas:

- Admin pode visualizar agendamentos
- Admin pode visualizar servicos dos agendamentos

Nenhuma permissão de INSERT, UPDATE ou DELETE foi concedida nesta alteração.

NÃO executar novamente 004-admin-appointments-read-policies.sql sem necessidade concreta.

## VALIDAÇÃO COM DADOS REAIS

Datas existentes foram localizadas por consulta somente de leitura:

- 2026-09-04 — 2 agendamentos;
- 2026-09-03 — 1 agendamento;
- 2026-09-02 — 4 agendamentos.

Teste realizado em:

http://localhost:3000/admin/agenda?data=2026-09-04

Após a policy de leitura, a página passou a apresentar corretamente os 2 agendamentos reais.

## CLIENTE E PROFISSIONAL

Após a correção de SELECT, serviços apareciam corretamente, mas cliente e profissional ainda não eram apresentados pelo relacionamento aninhado.

Foi confirmado que os appointments possuem customer_id e barber_id válidos.

As policies já existentes de customers e barbers permitem leitura administrativa.

A solução aplicada em:

app/admin/agenda/page.tsx

foi:

- incluir customer_id;
- incluir barber_id;
- carregar somente os customers referenciados na data;
- carregar somente os barbers referenciados na data;
- resolver cliente e profissional pelos respectivos IDs.

Nenhuma alteração adicional de banco foi necessária para customers ou barbers.

Teste visual confirmou:

- nome real do cliente;
- telefone;
- profissional;
- serviços;
- preço;
- status.

## AJUSTE VISUAL

A grade fixa anterior dos cards da Agenda causava corte horizontal.

Foi substituída por grade responsiva usando:

repeat(auto-fit, minmax(150px, 1fr))

O bloco de valor também foi alinhado de forma compatível com a nova grade.

Teste visual final confirmou todos os campos visíveis sem o corte anterior.

## TESTE REAL

Na data 2026-09-04 foram exibidos:

- 2 agendamentos;
- clientes reais;
- telefones;
- profissional Rodrigo Alves Correa;
- serviços;
- serviço comum com valor R$ 70,00;
- serviço de assinatura com valor histórico R$ 0,00;
- status scheduled.

Nenhum dado artificial foi criado para esse teste.

Após a correção, o log não apresentou:

- Erro ao carregar agenda;
- Erro ao carregar clientes da agenda;
- Erro ao carregar profissionais da agenda.

## NEXT.JS 16

AGENTS.md foi respeitado.

Documentação local consultada:

node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md

Foi mantido o padrão de async Server Component com consultas de banco no servidor.

## BUILD

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- geração das páginas concluída;
- /admin/agenda permanece rota dinâmica.

## SQLS VERSIONADOS ATUAIS

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql

## PRÓXIMA EVOLUÇÃO

A Agenda agora possui leitura administrativa real e validada.

Os status aceitos pela constraint atual de appointments foram confirmados como:

- scheduled;
- confirmed;
- completed;
- cancelled;
- no_show.

Gestão/alteração desses status ainda NÃO foi implementada.

Antes de implementar escrita em appointments, manter privilégio mínimo e criar somente a autorização administrativa necessária, versionando qualquer alteração real de banco em supabase/sql/.

Continuar UMA ETAPA POR VEZ.


---

# CHECKPOINT FINAL — GESTÃO DE STATUS NA AGENDA ADMINISTRATIVA

Data: 2026-09-07

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Gestão administrativa do status dos agendamentos:

CONCLUÍDA, TESTADA E VERSIONADA.

Rota:

/admin/agenda

Commit funcional:

6453b4d Adiciona gestao de status na agenda administrativa

Push realizado com sucesso:

main → origin/main

## STATUS SUPORTADOS

A constraint existente de public.appointments foi consultada antes da implementação.

Valores permitidos confirmados:

- scheduled;
- confirmed;
- completed;
- cancelled;
- no_show.

A interface apresenta respectivamente:

- Agendado;
- Confirmado;
- Concluído;
- Cancelado;
- Não compareceu.

Nenhum status novo foi criado.

## IMPLEMENTAÇÃO

Arquivos:

- app/admin/agenda/page.tsx
- app/admin/agenda/actions.ts
- app/admin/agenda/appointment-status-form.tsx
- supabase/sql/005-admin-appointments-update-policy.sql

Cada agendamento da Agenda agora possui:

- seletor de status;
- botão SALVAR STATUS;
- botão desabilitado enquanto não existe alteração;
- estado SALVANDO;
- feedback de erro;
- feedback de sucesso.

Mensagem de sucesso confirmada:

Status atualizado com sucesso.

## SERVER ACTION / SEGURANÇA

A mutação foi implementada através de Server Action.

A action:

- valida appointmentId;
- aceita somente os cinco status conhecidos;
- chama supabase.auth.getUser();
- revalida a sessão;
- consulta profiles;
- exige profiles.role = admin;
- confirma a existência do agendamento;
- altera somente appointments.status;
- revalida /admin;
- revalida /admin/agenda.

A autorização do layout administrativo NÃO é considerada suficiente isoladamente.

A própria Server Action revalida autenticação/autorização conforme a documentação local do Next.js 16.

RLS permanece como segunda camada de proteção.

## BANCO / SUPABASE

Antes da implementação foi confirmado:

- appointments possui RLS;
- não existia UPDATE para authenticated;
- não existia RPC específica para alteração/cancelamento de appointments;
- não existem triggers customizados em appointments.

Alteração permanente criada e executada uma única vez:

supabase/sql/005-admin-appointments-update-policy.sql

Ela concede:

UPDATE em public.appointments para authenticated

e cria:

Admin pode alterar agendamentos

A policy exige:

profiles.id = auth.uid()
AND profiles.role = 'admin'

em USING e WITH CHECK.

Não foi concedido INSERT ou DELETE.

NÃO executar novamente 005-admin-appointments-update-policy.sql sem necessidade concreta.

## TESTE FUNCIONAL REAL

Foi utilizado o agendamento real de:

04/09/2026
16:15 - 17:00

Estado inicial:

scheduled / Agendado

Para teste foi alterado temporariamente para:

confirmed / Confirmado

Resultado:

- salvamento realizado com sucesso;
- mensagem de sucesso apresentada;
- F5 realizado;
- Confirmado permaneceu selecionado;
- persistência real no Supabase confirmada.

Depois o mesmo agendamento foi restaurado pela interface para:

scheduled / Agendado

A restauração foi confirmada após novo carregamento.

O segundo agendamento da data permaneceu Agendado durante o teste.

Nenhuma alteração temporária do teste permaneceu nos dados.

## LOG

Após alteração e restauração, o log do Next.js foi verificado.

Não foram encontrados:

- Erro ao validar agendamento;
- Erro ao atualizar status do agendamento;
- erros de servidor relacionados à funcionalidade.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Documentação local consultada:

- node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
- node_modules/next/dist/docs/01-app/02-guides/data-security.md

Foi seguido o requisito de revalidar autenticação e autorização dentro da Server Action.

## BUILD FINAL

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- páginas geradas sem erro;
- /admin/agenda permanece dinâmica.

## SQLS VERSIONADOS ATUAIS

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql

## ESTADO CONSOLIDADO DA AGENDA

/admin/agenda agora possui:

- navegação por data;
- leitura real de agendamentos;
- cliente;
- telefone;
- profissional;
- serviços;
- valor;
- status;
- cards responsivos;
- gestão administrativa do status;
- proteção administrativa de leitura e escrita.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push.

Somente após o checkpoint documental iniciar outra evolução funcional.

Continuar UMA ETAPA POR VEZ.


---

# CHECKPOINT FINAL — EDIÇÃO ADMINISTRATIVA DE BARBEIROS

Data: 2026-09-07

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Edição administrativa de barbeiros:

CONCLUÍDA, TESTADA E VERSIONADA.

Rota de listagem:

/admin/barbeiros

Nova rota de edição:

/admin/barbeiros/[id]

Commit funcional:

9cc3e59 Adiciona edicao administrativa de barbeiros

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivos criados:

- app/admin/barbeiros/[id]/page.tsx
- app/admin/barbeiros/[id]/barber-edit-form.tsx
- app/admin/barbeiros/[id]/actions.ts

O botão EDITAR já existente em:

app/admin/barbeiros/page.tsx

apontava para:

/admin/barbeiros/[id]

mas essa rota não existia.

A rota foi implementada sem alterar as funcionalidades já existentes de:

- cadastro de barbeiros;
- horários;
- serviços realizados.

A página dinâmica utiliza:

params: Promise<{ id: string }>

e carrega o profissional pelo próprio:

barbers.id

Barbeiro inexistente utiliza:

notFound().

## CAMPOS EDITÁVEIS

A edição permite alterar:

- nome;
- WhatsApp profissional;
- status ativo/inativo.

O telefone continua opcional, preservando a regra já existente no cadastro.

Horários e serviços NÃO são editados nessa página e continuam nas rotas próprias:

- /admin/barbeiros/[id]/horarios
- /admin/barbeiros/[id]/servicos

## VALIDAÇÕES

Implementado:

- nome obrigatório;
- nome com pelo menos 2 caracteres;
- telefone opcional;
- quando informado, WhatsApp deve possuir 10 ou 11 dígitos.

## SERVER ACTION / SEGURANÇA

A edição utiliza Server Action.

A action:

- valida o id;
- valida nome;
- valida telefone;
- chama supabase.auth.getUser();
- revalida a sessão;
- consulta profiles;
- exige profiles.role = admin;
- confirma a existência do barbeiro;
- atualiza somente name, phone e active;
- preserva o mesmo barbers.id;
- revalida as rotas administrativas relacionadas.

A policy de UPDATE de barbers já existia e foi confirmada antes da implementação:

Admin pode alterar barbeiros

Ela exige:

profiles.id = auth.uid()
AND profiles.role = 'admin'

em USING e WITH CHECK.

Nenhuma alteração de banco foi necessária.

Nenhum novo SQL foi criado.

## TESTE FUNCIONAL REAL

Profissional utilizado:

Rodrigo Alves Correa

WhatsApp:

(41) 98888-1149

Status:

ativo

Para validar persistência, o nome foi temporariamente alterado para uma versão contendo:

teste

O salvamento apresentou:

Barbeiro atualizado com sucesso.

Após F5, o nome temporário permaneceu, confirmando persistência real.

Depois o nome foi restaurado pela própria interface para exatamente:

Rodrigo Alves Correa

Novo salvamento foi realizado e a restauração foi confirmada após recarregar.

WhatsApp e status não foram alterados durante o teste.

Nenhum dado temporário permaneceu no barbeiro.

## TESTE VISUAL

A nova tela apresentou corretamente:

- VOLTAR PARA BARBEIROS;
- Editar barbeiro;
- nome;
- WhatsApp;
- status;
- Barbeiro ativo;
- SALVAR ALTERAÇÕES;
- CANCELAR;
- feedback visual de sucesso.

Layout e acentuação aprovados.

## LOG

Após teste e restauração, não foram encontrados:

- Erro ao validar barbeiro;
- Erro ao atualizar barbeiro;
- erros de servidor relacionados à funcionalidade.

## BUILD FINAL

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- /admin/barbeiros/[id] reconhecida como rota dinâmica;
- demais rotas existentes preservadas.

## BANCO / SQL

Nenhuma alteração de banco nesta funcionalidade.

SQLs versionados permanecem:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql

## ESTADO CONSOLIDADO DE BARBEIROS

Barbeiros agora possuem:

- cadastro;
- listagem;
- edição;
- status ativo/inativo;
- serviços por barbeiro;
- jornada semanal.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push.

Somente após o checkpoint documental iniciar outra evolução funcional.

Continuar UMA ETAPA POR VEZ.


---

# CHECKPOINT FINAL — CADASTRO ADMINISTRATIVO DE SERVIÇOS

Data: 2026-09-08

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Cadastro administrativo de Serviços:

CONCLUÍDO, TESTADO E VERSIONADO.

Rota de listagem:

/admin/servicos

Nova rota de cadastro:

/admin/servicos/novo

Commit funcional:

27827f7 Adiciona cadastro administrativo de servicos

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivos alterados/criados:

- app/admin/servicos/page.tsx
- app/admin/servicos/novo/page.tsx
- app/admin/servicos/novo/service-create-form.tsx
- app/admin/servicos/novo/actions.ts
- supabase/sql/006-admin-services-insert-policy.sql

A listagem e a edição administrativa de Serviços existentes foram preservadas.

Foi adicionado na listagem o botão:

NOVO SERVIÇO

A nova página permite cadastrar:

- nome;
- categoria;
- preço;
- duração em minutos;
- descrição;
- Serviço de plano;
- Serviço ativo.

Serviço ativo inicia marcado por padrão.

## VALIDAÇÕES

Implementadas no formulário e novamente na Server Action:

- nome obrigatório;
- nome com pelo menos 2 caracteres;
- categoria obrigatória;
- preço numérico e não negativo;
- duração inteira maior que zero.

## SERVER ACTION / SEGURANÇA

O cadastro utiliza Server Action.

A action:

- valida os dados;
- chama supabase.auth.getUser();
- revalida a sessão;
- consulta profiles;
- exige profiles.role = admin;
- insere somente os campos necessários em public.services;
- revalida /admin;
- revalida /admin/servicos;
- revalida /agendar.

A autorização administrativa da própria action é complementada pela RLS do Supabase.

## BANCO / SUPABASE

O estado anterior documentado possuía UPDATE administrativo de services, mas não INSERT para authenticated.

Foi criada a alteração permanente:

supabase/sql/006-admin-services-insert-policy.sql

Ela concede somente:

INSERT em public.services para authenticated

e cria a policy:

Admin pode cadastrar servicos

A policy exige:

profiles.id = auth.uid()
AND profiles.role = 'admin'

em WITH CHECK.

Não foi concedido DELETE.

O SQL 006 foi executado uma única vez no Supabase com sucesso.

NÃO executar novamente supabase/sql/006-admin-services-insert-policy.sql no banco atual sem necessidade concreta.

## TESTE FUNCIONAL REAL

Foi criado pela própria interface um serviço temporário:

Nome:
Teste cadastro administrativo

Categoria:
Teste

Preço:
R$ 1,00

Duração:
5 minutos

Descrição:
Serviço temporário para validar cadastro administrativo

Serviço de plano:
desmarcado

Serviço ativo:
marcado

O cadastro foi realizado com sucesso.

A aplicação retornou para:

/admin/servicos

e o serviço apareceu corretamente na listagem.

O total passou temporariamente de 24 para 25 serviços.

O registro temporário recebeu o id:

8f1a29d2-af6b-491e-82ac-1fae6422d6db

Após a validação, esse registro foi removido especificamente através do SQL Editor.

A remoção retornou exatamente o registro de teste.

Nenhum serviço real foi removido.

Após a limpeza, a listagem voltou a apresentar:

24 serviços cadastrados;
24 serviços ativos;
4 serviços de plano.

Nenhum dado temporário permaneceu no banco.

## TESTE VISUAL FINAL

/admin/servicos:

APROVADO.

Confirmado:

- 24 serviços cadastrados;
- 24 serviços ativos;
- 4 serviços de plano;
- botão NOVO SERVIÇO;
- cards existentes preservados;
- registro temporário ausente.

/admin/servicos/novo:

APROVADO.

Confirmado:

- formulário vazio;
- todos os campos esperados;
- Serviço de plano desmarcado;
- Serviço ativo marcado por padrão;
- botão CADASTRAR SERVIÇO;
- botão CANCELAR;
- layout e acentuação corretos.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Documentação local consultada antes da implementação:

- node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
- node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md

Foi utilizado o padrão documentado para rota aninhada e Server Action com autenticação/autorização revalidada no servidor.

## BUILD FINAL

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- geração das páginas concluída;
- /admin/servicos reconhecida;
- /admin/servicos/[id] reconhecida;
- /admin/servicos/novo reconhecida como rota dinâmica.

## SQLS VERSIONADOS ATUAIS

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql
- supabase/sql/006-admin-services-insert-policy.sql

Não executar novamente esses SQLs sem necessidade concreta.

## GIT

Commit funcional:

27827f7 Adiciona cadastro administrativo de servicos

Push realizado com sucesso para origin/main.

CODIGO-COMPLETO.txt não foi incluído e deve continuar untracked.

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO, incluindo navegação por data, leitura administrativa real e gestão de status.

/admin/clientes:

CONCLUÍDO, com listagem, busca e edição.

/admin/servicos:

CONCLUÍDO, agora com listagem, cadastro e edição.

/admin/servicos/novo:

CONCLUÍDO.

/admin/servicos/[id]:

CONCLUÍDO.

/admin/barbeiros:

CONCLUÍDO, incluindo cadastro, listagem e edição.

/admin/barbeiros/[id]/horarios:

CONCLUÍDO.

/admin/barbeiros/[id]/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

Assinantes:

Funcionalidades existentes permanecem concluídas.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que git status --short apresenta somente:

?? CODIGO-COMPLETO.txt

Somente após o checkpoint documental iniciar outra evolução funcional.

Continuar trabalhando UMA ETAPA POR VEZ.

---

# CHECKPOINT FINAL — CADASTRO ADMINISTRATIVO DE CLIENTES

Data: 2026-09-08

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Cadastro administrativo de Clientes:

CONCLUÍDO, TESTADO E VERSIONADO.

Rota de listagem:

/admin/clientes

Nova rota:

/admin/clientes/novo

Commit funcional:

91cd08a Adiciona cadastro administrativo de clientes

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivos alterados/criados:

- app/admin/clientes/page.tsx
- app/admin/clientes/novo/page.tsx
- app/admin/clientes/novo/customer-create-form.tsx
- app/admin/clientes/novo/actions.ts

A listagem, busca e edição existentes foram preservadas.

Foi adicionado na listagem o botão:

NOVO CLIENTE

O cadastro permite informar:

- nome;
- WhatsApp;
- e-mail opcional;
- observações opcionais.

## VALIDAÇÕES

Implementadas no formulário e novamente na Server Action:

- nome obrigatório;
- nome com pelo menos 2 caracteres;
- WhatsApp obrigatório;
- WhatsApp com 10 ou 11 dígitos;
- validação básica do e-mail quando informado;
- impedimento de novo cadastro quando já existe cliente com o mesmo WhatsApp normalizado.

## SERVER ACTION / SEGURANÇA

O cadastro utiliza Server Action.

A action:

- valida novamente os dados no servidor;
- chama supabase.auth.getUser();
- revalida a sessão;
- consulta profiles;
- exige profiles.role = admin;
- verifica cliente existente pelo WhatsApp normalizado;
- insere somente os campos necessários em public.customers;
- revalida /admin;
- revalida /admin/clientes.

A autorização da própria Server Action complementa as regras existentes do Supabase.

## BANCO / SUPABASE

Nenhuma alteração estrutural ou permanente de banco foi necessária.

O INSERT real em public.customers funcionou com o estado atual de permissões.

Nenhuma nova:

- tabela;
- coluna;
- RPC;
- policy;
- função;
- constraint

foi criada ou alterada.

Nenhum novo arquivo SQL foi necessário.

Permanecem versionados:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql
- supabase/sql/006-admin-services-insert-policy.sql

Não executar novamente esses SQLs sem necessidade concreta.

## TESTE FUNCIONAL REAL

Foi criado pela própria interface um cliente temporário:

Nome:

Teste cadastro administrativo

WhatsApp:

(41) 90000-0001

E-mail:

não informado

Observações:

Cliente temporário para validar cadastro administrativo

O cadastro foi realizado com sucesso.

A aplicação retornou para:

/admin/clientes

O total passou temporariamente de 4 para 5 clientes.

O registro temporário recebeu o id:

084b67a9-fbf9-4a45-8eb3-2f32f0b351c9

Após a validação, o registro foi removido especificamente pelo SQL Editor utilizando simultaneamente:

- id;
- telefone;
- nome.

O DELETE retornou exatamente o cliente temporário esperado.

Nenhum cliente real foi removido.

Após a limpeza, a listagem voltou a apresentar:

4 clientes.

Nenhum dado temporário permaneceu no banco.

## TESTE VISUAL

/admin/clientes:

APROVADO.

Confirmado:

- 4 clientes reais após a limpeza;
- busca existente preservada;
- edição existente preservada;
- botão NOVO CLIENTE;
- cliente temporário ausente após a limpeza.

/admin/clientes/novo:

APROVADO.

Confirmado:

- nome;
- WhatsApp;
- e-mail;
- observações;
- CADASTRAR CLIENTE;
- CANCELAR;
- VOLTAR PARA CLIENTES;
- layout administrativo preservado;
- acentuação correta.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Documentação local consultada:

- node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
- node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md

Foi utilizado o padrão de rota aninhada e Server Action com autenticação/autorização verificada no servidor.

## BUILD FINAL

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- geração das páginas concluída;
- /admin/clientes reconhecida;
- /admin/clientes/[id] reconhecida;
- /admin/clientes/novo reconhecida como rota dinâmica.

## GIT

Commit funcional:

91cd08a Adiciona cadastro administrativo de clientes

Push realizado com sucesso para origin/main.

CODIGO-COMPLETO.txt não foi incluído e deve continuar untracked.

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO, incluindo navegação por data, leitura administrativa real e gestão de status.

/admin/clientes:

CONCLUÍDO, agora com listagem, busca, cadastro e edição.

/admin/clientes/novo:

CONCLUÍDO.

/admin/clientes/[id]:

CONCLUÍDO.

/admin/servicos:

CONCLUÍDO, com listagem, cadastro e edição.

/admin/barbeiros:

CONCLUÍDO, com cadastro, listagem e edição.

/admin/barbeiros/[id]/horarios:

CONCLUÍDO.

/admin/barbeiros/[id]/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

Assinantes:

Funcionalidades existentes permanecem concluídas.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que git status --short apresenta somente:

?? CODIGO-COMPLETO.txt

Somente após o checkpoint documental iniciar outra evolução funcional.

Continuar trabalhando UMA ETAPA POR VEZ.

---

# CHECKPOINT FINAL — CADASTRO ADMINISTRATIVO DE CLIENTES

Data: 2026-09-08

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Cadastro administrativo de Clientes:

CONCLUÍDO, TESTADO E VERSIONADO.

Rota de listagem:

/admin/clientes

Nova rota:

/admin/clientes/novo

Commit funcional:

91cd08a Adiciona cadastro administrativo de clientes

Push realizado com sucesso:

main → origin/main

## IMPLEMENTAÇÃO

Arquivos alterados/criados:

- app/admin/clientes/page.tsx
- app/admin/clientes/novo/page.tsx
- app/admin/clientes/novo/customer-create-form.tsx
- app/admin/clientes/novo/actions.ts

A listagem, busca e edição existentes foram preservadas.

Foi adicionado na listagem o botão:

NOVO CLIENTE

O cadastro permite informar:

- nome;
- WhatsApp;
- e-mail opcional;
- observações opcionais.

## VALIDAÇÕES

Implementadas no formulário e novamente na Server Action:

- nome obrigatório;
- nome com pelo menos 2 caracteres;
- WhatsApp obrigatório;
- WhatsApp com 10 ou 11 dígitos;
- validação básica do e-mail quando informado;
- impedimento de novo cadastro quando já existe cliente com o mesmo WhatsApp normalizado.

## SERVER ACTION / SEGURANÇA

O cadastro utiliza Server Action.

A action:

- valida novamente os dados no servidor;
- chama supabase.auth.getUser();
- revalida a sessão;
- consulta profiles;
- exige profiles.role = admin;
- verifica cliente existente pelo WhatsApp normalizado;
- insere somente os campos necessários em public.customers;
- revalida /admin;
- revalida /admin/clientes.

A autorização da própria Server Action complementa as regras existentes do Supabase.

## BANCO / SUPABASE

Nenhuma alteração estrutural ou permanente de banco foi necessária.

O INSERT real em public.customers funcionou com o estado atual de permissões.

Nenhuma nova:

- tabela;
- coluna;
- RPC;
- policy;
- função;
- constraint

foi criada ou alterada.

Nenhum novo arquivo SQL foi necessário.

Permanecem versionados:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql
- supabase/sql/006-admin-services-insert-policy.sql

Não executar novamente esses SQLs sem necessidade concreta.

## TESTE FUNCIONAL REAL

Foi criado pela própria interface um cliente temporário:

Nome:

Teste cadastro administrativo

WhatsApp:

(41) 90000-0001

E-mail:

não informado

Observações:

Cliente temporário para validar cadastro administrativo

O cadastro foi realizado com sucesso.

A aplicação retornou para:

/admin/clientes

O total passou temporariamente de 4 para 5 clientes.

O registro temporário recebeu o id:

084b67a9-fbf9-4a45-8eb3-2f32f0b351c9

Após a validação, o registro foi removido especificamente pelo SQL Editor utilizando simultaneamente:

- id;
- telefone;
- nome.

O DELETE retornou exatamente o cliente temporário esperado.

Nenhum cliente real foi removido.

Após a limpeza, a listagem voltou a apresentar:

4 clientes.

Nenhum dado temporário permaneceu no banco.

## TESTE VISUAL

/admin/clientes:

APROVADO.

Confirmado:

- 4 clientes reais após a limpeza;
- busca existente preservada;
- edição existente preservada;
- botão NOVO CLIENTE;
- cliente temporário ausente após a limpeza.

/admin/clientes/novo:

APROVADO.

Confirmado:

- nome;
- WhatsApp;
- e-mail;
- observações;
- CADASTRAR CLIENTE;
- CANCELAR;
- VOLTAR PARA CLIENTES;
- layout administrativo preservado;
- acentuação correta.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Documentação local consultada:

- node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
- node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md

Foi utilizado o padrão de rota aninhada e Server Action com autenticação/autorização verificada no servidor.

## BUILD FINAL

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- geração das páginas concluída;
- /admin/clientes reconhecida;
- /admin/clientes/[id] reconhecida;
- /admin/clientes/novo reconhecida como rota dinâmica.

## GIT

Commit funcional:

91cd08a Adiciona cadastro administrativo de clientes

Push realizado com sucesso para origin/main.

CODIGO-COMPLETO.txt não foi incluído e deve continuar untracked.

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO.

/admin/agenda:

CONCLUÍDO, incluindo navegação por data, leitura administrativa real e gestão de status.

/admin/clientes:

CONCLUÍDO, agora com listagem, busca, cadastro e edição.

/admin/clientes/novo:

CONCLUÍDO.

/admin/clientes/[id]:

CONCLUÍDO.

/admin/servicos:

CONCLUÍDO, com listagem, cadastro e edição.

/admin/barbeiros:

CONCLUÍDO, com cadastro, listagem e edição.

/admin/barbeiros/[id]/horarios:

CONCLUÍDO.

/admin/barbeiros/[id]/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

Assinantes:

Funcionalidades existentes permanecem concluídas.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que git status --short apresenta somente:

?? CODIGO-COMPLETO.txt

Somente após o checkpoint documental iniciar outra evolução funcional.

Continuar trabalhando UMA ETAPA POR VEZ.

---

# CHECKPOINT FINAL — BUSCA E FILTRO ADMINISTRATIVO DE ASSINANTES

Data: 2026-09-08

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Busca e filtro administrativo de assinantes:

CONCLUÍDOS, TESTADOS E VERSIONADOS.

Rota:

/admin/assinantes

Commit funcional:

63db529 Adiciona busca e filtro de assinantes

Push realizado com sucesso para origin/main.

## IMPLEMENTAÇÃO

Arquivo alterado:

- app/admin/assinantes/page.tsx

A listagem administrativa passou a possuir:

- busca por nome do cliente;
- busca por WhatsApp;
- filtro por status;
- combinação de busca e status;
- parâmetros `busca` e `status` na URL;
- botão Filtrar;
- botão Limpar;
- quantidade de resultados;
- estado vazio para filtros sem correspondência.

Status preservados:

- active — Ativo;
- paused — Pausado;
- cancelled — Cancelado;
- expired — Expirado.

Nenhum status novo foi criado.

As funcionalidades existentes de cadastro e edição de assinaturas foram preservadas.

A integração assinaturas + agendamento NÃO foi alterada.

## TESTES

Executado:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /admin/assinantes reconhecida como rota dinâmica.

Teste funcional/visual:

APROVADO.

Com 1 assinatura real existente, foi confirmado:

- lista normal funcionando;
- busca por `Rodrigo` → 1 resultado;
- busca por `9990` → 1 resultado;
- busca por `inexistente` → 0 resultados;
- estado `Nenhum assinante encontrado`;
- filtro Ativo → 1 resultado;
- filtro Pausado → 0 resultados;
- Limpar → lista completa restaurada;
- card preservado;
- serviços incluídos preservados;
- status ATIVO preservado;
- EDITAR ASSINATURA preservado.

Nenhuma assinatura ou outro dado foi alterado durante os testes.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Foi mantido o padrão do Next.js 16 já confirmado pela documentação local:

searchParams: Promise<...>

com await antes da leitura dos parâmetros.

## BANCO / SUPABASE

Nenhuma alteração de banco.

Nenhuma tabela, coluna, RPC, policy, função ou constraint foi criada ou alterada.

Nenhum SQL foi executado.

SQLs versionados permanecem:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql
- supabase/sql/006-admin-services-insert-policy.sql

NÃO executar novamente esses SQLs sem necessidade concreta.

## ESTADO FUNCIONAL CONSOLIDADO

- integração assinaturas + agendamento: CONCLUÍDA;
- /admin: CONCLUÍDO;
- /admin/agenda: CONCLUÍDO;
- /admin/clientes: CONCLUÍDO com listagem, busca, cadastro e edição;
- /admin/servicos: CONCLUÍDO com listagem, cadastro e edição;
- /admin/barbeiros: CONCLUÍDO com cadastro, listagem e edição;
- /admin/bloqueios: CONCLUÍDO;
- /admin/configuracoes: primeira versão CONCLUÍDA;
- /admin/assinantes: CONCLUÍDO com cadastro, listagem, busca, filtro e edição.

## GIT

Último commit funcional:

63db529 Adiciona busca e filtro de assinantes

CODIGO-COMPLETO.txt deve permanecer untracked e NÃO deve ser versionado.

## PRÓXIMO CHAT

Usar este CONTEXTO-PROJETO.md como fonte principal.

NÃO refazer funcionalidades registradas como concluídas.

NÃO reconstruir assinaturas + agendamento.

NÃO repetir testes, consultas ou verificações já documentados sem necessidade concreta.

Primeiro confirmar o checkpoint Git mais recente e então identificar a próxima evolução funcional adequada.

Trabalhar UMA ETAPA POR VEZ.

Antes de alterar código, pedir somente o arquivo específico necessário.

Toda alteração real futura de banco deve permanecer versionada em supabase/sql/.

CODIGO-COMPLETO.txt deve continuar untracked.

---

# CHECKPOINT FINAL — INDICADORES DO DASHBOARD POR STATUS

Data: 2026-09-08

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Indicadores operacionais do dashboard alinhados aos status da Agenda:

CONCLUÍDO, TESTADO E VERSIONADO.

Rota:

/admin

Commit funcional:

9e7efbf Ajusta indicadores do dashboard por status

Push realizado com sucesso para origin/main.

## REGRA DE NEGÓCIO

Foi definido que os indicadores do dia devem considerar como atendimentos válidos:

- scheduled — Agendado;
- confirmed — Confirmado;
- completed — Concluído.

Não são considerados válidos para os indicadores/faturamento do dia:

- cancelled — Cancelado;
- no_show — Não compareceu.

Essa regra evita que um atendimento desapareça dos indicadores do dashboard apenas por passar de Agendado para Confirmado ou Concluído.

## IMPLEMENTAÇÃO

Arquivo alterado:

- app/admin/page.tsx

Foi criada a lista:

VALID_TODAY_STATUSES

contendo:

- scheduled;
- confirmed;
- completed.

A coleção utilizada pelo dashboard passou a ser:

validTodayAppointments

Essa coleção é utilizada em:

- quantidade de Agendamentos hoje;
- cálculo de Faturamento hoje;
- listagem Agenda de hoje.

O faturamento continua utilizando o valor histórico já armazenado em:

appointments.price

Nenhuma regra de preço ou benefício de assinatura foi alterada.

A integração assinaturas + agendamento permaneceu intacta.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Foi consultada a documentação local relevante:

node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md

Foi mantido o padrão existente de async Server Component com consultas de banco no servidor.

## BUILD

Executado:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída com sucesso;
- TypeScript sem erros;
- geração das páginas concluída;
- /admin reconhecida como rota dinâmica.

## TESTE VISUAL

Testado:

http://localhost:3000/admin

Resultado:

APROVADO para o estado atual.

Confirmado:

- página carregando corretamente;
- layout preservado;
- acentuação correta;
- Agendamentos hoje: 0;
- Faturamento hoje: R$ 0,00;
- Clientes: 4;
- Agenda de hoje em estado vazio correto.

Não havia atendimento no dia do teste.

Por isso a diferença visual entre scheduled, confirmed e completed não foi exercitada com um registro real.

Nenhum dado artificial foi criado exclusivamente para o teste.

Foi observado Barbeiros ativos: 0 no estado atual, mas esse dado não faz parte desta alteração e não foi investigado nesta etapa.

## BANCO / SUPABASE

Nenhuma alteração de banco.

Nenhuma tabela, coluna, RPC, policy, função ou constraint foi criada ou alterada.

Nenhum SQL foi executado.

SQLs versionados permanecem:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql
- supabase/sql/006-admin-services-insert-policy.sql

NÃO executar novamente esses SQLs sem necessidade concreta.

## GIT

Commit funcional:

9e7efbf Ajusta indicadores do dashboard por status

Push concluído:

main → origin/main

CODIGO-COMPLETO.txt deve continuar untracked e NÃO deve ser versionado.

## ESTADO FUNCIONAL

Dashboard administrativo:

CONCLUÍDO, agora considerando scheduled, confirmed e completed como atendimentos válidos nos indicadores do dia.

Demais funcionalidades consolidadas anteriormente permanecem concluídas e não foram alteradas.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que git status --short apresenta somente:

?? CODIGO-COMPLETO.txt

Somente então iniciar outra evolução funcional.

Continuar trabalhando UMA ETAPA POR VEZ.

---

# CHECKPOINT FINAL — HISTÓRICO ADMINISTRATIVO DE CLIENTES

Data: 2026-09-08

Este é o checkpoint mais recente e deve ter prioridade sobre registros anteriores quando houver divergência.

## STATUS

Histórico administrativo de clientes:

CONCLUÍDO, TESTADO E VERSIONADO.

Rota de listagem:

/admin/clientes

Nova rota:

/admin/clientes/[id]/historico

Commit funcional:

45f2311 Adiciona historico administrativo de clientes

Push realizado com sucesso para origin/main.

## IMPLEMENTAÇÃO

Arquivos alterados/criados:

- app/admin/clientes/page.tsx
- app/admin/clientes/[id]/historico/page.tsx

A listagem, busca, cadastro e edição administrativa de Clientes existentes foram preservados.

Foi adicionado em cada card da listagem o botão:

HISTÓRICO

A nova rota apresenta os agendamentos vinculados ao customers.id selecionado.

O histórico apresenta:

- quantidade de agendamentos;
- data;
- horário inicial e final;
- profissional;
- serviços;
- valor histórico do agendamento;
- status;
- estado vazio quando o cliente não possui agendamentos;
- link ABRIR NA AGENDA para a data do atendimento.

Os agendamentos são apresentados do mais recente para o mais antigo.

Timezone preservado:

America/Sao_Paulo

Os status conhecidos são apresentados com os rótulos administrativos:

- scheduled — Agendado;
- confirmed — Confirmado;
- completed — Concluído;
- cancelled — Cancelado;
- no_show — Não compareceu.

## INTEGRAÇÃO COM A AGENDA

Cada atendimento possui link para:

/admin/agenda?data=AAAA-MM-DD

O link foi testado com dado real e abriu corretamente a Agenda na data correspondente.

Teste confirmado:

http://localhost:3000/admin/agenda?data=2026-09-04

A Agenda apresentou os 2 agendamentos reais existentes naquela data.

Nenhuma funcionalidade da Agenda foi refeita ou alterada.

## TESTE COM DADOS REAIS

Foi validado um cliente real com histórico existente.

O histórico carregou corretamente informações reais de atendimento, incluindo profissional, serviço, valor e status.

Nenhum dado foi criado, alterado ou excluído durante o teste.

## TESTE VISUAL DA LISTAGEM

/admin/clientes:

APROVADO.

Confirmado:

- 4 clientes preservados;
- busca preservada;
- NOVO CLIENTE preservado;
- EDITAR preservado;
- novo botão HISTÓRICO visível nos cards;
- botões alinhados;
- sem corte ou sobreposição visual observados.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi respeitado.

Documentação local consultada:

node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md

Foi confirmado:

- roteamento aninhado por diretórios;
- segmento dinâmico [id];
- params como Promise no Next.js 16;
- uso de Link para navegação interna.

## BUILD

Build final executado:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída com sucesso;
- TypeScript sem erros;
- geração das páginas concluída;
- /admin/clientes/[id]/historico reconhecida como rota dinâmica.

## BANCO / SUPABASE

Nenhuma alteração de banco.

Foram utilizadas as permissões administrativas de leitura já existentes e documentadas.

Nenhuma tabela, coluna, RPC, policy, função, trigger ou constraint foi criada ou alterada.

Nenhum SQL foi executado.

SQLs versionados permanecem:

- supabase/sql/001-admin-blocked-times-policies.sql
- supabase/sql/002-business-settings.sql
- supabase/sql/003-admin-services-update-policy.sql
- supabase/sql/004-admin-appointments-read-policies.sql
- supabase/sql/005-admin-appointments-update-policy.sql
- supabase/sql/006-admin-services-insert-policy.sql

Não executar novamente esses SQLs sem necessidade concreta.

## GIT

Commit funcional:

45f2311 Adiciona historico administrativo de clientes

Push concluído:

main → origin/main

CODIGO-COMPLETO.txt não foi versionado e deve continuar untracked.

## ESTADO FUNCIONAL CONSOLIDADO

Integração assinaturas + agendamento:

CONCLUÍDA.

/admin:

CONCLUÍDO, incluindo indicadores por status.

/admin/agenda:

CONCLUÍDO, incluindo navegação por data, leitura administrativa real e gestão de status.

/admin/clientes:

CONCLUÍDO, com listagem, busca, cadastro, edição e acesso ao histórico.

/admin/clientes/[id]/historico:

CONCLUÍDO.

/admin/servicos:

CONCLUÍDO, com listagem, cadastro e edição.

/admin/barbeiros:

CONCLUÍDO, com cadastro, listagem e edição.

/admin/barbeiros/[id]/horarios:

CONCLUÍDO.

/admin/barbeiros/[id]/servicos:

CONCLUÍDO.

/admin/bloqueios:

CONCLUÍDO.

/admin/configuracoes:

CONCLUÍDA a primeira versão.

/admin/assinantes:

CONCLUÍDO, com cadastro, listagem, busca, filtro e edição.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md.

Não incluir CODIGO-COMPLETO.txt.

Depois fazer push e confirmar que git status --short apresenta somente:

?? CODIGO-COMPLETO.txt

Somente após esse checkpoint documental iniciar outra evolução funcional.

Continuar trabalhando UMA ETAPA POR VEZ.

---

# CHECKPOINT INTERMEDIÁRIO — ÁREA PÚBLICA / NOVA HOME

Data: 2026-09-08

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver divergência.

## NOVA FASE DO PROJETO

A expansão da área administrativa foi temporariamente interrompida.

Fase atual:

ÁREA PÚBLICA / EXPERIÊNCIA DO CLIENTE.

Objetivo:

Preparar o projeto para apresentação ao proprietário da Black Navalha, transformando a experiência pública em uma apresentação convincente de produto real.

Regras mantidas:

- NÃO reconstruir /agendar;
- integração assinaturas + agendamento permanece concluída;
- NÃO refazer funcionalidades administrativas concluídas;
- NÃO realizar auditoria geral;
- NÃO alterar banco sem necessidade concreta;
- toda alteração futura real de banco continua versionada em supabase/sql/;
- trabalhar UMA ETAPA POR VEZ;
- utilizar npm.cmd nesta máquina;
- CODIGO-COMPLETO.txt deve permanecer untracked e NÃO deve ser versionado.

## GIT OFICIAL NO INÍCIO DESTA FASE

Branch:

main

Último commit funcional confirmado:

45f2311 Adiciona historico administrativo de clientes

Checkpoint documental oficial informado no início da continuidade:

60f2584 Registra historico administrativo de clientes

main informada como sincronizada com origin/main.

CODIGO-COMPLETO.txt permanece untracked.

## HOME PÚBLICA ANTERIOR

Arquivo analisado:

app/page.tsx

Estado encontrado antes desta evolução:

- Server Component;
- consulta de services ativos;
- catálogo simples de serviços;
- fundo preto;
- cards básicos;
- identificação de serviços subscriber_service como "Incluso no plano";
- título principal "Agende seu horário";
- não existia apresentação institucional forte;
- não existia CTA claro levando para /agendar;
- não utilizava business_settings;
- não utilizava fotografias reais da Black Navalha.

## REFERÊNCIAS VISUAIS RECEBIDAS

Foram fornecidas artes e fotografias reais da Black Navalha usadas como referência de identidade.

Direção visual identificada:

- preto como base dominante;
- branco de alto contraste;
- dourado/bronze como destaque;
- títulos grandes, pesados e condensados;
- fotografia real como elemento importante;
- comunicação baseada em identidade, técnica, atenção, precisão, detalhes e valorização pessoal.

Frases presentes nas referências reforçam conceitos como:

- Seu cabelo tem identidade;
- O diferencial está nos detalhes;
- Um bom corte valoriza você;
- O corte certo muda completamente sua aparência.

Também foi fornecida a logo oficial da Black Navalha.

## ATIVOS PÚBLICOS ADICIONADOS LOCALMENTE

Foi criada:

public/black-navalha/

Arquivos atualmente adicionados:

- public/black-navalha/hero.jpg
- public/black-navalha/resultado-01.jpg
- public/black-navalha/resultado-02.jpg
- public/black-navalha/fachada.jpg
- public/black-navalha/logo.png

As fotografias representam:

- imagem principal para hero;
- resultados reais de cortes/acabamentos;
- fachada real da Black Navalha.

A logo possui:

1591x1180

Foi verificado o pixel do canto superior esquerdo:

A=0 R=255 G=255 B=255

Portanto o PNG possui transparência real e pode ser utilizado sobre fundo escuro.

IMPORTANTE:

A logo ainda NÃO foi incorporada ao cabeçalho da Home.

Esse é um dos próximos ajustes.

## NEXT.JS 16 / AGENTS.md

AGENTS.md foi lido e respeitado.

Foram localizados e consultados os guias locais relevantes do Next.js 16:

- node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md
- node_modules/next/dist/docs/01-app/01-getting-started/11-css.md
- node_modules/next/dist/docs/01-app/01-getting-started/12-images.md

Foi confirmado o uso de:

- Link para navegação;
- CSS Modules para estilos locais;
- next/image para imagens;
- arquivos em public acessados a partir da raiz.

Não repetir essa leitura sem nova necessidade relacionada a essas mesmas convenções.

## BUSINESS_SETTINGS

Foi consultado somente:

app/admin/configuracoes/page.tsx

Foi confirmado que a configuração institucional existente é carregada de:

public.business_settings

utilizando:

- ordenação por created_at ascendente;
- limit(1);
- maybeSingle().

Campos utilizados:

- name;
- whatsapp;
- address;
- instagram.

A nova Home segue o mesmo padrão de leitura.

Nenhuma consulta de schema/policies foi repetida.

Nenhuma alteração de banco foi realizada.

## IMPLEMENTAÇÃO ATUAL DA NOVA HOME

Arquivos criados/alterados nesta etapa:

- app/page.tsx
- app/page.module.css
- public/black-navalha/hero.jpg
- public/black-navalha/resultado-01.jpg
- public/black-navalha/resultado-02.jpg
- public/black-navalha/fachada.jpg
- public/black-navalha/logo.png

app/page.tsx continua como Server Component.

A implementação atual:

- consulta services ativos;
- consulta business_settings;
- executa as duas leituras em paralelo;
- utiliza dados institucionais reais quando disponíveis;
- possui fallback para Black Navalha;
- cria navegação pública;
- cria hero;
- possui CTA direto para /agendar;
- possui seção de trabalhos reais;
- possui vitrine dos serviços reais;
- mantém serviços subscriber_service apresentados como "Incluso no plano";
- NÃO trata R$ 0,00 como gratuidade pública;
- possui seção de experiência;
- utiliza a foto da fachada;
- apresenta endereço, WhatsApp e Instagram quando configurados;
- possui múltiplos caminhos para /agendar;
- inclui tratamento de links de WhatsApp e Instagram;
- possui responsividade no CSS Module.

A integração existente de /agendar NÃO foi alterada.

## CSS

Foi criado:

app/page.module.css

Motivo:

Manter toda a nova identidade visual da Home isolada e evitar aumentar/conflitar com app/globals.css, que já possui grande quantidade de estilos administrativos e do fluxo de agendamento.

A paleta atual da Home utiliza principalmente:

- #080808 / preto;
- tons de cinza;
- branco;
- dourado #d29d4f;
- dourado claro #e6b96d.

## BUILD

Executado após a primeira implementação:

npm.cmd run build

Resultado:

APROVADO.

- Next.js 16.3.4;
- Compiled successfully;
- TypeScript concluído sem erros;
- geração das páginas concluída;
- rota / reconhecida como dinâmica;
- nenhum erro de build.

## SERVIDOR LOCAL

Já existia um next dev deste mesmo projeto em:

http://localhost:3000

PID observado:

16676

Não foi necessário iniciar outro servidor.

## VALIDAÇÃO VISUAL INTERMEDIÁRIA

A nova Home foi aberta no navegador em:

http://localhost:3000/

Foi fornecida captura visual do hero em desktop.

Confirmado visualmente:

- cabeçalho público;
- navegação Trabalhos / Serviços / Contato;
- CTA AGENDAR HORÁRIO;
- hero com fotografia real;
- mensagem "SEU ESTILO. SUA IDENTIDADE.";
- identidade preta/branca/dourada;
- CTA principal AGENDAR HORÁRIO;
- CTA VER SERVIÇOS;
- bloco "O DIFERENCIAL ESTÁ NOS DETALHES";
- direção visual coerente com as artes fornecidas.

A validação é INTERMEDIÁRIA.

A Home ainda NÃO deve ser considerada concluída.

## PENDÊNCIAS DA HOME

No próximo chat continuar exatamente desta implementação.

Primeiro ajuste previsto:

- substituir a marca textual "BLACK NAVALHA" do cabeçalho pela logo oficial transparente, dimensionada de forma adequada ao header.

Depois continuar a validação visual da página completa.

Ainda deve ser validado:

- hero depois da inclusão da logo;
- seção Trabalhos;
- seção Serviços com dados reais;
- seção Experiência;
- informações vindas de business_settings;
- rodapé;
- navegação por âncoras;
- CTA para /agendar;
- WhatsApp;
- Instagram;
- responsividade/mobile.

Fazer refinamentos somente a partir da aparência real observada.

## IMPORTANTE — NÃO COMMITAR AINDA

A funcionalidade pública está EM IMPLEMENTAÇÃO.

NÃO criar commit funcional desta Home neste checkpoint.

NÃO fazer push desta implementação ainda.

Primeiro concluir:

- logo no cabeçalho;
- validação visual completa;
- responsividade;
- teste dos links/CTAs;
- npm.cmd run build após o último ajuste.

Somente depois:

- git status;
- staging com caminhos explícitos;
- NÃO incluir CODIGO-COMPLETO.txt;
- commit funcional;
- push;
- atualizar CONTEXTO-PROJETO.md;
- criar checkpoint documental final.

## BANCO / SUPABASE NESTA ETAPA

Nenhuma alteração.

Nenhuma tabela, coluna, RPC, policy, função, trigger ou constraint foi criada ou alterada.

Nenhum SQL foi executado.

Não há necessidade de criar novo SQL para a Home atual.

## PRÓXIMO PASSO EXATO PARA O PRÓXIMO CHAT

Usar este checkpoint como prioridade.

NÃO reiniciar a análise da Home.

NÃO pedir novamente:

- app/page.tsx;
- app/globals.css;
- app/admin/configuracoes/page.tsx;
- AGENTS.md;
- documentação de Link/CSS/Image;
- listagem inicial dos ativos.

Os arquivos atuais necessários já foram analisados e alterados.

Continuar a partir da captura visual intermediária recebida.

Primeiro:

incorporar public/black-navalha/logo.png ao cabeçalho da Home.

Depois:

validar visualmente a página e realizar os refinamentos necessários UMA ETAPA POR VEZ.

A Home ainda está EM IMPLEMENTAÇÃO.


---

# CHECKPOINT INTERMEDIÁRIO — ÁREA PÚBLICA / REFINAMENTO DA NOVA HOME
Data: 2026-09-08

## Estado da fase

A fase atual continua sendo:

ÁREA PÚBLICA / EXPERIÊNCIA DO CLIENTE.

A expansão administrativa permanece temporariamente interrompida.

A Home `/` continua EM IMPLEMENTAÇÃO e NÃO deve receber commit funcional ainda.

## Estado Git de referência

Branch:
main

Último commit funcional anterior:
45f2311 Adiciona historico administrativo de clientes

Último checkpoint documental anterior:
60f2584 Registra historico administrativo de clientes

`CODIGO-COMPLETO.txt` deve continuar untracked e NÃO deve ser versionado.

## Arquivos da Home em trabalho

- app/page.tsx
- app/page.module.css
- public/black-navalha/hero.jpg
- public/black-navalha/resultado-01.jpg
- public/black-navalha/resultado-02.jpg
- public/black-navalha/fachada.jpg
- public/black-navalha/logo.png

## O que já estava implementado

A Home utiliza:

- Server Component;
- serviços ativos reais do Supabase;
- `business_settings` reais;
- hero com fotografia real;
- identidade preto/branco/dourado;
- navegação Trabalhos / Serviços / Contato;
- CTA para `/agendar`;
- seção de trabalhos;
- fachada;
- endereço;
- WhatsApp;
- Instagram;
- rodapé;
- CSS Module próprio e responsivo.

Build da primeira implementação da Home:

`npm.cmd run build`

APROVADO anteriormente, sem erros de TypeScript.

IMPORTANTE: ainda será necessário executar novo build ao final dos refinamentos atuais.

## Cabeçalho / logo — estado atual

A marca textual original do cabeçalho foi substituída.

O cabeçalho agora utiliza:

- o emblema de `public/black-navalha/logo.png`;
- texto `BLACK NAVALHA` ao lado;
- composição inspirada na identidade visual enviada como referência;
- dimensionamento específico para desktop/mobile.

A composição foi visualmente aceita como direção atual.

## Serviços — nova direção implementada

A antiga grade que exibia cada serviço individualmente com preço e duração foi abandonada.

A Home agora agrupa os serviços reais em grandes cards por categoria.

Estrutura atual:

- ASSINATURA;
- BARBA;
- CABELO;
- DEPILAÇÃO;
- ESTÉTICA;
- demais categorias reais, caso existam.

Os dados continuam vindo dos serviços ativos reais do Supabase.

### Assinaturas

Os serviços com `subscriber_service` são separados dos serviços regulares e apresentados no card:

BLACK NAVALHA
ASSINATURA

Exemplos atualmente exibidos:

- Barba Assinante Mensal;
- Cabelo + Barba Assinante Mensal;
- Cabelo Assinante Mensal;
- Raspado + Barba Assinante Mensal.

O card de assinatura possui o botão:

CONHECER PLANOS

A página/rota de planos AINDA NÃO deve ser criada.
Por enquanto esse botão é somente parte da proposta visual.

### Categorias regulares

Os demais serviços são agrupados dinamicamente por `category`.

Cada card utiliza o padrão visual:

BLACK NAVALHA
NOME DA CATEGORIA

Exemplos visualizados:

- BARBA;
- CABELO;
- DEPILAÇÃO;
- ESTÉTICA.

Dentro de cada card aparecem somente os nomes dos serviços.

Foram removidos da vitrine da Home:

- preços;
- duração;
- selo Plano;
- checks;
- texto "Serviço disponível para agendamento".

Os marcadores das listas foram refinados para pequenas bolinhas douradas sólidas.

Os cards regulares são links para:

`/agendar`

O card ASSINATURA é a exceção e não deve enviar diretamente para `/agendar`.

O botão geral:

`VER SERVIÇOS E AGENDAR`

foi removido da parte inferior da seção.

Também foi solicitado retirar do texto introdutório:

`Valores e horários são apresentados no momento do agendamento.`

## Experiência / Como chegar — estado funcional atual, VISUAL NÃO APROVADO

A antiga área “A EXPERIÊNCIA” continha:

- título “Mais do que cortar o cabelo”;
- tópicos numerados 01, 02 e 03;
- botão “Agendar agora”.

Foi solicitado substituir essa parte por uma área de localização.

A implementação atual já substituiu funcionalmente esse conteúdo por:

- título `COMO CHEGAR`;
- título principal `ENCONTRE A BLACK NAVALHA.`;
- mapa Google Maps incorporado;
- endereço real de `business_settings`;
- WhatsApp real;
- Instagram real;
- botão `COMO CHEGAR`;
- botão abre Google Maps em nova aba usando o endereço real.

A fachada continua sendo exibida ao lado.

O mapa utiliza o endereço para construir:

- URL de pesquisa do Google Maps;
- URL de embed do Google Maps.

NÃO foi feita alteração no banco.

### PROBLEMA VISUAL ATUAL

A implementação funcional de “Como chegar” entrou, porém o resultado visual foi REPROVADO.

Captura mais recente mostrou:

- fachada grande à esquerda;
- conteúdo de localização à direita;
- título excessivamente grande;
- mapa pequeno e comprimido;
- endereço/WhatsApp/Instagram sem hierarquia visual adequada;
- pouco equilíbrio entre mapa, dados e fotografia;
- composição geral visualmente ruim.

NÃO remover a funcionalidade já criada sem necessidade.

O próximo passo deve ser REFINAR VISUALMENTE essa seção, preservando:

- foto da fachada;
- mapa;
- endereço real;
- WhatsApp real;
- Instagram real;
- botão funcional de Como chegar.

Não voltar aos tópicos 01/02/03.

## Próximo passo EXATO

Começar pelo refinamento visual da seção:

COMO CHEGAR / LOCALIZAÇÃO.

Não reiniciar a análise da Home.

Usar o estado visual mais recente como referência.

Objetivo sugerido:

- equilibrar fachada e bloco de localização;
- reduzir e reorganizar tipografia;
- dar mais espaço e presença ao mapa;
- organizar Endereço / WhatsApp / Instagram;
- manter estética preto/branco/dourado;
- manter o botão Como chegar funcional;
- validar desktop visualmente;
- depois validar mobile.

Trabalhar UMA ETAPA POR VEZ e esperar validação visual antes de seguir.

## Depois da seção Como chegar

Continuar validação gradual de:

- hero;
- Trabalhos;
- Serviços;
- business_settings;
- rodapé;
- âncoras;
- CTA para `/agendar`;
- WhatsApp;
- Instagram;
- mobile/responsividade.

Fazer refinamentos somente com base no estado visual real.

## Restrições que continuam válidas

- NÃO reconstruir `/agendar`;
- NÃO alterar banco;
- NÃO retomar funcionalidades administrativas;
- NÃO fazer auditoria geral;
- NÃO pedir novamente arquivos/documentos já analisados sem necessidade;
- NÃO repetir documentação de Link, CSS Modules ou next/image;
- trabalhar UMA ETAPA POR VEZ;
- preferir `Set-Content` ao alterar código;
- fornecer UM único comando completo por etapa;
- usar `npm.cmd` nesta máquina;
- NÃO fazer commit enquanto a Home estiver em implementação;
- antes do commit final executar `npm.cmd run build`;
- fazer teste visual/funcional final;
- staging somente com caminhos explícitos;
- NÃO incluir `CODIGO-COMPLETO.txt`;
- ao concluir a Home: commit funcional + push;
- depois atualizar `CONTEXTO-PROJETO.md` e criar checkpoint documental.

---

# CHECKPOINT INTERMEDIÁRIO — ÁREA PÚBLICA / HOME — REFINAMENTOS E NAVEGAÇÃO POR CATEGORIA

Data: 2026-09-09

Este é o checkpoint mais recente e deve ter PRIORIDADE ABSOLUTA sobre checkpoints anteriores quando houver divergência.

## FASE ATUAL

ÁREA PÚBLICA / EXPERIÊNCIA DO CLIENTE.

A expansão administrativa permanece temporariamente interrompida.

A Home `/` continua EM IMPLEMENTAÇÃO.

NÃO fazer commit funcional da Home ainda.

## GIT DE REFERÊNCIA

Branch:

main

Último commit funcional anterior:

45f2311 Adiciona historico administrativo de clientes

Último checkpoint documental anterior informado no início desta fase:

60f2584 Registra historico administrativo de clientes

Existem alterações locais da Home ainda não versionadas.

CODIGO-COMPLETO.txt deve continuar untracked e NÃO deve ser versionado.

## REGRAS DE CONTINUIDADE

- NÃO reiniciar a análise da Home;
- NÃO reconstruir `/agendar`;
- NÃO alterar banco;
- NÃO retomar funcionalidades administrativas;
- NÃO fazer auditoria geral;
- NÃO repetir consultas/documentação já realizadas sobre Link, CSS Modules ou next/image;
- trabalhar UMA ETAPA POR VEZ;
- fornecer UM único comando completo por etapa;
- usar npm.cmd nesta máquina;
- preferir Set-Content para alterações de código;
- NÃO fazer commit enquanto a Home estiver em implementação;
- CODIGO-COMPLETO.txt deve permanecer untracked.

## ARQUIVOS PRINCIPAIS ATUALMENTE EM TRABALHO

- app/page.tsx
- app/page.module.css
- app/gallery-lightbox.tsx
- app/agendar/booking-flow.tsx
- public/black-navalha/hero.jpg
- public/black-navalha/resultado-01.jpg
- public/black-navalha/resultado-02.jpg
- public/black-navalha/fachada.jpg
- public/black-navalha/logo.png

IMPORTANTE:

app/agendar/booking-flow.tsx foi alterado SOMENTE para suportar navegação/scroll até uma categoria a partir da Home.

Nenhuma regra de negócio do agendamento foi reconstruída ou alterada.

## CABEÇALHO

Estado atual aprovado como base:

- logo oficial transparente;
- emblema;
- texto BLACK NAVALHA;
- identidade preto/branco/dourado.

## SERVIÇOS NA HOME

Os serviços ativos reais continuam vindo do Supabase.

Serviços subscriber_service aparecem no card especial:

BLACK NAVALHA
ASSINATURA

Exemplos existentes:

- Barba Assinante Mensal;
- Cabelo + Barba Assinante Mensal;
- Cabelo Assinante Mensal;
- Raspado + Barba Assinante Mensal.

O card possui:

CONHECER PLANOS

NÃO criar ainda página de planos.

ASSINATURA NÃO deve direcionar para `/agendar` nesta lógica de categorias.

Os serviços regulares são agrupados dinamicamente por category.

Exemplos:

- BARBA;
- CABELO;
- DEPILAÇÃO;
- ESTÉTICA.

Dentro dos cards aparecem somente nomes dos serviços.

Não exibir:

- preços;
- duração;
- checks;
- texto "Serviço disponível para agendamento".

Marcadores atuais:

pequenas bolinhas douradas sólidas.

## NAVEGAÇÃO HOME → CATEGORIA DO AGENDAMENTO

Nova melhoria implementada e testada nesta sessão.

Objetivo:

Ao clicar no card/botão AGENDAR de uma categoria regular da Home, abrir `/agendar` diretamente na categoria correspondente.

Exemplo validado:

BARBA
→ /agendar#categoria-barba

O comportamento NÃO seleciona automaticamente nenhum serviço.

Ele apenas posiciona a página na categoria correspondente.

ASSINATURA permanece fora dessa lógica.

Implementação:

Foi criada uma função getCategoryAnchor(category) em:

- app/page.tsx
- app/agendar/booking-flow.tsx

Ela:

- normaliza acentos;
- converte para minúsculas;
- transforma espaços/caracteres em hífens;
- gera ids no padrão:

categoria-barba
categoria-cabelo
categoria-depilacao
categoria-estetica

Na Home, os cards regulares passaram de:

/agendar

para:

/agendar#categoria-...

No BookingFlow, cada seção:

booking-category

recebe:

id={getCategoryAnchor(category)}

Como o salto nativo do hash ocorreu antes do momento adequado de montagem/hidratação do Client Component, inicialmente `/agendar#categoria-barba` abriu em posição incorreta próxima ao final da página.

A correção foi implementar em BookingFlow um useEffect que:

- lê window.location.hash;
- aceita hashes iniciados por #categoria-;
- localiza o elemento correspondente por document.getElementById();
- aguarda frames de renderização com requestAnimationFrame;
- executa scrollIntoView();
- não altera nenhuma seleção.

Também foi necessário adicionar useEffect ao import React do booking-flow.tsx.

Teste final realizado:

Home
→ card BARBA
→ AGENDAR

Resultado:

APROVADO.

A URL abriu como:

/agendar#categoria-barba

e a página foi posicionada corretamente na seção BARBA.

Nenhum serviço foi selecionado automaticamente.

Não houve alteração de preço, assinatura, disponibilidade, profissional, data, horário ou criação de agendamento.

As demais categorias utilizam a mesma geração dinâmica, mas o teste solicitado nesta etapa foi especificamente BARBA.

## COMO CHEGAR — REFINAMENTO DESKTOP

A seção funcional de localização foi mantida e refinada visualmente.

Preservado:

- fachada real;
- mapa Google Maps;
- endereço real de business_settings;
- WhatsApp real;
- Instagram real;
- botão COMO CHEGAR;
- abertura do Google Maps em nova aba.

Refinamento desktop realizado em app/page.module.css:

- melhor proporção entre fachada e conteúdo;
- coluna do mapa ganhou maior presença;
- título reduzido;
- melhor hierarquia;
- mapa ampliado;
- informações organizadas;
- endereço/WhatsApp/Instagram distribuídos de forma mais clara;
- botão Como chegar destacado;
- estética preto/branco/dourado preservada.

Validação visual:

APROVADA pelo responsável.

## AVALIAÇÕES DO GOOGLE

Foi adicionada nova seção entre:

COMO CHEGAR

e:

PRONTO PARA CUIDAR DO VISUAL?

A seção utiliza conteúdo editorial baseado em avaliações reais fornecidas por captura do perfil da Black Navalha no Google.

Perfil utilizado:

Barbearia Black Navalha | Atuba Pinhais

URL real do Google Maps foi fornecida e utilizada no link para ver todas as avaliações.

Indicador observado na captura:

5,0
90 avaliações

Avaliações reais utilizadas na Home:

Wellington Salazario:
"Ótimo atendimento, corte tri bom! Profissional excelente! O melhor da região! Voltarei outras vezes."

Paulo Otavio:
"Curti muito a experiência e podem ter certeza que ganharam mais um cliente."

Carlos Mateus:
"Parabéns ao atendimento e pelo excelente trabalho vcs são fera."

As três aparecem com 5 estrelas.

A seção possui:

- label AVALIAÇÕES;
- título QUEM CONHECE, RECOMENDA.;
- resumo 5,0;
- cinco estrelas;
- 90 avaliações;
- três cards;
- botão/link VER TODAS AS AVALIAÇÕES NO GOOGLE.

IMPORTANTE:

Esses dados NÃO são sincronizados automaticamente com Google.

São conteúdo editorial real obtido das capturas fornecidas.

Não foi criada integração com Google Places API.

Nenhuma API key foi criada.

Nenhum scraping foi implementado.

Validação visual desktop:

APROVADA pelo responsável.

## GALERIA / TRABALHOS

Foi identificado que as fotos da seção Trabalhos eram recortadas devido ao uso de:

object-fit: cover

Foi decidido preservar a composição visual da galeria e permitir ampliação das fotos.

Criado:

app/gallery-lightbox.tsx

O componente é Client Component e isola a interação da galeria sem transformar app/page.tsx inteiro em Client Component.

A galeria agora permite clicar nas imagens para ampliar.

Lightbox implementado com:

- fundo escuro;
- fotografia inteira usando object-fit: contain;
- botão X para fechar;
- fechamento pela tecla Escape;
- fechamento clicando no fundo;
- bloqueio de scroll da página enquanto aberto;
- indicação de "Clique para ampliar";
- cursor de zoom;
- hover preservado.

As fotografias usadas continuam:

- resultado-01.jpg;
- resultado-02.jpg;
- hero.jpg.

## TROCA DE IMAGENS / CACHE DO NEXT.JS

Durante a sessão, algumas imagens em public/black-navalha foram substituídas mantendo exatamente os mesmos nomes.

Foi observado que F5 podia continuar exibindo imagens antigas por causa do cache/otimização local do Next.js.

Foi tentado inicialmente adicionar query string `?v=...` aos src de next/image.

Isso causou erro no Next.js 16:

Image ... is using a query string which is not configured in images.localPatterns

Essa tentativa foi DESFEITA.

NÃO voltar a adicionar `?v=` diretamente aos src locais de next/image neste projeto sem configuração correspondente.

Solução utilizada com sucesso:

- remover query strings;
- parar o servidor;
- apagar `.next`;
- reiniciar com npm.cmd run dev.

Procedimento recomendado quando uma foto for substituída mantendo o mesmo nome e o cache persistir:

parar o servidor com Ctrl+C

e executar:

if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }; npm.cmd run dev

Isso funcionou.

## ESTADO VISUAL ATUAL

Desktop:

- cabeçalho aprovado como direção;
- hero existente;
- Trabalhos com lightbox;
- Serviços agrupados por categoria;
- Como chegar refinado e aprovado;
- Avaliações adicionadas e aprovadas;
- CTA final preservado;
- identidade preto/branco/dourado preservada.

Ainda NÃO considerar Home concluída.

## BUILD

A primeira implementação da Home havia passado anteriormente em:

npm.cmd run build

Porém ocorreram várias alterações depois desse build.

Portanto é OBRIGATÓRIO executar novamente:

npm.cmd run build

antes do commit funcional final.

NÃO assumir que o build anterior cobre o estado atual.

## BANCO / SUPABASE

Nenhuma alteração nesta fase de refinamento.

Não criar SQL.

Não alterar business_settings.

Não alterar serviços no banco.

## HOME E AGENDAMENTO

A integração assinaturas + agendamento continua considerada concluída.

A única alteração atual em app/agendar/booking-flow.tsx é de navegação visual por hash/categoria.

NÃO reconstruir essa página.

NÃO alterar regras de preço ou assinatura.

## PRÓXIMO CHAT — CONTINUIDADE

Começar deste estado.

NÃO reiniciar análise.

Antes de concluir a Home ainda falta validar/refinar gradualmente:

- comportamento das demais categorias Home → /agendar além de BARBA;
- responsividade/mobile da nova Home;
- responsividade de COMO CHEGAR;
- responsividade da seção AVALIAÇÕES;
- galeria/lightbox em mobile;
- hero;
- Serviços;
- rodapé;
- âncoras;
- CTAs;
- WhatsApp;
- Instagram.

ASSINATURA ainda terá decisão própria posteriormente.

O botão CONHECER PLANOS ainda NÃO possui página dedicada e não deve ser enviado automaticamente para /agendar.

Trabalhar UMA ETAPA POR VEZ.

Esperar validação do responsável antes de avançar.

## ANTES DO COMMIT FINAL DA HOME

Obrigatório:

1. concluir refinamentos;
2. testar desktop;
3. testar mobile;
4. testar links/CTAs;
5. testar navegação por categorias;
6. testar lightbox;
7. executar npm.cmd run build;
8. verificar git status;
9. staging SOMENTE com caminhos explícitos;
10. NÃO incluir CODIGO-COMPLETO.txt;
11. commit funcional;
12. push;
13. atualizar CONTEXTO-PROJETO.md;
14. criar checkpoint documental final.

A Home continua EM IMPLEMENTAÇÃO.


---

# CHECKPOINT INTERMEDIÁRIO — HOME / RESPONSIVIDADE MOBILE — CONTINUIDADE

Data: 2026-09-09

Este checkpoint complementa o checkpoint mais recente da Home de 2026-09-09.

A Home continua EM IMPLEMENTAÇÃO.

NÃO fazer commit ainda.

## REGRA PARA A PRÓXIMA CONTINUIDADE

Antes de trabalhar no projeto, LER INTEGRALMENTE o CONTEXTO-PROJETO.md e dar prioridade absoluta aos checkpoints mais recentes.

NÃO reiniciar a análise do zero.

## FASE ATUAL

ÁREA PÚBLICA / EXPERIÊNCIA DO CLIENTE.

A expansão administrativa continua interrompida.

NÃO alterar banco.

NÃO reconstruir /agendar.

CODIGO-COMPLETO.txt deve continuar untracked e NÃO deve ser versionado.

## NAVEGAÇÃO HOME → CATEGORIAS

Validação atualizada nesta sessão:

TODOS os cards regulares da Home que possuem AGENDAR foram testados pelo responsável e estão funcionando.

Resultado aprovado:

- categoria correspondente abre em /agendar#categoria-...;
- scroll posiciona na categoria correta;
- nenhum serviço é selecionado automaticamente.

Portanto considerar a navegação de TODAS as categorias regulares:

APROVADA.

ASSINATURA permanece fora dessa lógica.

CONHECER PLANOS continua sem página/destino definitivo.

## OBJETIVO ATUAL

A etapa atual é:

RESPONSIVIDADE MOBILE DA HOME.

Durante validação em Chrome DevTools Device Mode foram encontrados problemas reais principalmente em:

- Serviços;
- Como chegar;
- Avaliações.

Avaliações recebeu ajuste responsivo e apresentou resultado visual significativamente melhor em captura posterior.

Como chegar também chegou a apresentar composição mobile adequada em uma captura, com:

- fachada;
- título;
- mapa;
- endereço;
- WhatsApp;
- Instagram;
- botão Como chegar

organizados verticalmente.

Esses resultados ainda devem ser revisitados dentro de uma emulação mobile confiável antes de aprovação final.

## PROBLEMA ATUAL — SERVIÇOS MOBILE

A seção Serviços continua apresentando overflow/layout horizontal em algumas capturas mobile.

A estrutura REAL atual identificada em app/page.tsx utiliza:

- serviceGroups;
- serviceGroup;
- subscriptionGroup;
- serviceGroupLink;
- serviceGroupHeader;
- serviceList.

O container real é:

serviceGroups

A regra base identificada em app/page.module.css é:

.serviceGroups {
  display: grid;
  grid-template-columns: repeat(3, minmax(280px, 1fr));
  ...
}

Foi identificado que regras mobile antigas existentes utilizavam:

.servicesGrid

e:

.serviceCard

mas essas classes NÃO correspondem à estrutura atual dos cards agrupados.

Portanto qualquer correção futura de Serviços mobile deve considerar as classes atuais:

serviceGroups / serviceGroup

e não depender das classes antigas servicesGrid / serviceCard.

## ALTERAÇÕES CSS EXPERIMENTAIS DESTA SESSÃO

Foram acrescentados ao FINAL de:

app/page.module.css

blocos @media (max-width: 620px) experimentais.

O primeiro tenta tratar:

- Serviços;
- Como chegar;
- Avaliações.

Porém parte de Serviços nesse primeiro bloco utiliza classes antigas:

.servicesGrid
.serviceCard

Avaliações apresentou melhora visual após esse bloco.

Como chegar também apresentou composição mobile adequada em captura posterior.

Depois foi acrescentado outro bloco específico utilizando as classes atuais:

.serviceGroups
.serviceGroup
.serviceGroupHeader
.serviceList

Apesar disso, em determinadas capturas do Device Mode os cards ainda apareceram lado a lado.

IMPORTANTE:

Esses blocos foram tentativas intermediárias.

NÃO considerar a correção de Serviços mobile concluída.

Antes de qualquer nova alteração, inspecionar o estado FINAL atual de app/page.module.css, especialmente os blocos adicionados ao fim do arquivo.

Evitar continuar acumulando overrides sem entender o estado atual.

## CHROME DEVICE MODE / VIEWPORT

Durante o diagnóstico houve comportamento inconsistente no Chrome DevTools.

Em alguns momentos:

- Device Mode mostrava largura aproximada de 390 px;
- window.innerWidth retornava 890.

Em outro momento, após alternar Device Mode:

window.innerWidth retornou 405.

Posteriormente voltou a retornar 890.

Foi confirmado diretamente no navegador que a meta viewport existente era:

width=device-width, initial-scale=1

A documentação local do Next.js 16 também confirmou que essa viewport é gerada automaticamente por padrão.

Portanto NÃO assumir que a ausência de viewport era a causa do problema.

O diagnóstico do comportamento inconsistente do Chrome Device Mode ficou INCONCLUSIVO.

Também foi confundido temporariamente o controle visual de zoom "100%" do Device Mode com DPR. Essa interpretação estava errada.

NÃO usar essa hipótese na próxima continuidade.

## DOCUMENTAÇÃO NEXT.JS 16 CONSULTADA NESTA SESSÃO

Foi lido:

node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md

A documentação confirmou:

- viewport estática pode ser exportada em layout/page Server Component;
- Next.js já gera viewport padrão automaticamente;
- padrão normalmente suficiente;
- configuração manual geralmente desnecessária.

Não repetir essa leitura sem necessidade concreta.

## ALTERAÇÃO EXPERIMENTAL EM app/layout.tsx

Durante o diagnóstico foi substituído:

app/layout.tsx

Foi adicionado explicitamente:

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

Também foram alterados:

- title para Black Navalha;
- description para Barbearia Black Navalha;
- html lang de en para pt-BR.

IMPORTANTE:

A viewport explícita NÃO resolveu o comportamento observado no Device Mode.

Essa alteração NÃO foi validada como necessária para corrigir responsividade.

O próximo chat deve REVISAR app/layout.tsx antes de decidir mantê-la.

Não presumir que viewport explícita é a solução.

Não fazer commit dessa alteração automaticamente.

## AVISO DO NEXT/IMAGE

O Console apresentou warning relacionado a:

/black-navalha/hero.jpg

O warning informa que a imagem com fill possui:

sizes="100vw"

mas não é renderizada na largura total da viewport.

Também apareceu anteriormente recomendação relacionada a LCP/loading.

Isso é warning de performance e NÃO foi identificado como causa do problema de layout mobile.

Não priorizar esse warning antes de resolver a responsividade visual atual.

## TEXTO IDENTIFICADO COMO PENDÊNCIA

Foi observado em app/page.tsx que ainda existe o texto:

"Valores e horários são apresentados no momento do agendamento."

Checkpoint anterior registrava solicitação para removê-lo.

Não misturar essa pequena correção com diagnóstico de responsividade sem necessidade.

## ESTADO DE APROVAÇÃO

Desktop anteriormente aprovado:

- Como chegar;
- Avaliações;
- navegação por categoria;
- direção visual geral.

Mobile:

- ainda NÃO aprovado como conjunto;
- Serviços ainda possui problema pendente;
- hero ainda precisa refinamento/validação final;
- galeria/lightbox ainda precisa teste mobile final;
- rodapé, CTAs e links ainda precisam validação final.

## PRÓXIMO PASSO EXATO

No próximo chat:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint e o checkpoint anterior de 2026-09-09;
3. NÃO alterar banco;
4. NÃO retomar Admin;
5. NÃO reconstruir /agendar;
6. NÃO fazer commit;
7. inspecionar somente o estado final atual de app/page.module.css, especialmente os últimos blocos @media adicionados nesta sessão;
8. inspecionar app/layout.tsx somente para decidir conscientemente se a alteração experimental deve permanecer;
9. remover/consolidar overrides mobile experimentais se necessário, em vez de continuar acumulando CSS;
10. corrigir primeiro Serviços mobile usando as classes atuais serviceGroups/serviceGroup;
11. validar em viewport mobile confiável;
12. depois continuar Como chegar, Avaliações, hero, galeria/lightbox, rodapé e CTAs.

Antes do commit final da Home ainda permanece obrigatório:

- validação desktop;
- validação mobile;
- links e CTAs;
- lightbox;
- npm.cmd run build;
- git status;
- staging somente com caminhos explícitos;
- nunca incluir CODIGO-COMPLETO.txt;
- commit funcional;
- push;
- atualização final de CONTEXTO-PROJETO.md;
- checkpoint documental.

## IMPORTANTE

Nenhuma alteração desta sessão deve ser considerada automaticamente pronta para commit.

A prioridade do próximo chat é estabilizar o CSS responsivo atual com mudanças mínimas e verificáveis.
---

# CHECKPOINT INTERMEDIÁRIO — HOME MOBILE VALIDADA / PRÓXIMA FASE ASSINATURAS — 2026-09-09

## HOME / MOBILE — ESTADO VALIDADO

A etapa de refinamento mobile da Home avançou e os seguintes pontos foram validados visualmente em Device Mode de aproximadamente 390 x 844:

- Serviços mobile corrigidos para a estrutura REAL atual baseada em `serviceGroups` / `serviceGroup`.
- `.serviceGroups` passa para uma única coluna no breakpoint mobile.
- As regras obsoletas de `.servicesGrid` / `.serviceCard`, pertencentes à estrutura antiga e sem uso nos componentes atuais, foram removidas de `app/page.module.css`.
- A seção Serviços permaneceu correta após a consolidação do CSS.
- Foi removido de `app/page.tsx` o texto pendente:
  `Valores e horários são apresentados no momento do agendamento.`
- Foi identificado overflow no Hero mobile causado pela escala tipográfica do título `SUA IDENTIDADE.`.
- A regra mobile do título foi ajustada de:
  `font-size: clamp(50px, 18vw, 75px);`
  para:
  `font-size: clamp(46px, 15vw, 64px);`
- Após esse ajuste, o Hero ficou corretamente contido na viewport.
- O problema visual observado anteriormente nas fotos também desapareceu após a correção do overflow do Hero.
- As três imagens da galeria foram testadas no mobile.
- O lightbox mobile foi validado nas três imagens, sem estouro lateral e com botão de fechar acessível.
- Avaliações e Como chegar já haviam apresentado bom comportamento mobile e continuam pendentes apenas da validação final geral da Home antes do commit.
- As categorias regulares da Home continuam APROVADAS.
- ASSINATURA continua fora da navegação por categoria.
- CONHECER PLANOS ainda não possui destino definitivo.

## IMPORTANTE — HOME AINDA SEM COMMIT

Não fazer commit da Home neste momento.

Antes do commit final da Home ainda permanecem as validações finais previstas no histórico do projeto, incluindo desktop, mobile geral, CTAs/links, WhatsApp, Instagram, build e git status.

`CODIGO-COMPLETO.txt` deve permanecer untracked e nunca deve ser versionado.

## PRÓXIMA FRENTE FUNCIONAL — ÁREA DO ASSINANTE / ASSINATURAS

A intenção de produto registrada para a próxima frente é transformar Assinaturas em uma funcionalidade real do cliente.

Direção inicial solicitada:

- começar exibindo o(s) plano(s) de assinatura existente(s) e seus valores;
- aparentemente existe apenas um plano no estado atual, mas isso deve ser confirmado no código/dados existentes antes de implementar;
- permitir futuramente contratação e pagamento da assinatura pelo próprio site;
- após confirmação válida do pagamento, permitir ativação/liberação da assinatura pelo sistema;
- cada plano/estrutura deverá considerar uma quantidade máxima `X` de assinantes, a ser definida;
- no momento da contratação, o cliente deverá poder escolher a qual barbeiro deseja vincular sua assinatura;
- cada barbeiro deverá possuir sua própria base/quantidade de assinantes vinculados;
- barbeiros contratados deverão receber comissão relacionada às respectivas assinaturas, conforme regra ainda a ser definida.

## REGRAS PARA INICIAR ASSINATURAS

Antes de qualquer implementação:

- inspecionar o que já existe no projeto para assinatura, planos, preços, usuários/clientes, barbeiros e pagamentos;
- não assumir estrutura de banco nem criar migration antes dessa inspeção;
- não alterar banco sem etapa específica e autorização;
- definir claramente o modelo de capacidade/limite de assinantes;
- definir regra de vínculo cliente ↔ assinatura ↔ barbeiro;
- definir regra de comissão;
- escolher posteriormente o provedor de pagamento e o fluxo de confirmação/webhook;
- não liberar assinatura apenas com retorno do navegador; a confirmação de pagamento deverá ser validada no servidor quando essa integração for implementada;
- manter a lógica atual de agendamento intacta até que seja explicitamente planejada alguma integração com benefícios da assinatura.

## ALTERAÇÃO EXPERIMENTAL AINDA PENDENTE

`app/layout.tsx` possui alteração experimental documentada anteriormente, incluindo viewport explícita e mudanças de metadata/lang.

A viewport explícita não foi responsável pela correção do problema mobile observado.

Essa alteração ainda precisa ser revisada conscientemente e não deve ser automaticamente incluída em commit futuro.


---

# CHECKPOINT INTERMEDIÁRIO — ASSINATURAS / REGRAS DE PRODUTO E ARQUITETURA — 2026-09-09

## DIRETRIZ DE EXECUÇÃO

A partir deste ponto, evitar microperguntas e etapas de diagnóstico sem necessidade concreta.

Avançar com defaults técnicos seguros e reversíveis sempre que possível.

Agrupar dúvidas de produto quando forem realmente necessárias.

Interromper para autorização antes de:
- alteração de banco/schema;
- migration;
- escolha/instalação de gateway ou dependência relevante;
- operação destrutiva;
- decisão financeira relevante ainda não definida;
- commit/push.

Continuam obrigatórias:
- uma etapa por vez;
- um único comando completo por etapa;
- usar npm.cmd nesta máquina;
- preferir Set-Content para código;
- não reconstruir /agendar;
- não alterar a lógica atual de benefício/agendamento;
- não fazer commit enquanto houver trabalho em andamento;
- CODIGO-COMPLETO.txt permanece untracked e nunca deve ser versionado.

## ESTADO PÚBLICO IMPLEMENTADO LOCALMENTE

Foi criada, ainda sem commit:

- /assinaturas

A página foi validada visualmente em desktop e mobile.

Exibe provisoriamente no código:

- Plano Mensal;
- R$ 150,00 por mês.

Os serviços incluídos são carregados dos serviços reais com:

subscriber_service = true
active = true

Foram encontrados quatro serviços ativos de assinatura, todos corretamente com price = 0:

- Barba Assinante Mensal;
- Cabelo + Barba Assinante Mensal;
- Cabelo Assinante Mensal;
- Raspado + Barba Assinante Mensal.

Esses R$ 0,00 NÃO representam o preço comercial da assinatura. Representam benefícios incluídos na mensalidade.

O botão CONHECER PLANOS da Home foi ligado a:

/assinaturas

e o fluxo foi validado.

A Home continua sem commit.

## ARQUITETURA EXISTENTE CONFIRMADA

subscriptions representa a assinatura concreta de um cliente e possui:

- id uuid;
- customer_id uuid;
- name text;
- status text;
- starts_at date;
- expires_at date;
- notes text;
- created_at timestamptz;
- updated_at timestamptz;
- weekly_limit integer;
- monthly_limit integer;
- allowed_weekdays integer[].

Status permitidos atualmente:

- active;
- paused;
- cancelled;
- expired.

Não adicionar estados financeiros diretamente nesse status sem necessidade.

subscription_services possui chave composta:

- subscription_id;
- service_id.

subscriptions.customer_id referencia customers.id.

Não existe atualmente, no schema inspecionado:
- catálogo comercial de planos;
- preço/mensalidade em subscriptions;
- vínculo subscription -> barber;
- capacidade de assinantes por barbeiro;
- estrutura de pagamentos;
- estrutura de comissão.

A arquitetura já existente de benefícios no agendamento deve ser preservada.

## MODELO COMERCIAL DEFINIDO

Plano inicial:

Plano Mensal

Mensalidade:

R$ 150,00

Não assumir para sempre que haverá apenas um plano. A evolução deve permitir catálogo de planos.

Direção de modelagem futura:

- subscription_plans para catálogo comercial;
- subscriptions continua representando a assinatura concreta;
- assinatura futura vinculada a plan_id;
- assinatura futura vinculada a barber_id;
- pagamentos em estrutura financeira separada;
- comissão separada e auditável.

Nenhuma migration foi criada ainda.

## CAPACIDADE POR BARBEIRO

Capacidade inicial:

30 assinantes por barbeiro.

A capacidade pertence ao barbeiro.

Somente assinatura financeiramente em dia ocupa vaga normal.

Após o encerramento de um ciclo mensal já validado/pago, o assinante mantém sua vaga reservada por:

2 dias.

Durante essa carência a vaga continua pertencendo ao assinante.

Se não houver confirmação do pagamento de renovação dentro da carência, a vaga é liberada.

Depois de liberada, o antigo assinante só consegue reativar/contratar se houver capacidade disponível.

A implementação futura da capacidade deverá ser segura contra concorrência. Não permitir que checkouts simultâneos gerem mais de 30 assinantes válidos para o mesmo barbeiro.

## VÍNCULO COM BARBEIRO

Na contratação, o cliente escolhe o barbeiro.

O barbeiro fica travado durante o ciclo mensal vigente.

O cliente não troca de barbeiro no meio do ciclo.

Na renovação ele pode:

- permanecer com o barbeiro atual;
- escolher outro barbeiro.

Troca depende de capacidade disponível no novo barbeiro.

Durante os 2 dias de carência, a vaga do barbeiro antigo permanece reservada.

Se o cliente solicitar renovação com outro barbeiro, a vaga antiga só é liberada quando o pagamento da renovação vinculada ao novo barbeiro estiver efetivamente confirmado.

Pagamento pendente ou falhado não libera antecipadamente a vaga antiga.

## PAGAMENTOS

Gateway ainda NÃO escolhido.

Não instalar SDK/biblioteca até decisão específica.

Fluxo obrigatório futuro:

cliente -> plano -> barbeiro -> capacidade -> criação segura da cobrança -> gateway -> webhook/validação no servidor -> pagamento confirmado -> ativação/renovação.

Nunca ativar assinatura apenas por retorno/redirecionamento do navegador.

O sistema deverá manter registros financeiros próprios para auditoria e conciliação.

Estados financeiros não devem depender somente de subscriptions.status.

Webhooks deverão ser autenticados e idempotentes.

Eventos repetidos do gateway não podem:
- ativar duas vezes;
- renovar duas vezes;
- duplicar receita;
- duplicar comissão.

## COMISSÃO

Percentual/regra numérica ainda NÃO definidos.

A comissão nasce somente após confirmação válida do pagamento da mensalidade.

Cada renovação paga pode gerar nova comissão para o barbeiro vinculado àquele ciclo.

Não geram comissão:
- pagamento pendente;
- pagamento falhado;
- pagamento cancelado;
- cobrança expirada/não paga.

Em caso de estorno posterior, preservar histórico e registrar reversão da comissão correspondente, em vez de apagar registros financeiros.

## PRÓXIMA DIREÇÃO

Avançar com rapidez, evitando novas microperguntas.

Próxima fase técnica:

desenhar a menor evolução de schema necessária para:
- catálogo do plano;
- vínculo assinatura/plano;
- vínculo assinatura/barbeiro;
- capacidade;
- ciclos financeiros/pagamentos;
- comissão auditável.

Antes de aplicar qualquer SQL:
- apresentar a modelagem;
- analisar compatibilidade com subscriptions existente;
- obter autorização explícita para alteração do banco.

Não implementar gateway ainda.
Não alterar /agendar.
Não fazer commit.

---

# CHECKPOINT DE RECUPERAÇÃO — ASSINATURAS / PRÉ-CHECKOUT / CREDENCIAL SERVER-SIDE — 2026-09-10

## PRIORIDADE

Este é o checkpoint mais recente e deve ter prioridade absoluta no próximo chat.

NÃO reiniciar análise do projeto.

Trabalhar em BLOCOS/LOTES MAIORES.

Evitar microetapas e diagnósticos repetitivos.

Quando o responsável precisar executar algo, fornecer preferencialmente UM comando PowerShell completo, pronto para copiar e colar.

Usar npm.cmd.

Preferir Set-Content para código.

NÃO fazer commit/push sem autorização.

## OBJETIVO ATUAL

Continuar diretamente a implementação do fluxo público de contratação em:

/assinaturas

Fluxo pretendido:

plano real do banco
→ dados do cliente
→ escolha do barbeiro
→ disponibilidade
→ criação server-side do pré-checkout
→ create_subscription_checkout
→ hold transacional de 15 minutos
→ subscription_charge pending
→ PARAR antes do gateway.

Gateway ainda NÃO foi escolhido.

NÃO instalar gateway.

NÃO realizar cobrança real.

NÃO ativar assinatura pelo browser.

NÃO criar ciclo paid antes de pagamento confirmado.

NÃO gerar comissão antes de pagamento confirmado.

## BANCO — ESTADO CONFIRMADO

Já foram criados e APLICADOS com sucesso no Supabase:

supabase/sql/007-subscriptions-commerce.sql
supabase/sql/008-subscription-checkout-capacity.sql
supabase/sql/009-subscription-checkout.sql

Todos retornaram:

Success. No rows returned

NÃO reaplicar sem necessidade concreta.

### Plano

Existe:

subscription_plans

Plano real:

Plano Mensal
R$ 150,00
billing_interval_months = 1
grace_days = 2
active = true

O banco é autoridade sobre preço comercial.

services.price = 0 para subscriber_service continua significando benefício coberto pela mensalidade.

### Assinatura legada

subscriptions possui plan_id nullable.

Existe uma assinatura legada com plan_id NULL.

Preservar.

Não fabricar histórico financeiro.

### Capacidade

barbers possui subscriber_capacity.

Capacidade inicial:

30 por barbeiro.

Barbeiro validado:

Rodrigo Alves Correa

Proteção concorrente utiliza PostgreSQL:

SELECT ... FOR UPDATE

Preservar obrigatoriamente.

### Ciclos

Existe:

subscription_cycles

Barbeiro é historicamente vinculado ao ciclo.

Carência após ciclo pago:

2 dias.

Não confundir com hold de checkout.

### Hold

Existe:

subscription_capacity_reservations

Hold de pré-checkout:

15 minutos.

008 permitiu pré-checkout sem subscription_id.

Existe checkout_token.

Existe RPC:

reserve_subscription_checkout_capacity(...)

Ela protege capacidade de forma concorrente/transacional.

### Checkout

009 preparou:

subscription_charges.customer_name
subscription_charges.customer_phone
subscription_charges.customer_email
subscription_charges.checkout_token

subscription_charges.subscription_id aceita NULL durante pré-checkout.

Existe RPC pública mínima:

get_public_subscription_barbers()

Ela foi testada com publishable/anon e funcionou.

Resultado confirmado:

1 barbeiro retornado.

Existe RPC privilegiada:

create_subscription_checkout(...)

Ela:

- valida plano;
- valida comprador;
- valida barbeiro;
- valida capacidade;
- cria hold transacional;
- cria subscription_charge pending;
- utiliza preço real de subscription_plans;
- é idempotente via checkout_token.

Ela NÃO:

- ativa assinatura;
- confirma pagamento;
- cria comissão.

## PERMISSÃO PÚBLICA DO PLANO

Foi confirmado por teste direto:

subscription_plans via publishable/anon retorna:

code 42501
permission denied for table subscription_plans

O hint do Supabase sugeriu GRANT SELECT para anon.

NÃO foi aplicado novo GRANT/migration.

services via publishable funciona.

get_public_subscription_barbers() via publishable funciona.

Para evitar alteração de banco apenas para renderização, a direção atual foi carregar subscription_plans server-side utilizando lib/supabase/admin.ts.

## SEGURANÇA SERVER-SIDE

Existe:

lib/supabase/admin.ts

Ele utiliza:

import "server-only"

e lê:

SUPABASE_SERVICE_ROLE_KEY

A chave nunca deve:

- ser impressa;
- ir para browser;
- receber NEXT_PUBLIC_;
- ser versionada;
- ser colada no chat.

.env.local permanece fora do Git.

## BLOQUEIO ATUAL

A credencial configurada em:

SUPABASE_SERVICE_ROLE_KEY

não está funcionando contra a API do projeto.

Teste direto retornou:

Invalid API key

O Project URL local possui formato válido.

Project ref identificado:

elpvjgxixzktgwxdfckb

O bloqueio atual é:

OBTER/CONFIGURAR UMA CREDENCIAL SERVER-SIDE VÁLIDA DO MESMO PROJETO SUPABASE.

Pode ser, conforme disponibilidade no painel:

- Secret key server-side;
- ou service_role legada.

Não registrar nem expor o valor da chave.

Não continuar tentando contornar isso com credencial pública.

Quando a credencial server-side válida estiver configurada, validar acesso server-side a subscription_plans e seguir imediatamente com o pré-checkout.

## CÓDIGO IMPLEMENTADO LOCALMENTE

Existe:

app/assinaturas/subscription-checkout-form.tsx

O formulário já possui:

- nome;
- WhatsApp;
- e-mail opcional;
- escolha de barbeiro;
- exibição de vagas;
- estados de loading/erro;
- resultado de hold preparado;
- mensagem explícita de que não houve pagamento;
- mensagem explícita de que assinatura não foi ativada.

Foi alterado para gerar checkout_token no browser uma vez por tentativa usando:

crypto.randomUUID()

O mesmo token é enviado ao backend para permitir idempotência da tentativa.

Botão atual:

PREPARAR CONTRATAÇÃO

Não promete pagamento real.

Existe:

app/api/assinaturas/checkout/route.ts

A rota:

- é server-side;
- usa createAdminClient();
- valida entrada;
- recebe checkoutToken;
- chama create_subscription_checkout;
- não marca pagamento como paid;
- não ativa assinatura;
- não cria comissão.

Existe:

app/assinaturas/page.tsx

Direção implementada:

- services pelo client existente;
- disponibilidade via get_public_subscription_barbers();
- subscription_plans via createAdminClient();
- SubscriptionCheckoutForm conectado à página.

O erro visual atual:

"Não foi possível carregar os planos disponíveis no momento."

ocorre porque a credencial server-side configurada está inválida.

## BUILD

Após as alterações de pré-checkout:

npm.cmd run build

PASSOU.

Resultado:

Compiled successfully
Finished TypeScript
rotas geradas normalmente.

Existe rota:

/api/assinaturas/checkout

Existe rota:

/assinaturas

Não é necessário repetir build antes de resolver a credencial, salvo alteração de código.

Antes de commit final, build continua obrigatório.

## TESTE FUNCIONAL AINDA PENDENTE

Ainda NÃO foi executado com sucesso o POST real de create_subscription_checkout porque o plano não consegue ser carregado via admin enquanto a credencial server-side estiver inválida.

Depois de corrigir a credencial:

1. validar /assinaturas;
2. confirmar Plano Mensal R$ 150;
3. confirmar quatro serviços incluídos;
4. confirmar Rodrigo Alves Correa e disponibilidade;
5. testar desktop;
6. testar mobile;
7. executar UMA tentativa real de PREPARAR CONTRATAÇÃO;
8. confirmar hold de 15 minutos;
9. confirmar subscription_charge pending;
10. confirmar que nenhuma assinatura ficou active;
11. confirmar que nenhum ciclo ficou paid;
12. confirmar que nenhuma comissão foi criada.

Depois disso PARAR antes de gateway.

## FINANCEIRO

Estados previstos:

pending
paid
failed
cancelled
expired
refunded
partially_refunded

Existe payment_events para idempotência futura.

Existe subscription_commission_entries.

Percentual de comissão ainda NÃO definido.

NÃO inventar percentual.

Gateway ainda NÃO escolhido.

NÃO instalar SDK.

Fluxo futuro:

cliente
→ plano
→ barbeiro
→ capacidade
→ hold
→ cobrança interna pending
→ gateway
→ webhook/validação segura
→ pagamento confirmado
→ ativação/renovação
→ comissão.

## NÃO ALTERAR

Não alterar:

/agendar

Não alterar:

create_public_multi_appointment

Não reconstruir integração de benefícios da assinatura.

Não reaplicar 007/008/009.

Não fabricar histórico da assinatura legada.

Não alterar comissão sem decisão financeira.

Não escolher gateway sem autorização.

## GIT / ARQUIVOS LOCAIS

Estado conhecido:

M app/assinaturas/page.module.css
M app/assinaturas/page.tsx
?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt
?? app/api/
?? app/assinaturas/subscription-checkout-form.tsx
?? lib/supabase/admin.ts
?? supabase/sql/007-subscriptions-commerce.sql
?? supabase/sql/008-subscription-checkout-capacity.sql
?? supabase/sql/009-subscription-checkout.sql

CODIGO-COMPLETO.txt deve continuar untracked e NUNCA ser versionado.

ASSINATURAS-LOTE.txt é arquivo auxiliar e NÃO deve entrar em staging.

Nunca usar:

git add .

Staging somente com caminhos explícitos.

Commit/push somente após autorização consciente.

## PRÓXIMO PASSO EXATO

NÃO diagnosticar novamente arquitetura, banco, migrations, /agendar ou formulário.

Resolver primeiro o bloqueio:

CONFIGURAR UMA CREDENCIAL SERVER-SIDE VÁLIDA DO PROJETO SUPABASE elpvjgxixzktgwxdfckb.

Depois:

validar subscription_plans server-side
→ abrir /assinaturas
→ validar plano/barbeiro/disponibilidade
→ executar uma tentativa de pré-checkout
→ confirmar hold + charge pending
→ parar antes de gateway.

Priorizar velocidade e comandos completos prontos para copiar/colar.

---

---

# CHECKPOINT FINAL DA SESSÃO — ASSINATURAS / PRÉ-CHECKOUT FUNCIONAL — 2026-09-10

## PRIORIDADE

Este é o checkpoint mais recente e deve ter PRIORIDADE ABSOLUTA no próximo chat.

NÃO reiniciar análise.

NÃO reaplicar migrations 007/008/009/010/011.

NÃO reconstruir /agendar nem create_public_multi_appointment.

## ESTADO ATUAL

O fluxo público de Assinaturas avançou até o pré-checkout real.

Rota:

/assinaturas

Plano real carregado server-side:

Plano Mensal
R$ 150,00
billing_interval_months = 1
grace_days = 2
active = true

Serviços incluídos confirmados:

- Barba Assinante Mensal
- Cabelo + Barba Assinante Mensal
- Cabelo Assinante Mensal
- Raspado + Barba Assinante Mensal

Barbeiro:

Rodrigo Alves Correa

Capacidade real no banco:

30 assinantes.

A proteção concorrente PostgreSQL com SELECT ... FOR UPDATE deve ser preservada.

## CREDENCIAL SERVER-SIDE

Foi configurada localmente uma service_role LEGADA válida do projeto:

elpvjgxixzktgwxdfckb

Ela está em:

.env.local

variável:

SUPABASE_SERVICE_ROLE_KEY

NUNCA imprimir, expor, enviar ao browser ou versionar essa chave.

Uma Secret API key moderna também foi criada no painel durante os testes, mas a arquitetura local utiliza atualmente a service_role legada em SUPABASE_SERVICE_ROLE_KEY.

Uma chave Secret criada anteriormente foi exposta acidentalmente no chat e foi REVOGADA/EXCLUÍDA imediatamente.

Não reutilizar aquela chave.

## MIGRATION 010

Criada e aplicada com sucesso:

supabase/sql/010-service-role-subscription-plans-read.sql

Objetivo:

GRANT SELECT em public.subscription_plans somente para service_role.

Resultado no Supabase:

Success. No rows returned

Após 010, leitura server-side foi validada:

PLANOS SERVER-SIDE: OK

Plano retornado:

Plano Mensal
R$ 150
intervalo 1 mês
carência 2 dias
active true

Não abriu subscription_plans para anon.

## MIGRATION 011

Criada e aplicada com sucesso:

supabase/sql/011-service-role-subscription-checkout.sql

Objetivo:

- EXECUTE de create_subscription_checkout para service_role;
- SELECT server-side para estruturas necessárias de auditoria do pré-checkout;
- sem novos privilégios para anon/authenticated.

Resultado no Supabase:

Success. No rows returned

NÃO reaplicar.

## PRÉ-CHECKOUT DIRETO VALIDADO

Foi executada uma tentativa real de create_subscription_checkout.

Resultado confirmado:

- amount = 150;
- currency = BRL;
- subscription_charge = pending;
- subscription_id = null;
- hold = held;
- cycle_id = null;
- hold exatamente 15 minutos;
- paid cycles total = 0;
- commissions = [].

Exemplo validado:

charge_id:
49eb2e92-dae5-4c2c-89d9-8c04421084f9

checkout_token:
0e737b16-f992-45e4-a359-a18d68bb0245

created_at:
2026-09-10T04:36:04.076513+00:00

reservation_expires_at:
2026-09-10T04:51:04.076513+00:00

O hold expirou normalmente e a disponibilidade retornou de 29 para 30.

Isso confirmou operacionalmente a reserva temporária de capacidade.

## PRÉ-CHECKOUT PELA INTERFACE

Depois da aplicação da 011, o fluxo real pela interface também FUNCIONOU.

Foi preenchido:

- nome;
- WhatsApp;
- e-mail;
- Rodrigo Alves Correa.

Foi clicado uma única vez:

PREPARAR CONTRATAÇÃO

Resultado visual:

Vaga reservada temporariamente.

A interface informou:

- checkout de R$ 150,00 preparado;
- vaga reservada até o horário de expiração;
- cobrança real ainda não disponível;
- nenhum pagamento realizado;
- assinatura ainda não ativada.

Portanto:

browser
→ /api/assinaturas/checkout
→ create_subscription_checkout
→ hold
→ charge pending

está funcional.

## AUDITORIA FINAL DA ÚLTIMA TENTATIVA

Ainda está PENDENTE executar a auditoria somente-leitura da ÚLTIMA tentativa feita pela interface.

No próximo chat, antes de avançar para gateway, confirmar explicitamente:

- charge = pending;
- subscription_id = null;
- hold correspondente;
- nenhum ciclo paid criado pela tentativa;
- nenhuma comissão criada;
- nenhuma assinatura ativada pela tentativa.

Não criar outro checkout antes dessa verificação sem necessidade.

## DECISÕES DE UI PARA O PRÓXIMO CHAT

### Contagem regressiva

Quando a área de pagamento for implementada, substituir a apresentação textual simples da reserva por cronômetro regressivo real:

15:00
→
00:00

A contagem deve ser baseada em:

reservation_expires_at

retornado pelo servidor.

Não criar um timer independente que possa divergir do hold real do banco.

### Disponibilidade do barbeiro

Não mostrar ao cliente a quantidade exata de vagas.

Em vez de:

30 vagas disponíveis
29 vagas disponíveis

mostrar somente:

Vagas disponíveis

ou:

Indisponível

A capacidade numérica real continua sendo controlada no backend/banco.

## GATEWAY / FINANCEIRO

Gateway ainda NÃO escolhido.

NÃO instalar gateway no próximo chat sem decisão/autorização específica.

NÃO realizar pagamento real antes dessa escolha.

NÃO ativar assinatura por retorno do navegador.

NÃO criar ciclo paid antes de confirmação segura do pagamento.

Percentual de comissão ainda NÃO definido.

NÃO inventar percentual.

Comissão somente após pagamento confirmado futuramente.

## REGRAS DE NEGÓCIO PRESERVADAS

Hold do checkout:

15 minutos.

Carência após ciclo pago:

2 dias.

NÃO confundir essas regras.

Capacidade:

30 assinantes por barbeiro.

Barbeiro escolhido fica vinculado conforme regras já definidas anteriormente.

Proteção concorrente via PostgreSQL SELECT ... FOR UPDATE deve permanecer.

## ARQUIVOS IMPORTANTES

Implementação de Assinaturas:

- lib/supabase/admin.ts
- app/assinaturas/page.tsx
- app/assinaturas/page.module.css
- app/assinaturas/subscription-checkout-form.tsx
- app/api/assinaturas/checkout/route.ts

SQL:

- supabase/sql/007-subscriptions-commerce.sql
- supabase/sql/008-subscription-checkout-capacity.sql
- supabase/sql/009-subscription-checkout.sql
- supabase/sql/010-service-role-subscription-plans-read.sql
- supabase/sql/011-service-role-subscription-checkout.sql

007/008/009/010/011 já foram aplicadas.

NÃO reaplicar.

## GIT / SEGURANÇA

Nunca versionar:

CODIGO-COMPLETO.txt
ASSINATURAS-LOTE.txt
.env.local

Nunca usar:

git add .

Staging somente com caminhos explícitos.

## PRÓXIMO PASSO EXATO

No próximo chat:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint;
3. executar a auditoria somente-leitura da última tentativa de pré-checkout feita pela interface;
4. confirmar ausência de active/paid/comissão;
5. ajustar a UI do barbeiro para mostrar somente Vagas disponíveis / Indisponível;
6. preservar o requisito futuro do cronômetro 15:00 → 00:00 baseado em reservation_expires_at;
7. PARAR antes de gateway até escolha/autorização específica.

Gateway ainda não escolhido.


---

# CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / INÍCIO DA INTEGRAÇÃO — 2026-09-11

## PRIORIDADE

Este é o checkpoint mais recente e deve ter PRIORIDADE ABSOLUTA no próximo chat.

NÃO reiniciar a análise.

Ler os checkpoints anteriores de Assinaturas, especialmente:

- CHECKPOINT FINAL DA SESSÃO — ASSINATURAS / PRÉ-CHECKOUT FUNCIONAL — 2026-09-10.

## ASSINATURAS / PRÉ-CHECKOUT

O pré-checkout permanece funcional e foi auditado novamente nesta sessão.

Auditoria somente-leitura da última tentativa realizada pela interface confirmou:

- amount = 150;
- currency = BRL;
- charge = pending;
- subscription_id = null;
- cycle_id = null;
- hold correspondente = held;
- hold exatamente 15 minutos;
- nenhum ciclo paid criado;
- nenhuma comissão criada;
- nenhuma assinatura ativada.

Tentativa auditada:

charge_id:
81a7824b-dcb7-41c6-9cf4-0678da0fbdfa

hold_id:
55195e5b-40a7-48e1-afe7-f312eea1ce05

created_at:
2026-09-10T17:26:46.493532+00:00

expires_at:
2026-09-10T17:41:46.493532+00:00

Nenhum novo checkout foi criado durante a auditoria.

## DISPONIBILIDADE DO BARBEIRO

A UI foi alterada conforme decisão já tomada.

Antes:

30 vagas disponíveis
29 vagas disponíveis
etc.

Agora:

Vagas disponíveis

ou:

Indisponível

A quantidade numérica NÃO é exibida ao cliente.

A lógica interna continua utilizando:

barber.available_slots > 0

A capacidade real continua sendo 30 assinantes por barbeiro e permanece controlada pelo backend/banco.

Nenhuma regra de capacidade foi alterada.

A proteção PostgreSQL com:

SELECT ... FOR UPDATE

deve continuar obrigatoriamente preservada.

Build após o ajuste:

APROVADO.

Teste visual em /assinaturas:

APROVADO.

Rodrigo Alves Correa apareceu como:

Vagas disponíveis

sem quantidade numérica.

## GIT — CHECKPOINT DA DISPONIBILIDADE

Commit:

a50240f Oculta quantidade de vagas nas assinaturas

Push realizado com sucesso para origin/main.

ASSINATURAS-LOTE.txt e CODIGO-COMPLETO.txt permaneceram fora.

## HOME — FECHAMENTO

A Home foi validada novamente nesta sessão.

Validação final informada como aprovada:

- desktop;
- mobile;
- Hero;
- Trabalhos;
- Serviços;
- Como chegar;
- Avaliações;
- CTA final;
- rodapé;
- lightbox;
- navegação por âncoras;
- /agendar;
- navegação das categorias regulares;
- /assinaturas;
- WhatsApp;
- Instagram;
- Como chegar;
- avaliações no Google.

Build final:

npm.cmd run build

APROVADO.

Foi corrigido app/layout.tsx para remover metadata padrão do Create Next App.

Estado atual:

title:
Black Navalha

description:
Black Navalha — barbearia, estilo e cuidado em cada detalhe.

html lang:
pt-BR

A viewport experimental documentada anteriormente NÃO permaneceu.

Commit:

e34a702 Atualiza metadados da Black Navalha

HEAD/origin foram confirmados sincronizados nesse commit após o push.

## GIT — ESTADO APÓS CHECKPOINTS

Após os checkpoints funcionais, o estado confirmado era somente:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Esses dois arquivos NÃO devem ser versionados.

.env.local NÃO deve ser exibido nem versionado.

Nunca usar:

git add .

Commit/push somente com autorização.

## GATEWAY ESCOLHIDO

Foi decidido utilizar:

MERCADO PAGO

para desenvolvimento e testes da integração.

A decisão de gateway está autorizada para a fase de testes.

Não realizar cobrança real nesta fase.

Não utilizar a futura conta financeira da Black Navalha sem aprovação/autorização do estabelecimento.

A estratégia definida é:

- conta atual do responsável pelo desenvolvimento para ambiente de desenvolvimento/testes;
- apresentar o projeto funcional à Black Navalha;
- se aprovado, configurar produção posteriormente usando a conta/credenciais pertencentes ao estabelecimento.

Credenciais de desenvolvimento e produção NÃO devem ser misturadas.

## CONTA MERCADO PAGO

Foi criada uma conta Mercado Pago do responsável pelo desenvolvimento.

Não registrar neste contexto:

- CPF;
- senha;
- códigos SMS;
- tokens;
- Client Secret;
- Access Token;
- outras credenciais.

Não pedir que credenciais secretas sejam coladas no chat.

## PORTAL DE DESENVOLVEDORES

Foi acessado com sucesso:

https://www.mercadopago.com.br/developers/panel/app

A tela:

Integrações
→ Suas aplicações

foi aberta corretamente.

Inicialmente não existiam aplicações.

Foi clicado:

Criar aplicação

A sessão terminou na etapa:

Crie uma aplicação
1 de 4

Campo atual:

Nome da aplicação

Nome decidido para desenvolvimento:

Black Navalha - Desenvolvimento

Ainda NÃO avançamos pelas etapas seguintes.

## PRÓXIMO PASSO EXATO — MERCADO PAGO

No próximo chat:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint;
3. continuar na criação da aplicação Mercado Pago;
4. preencher o nome:
   Black Navalha - Desenvolvimento
5. clicar Continuar;
6. analisar a etapa 2 de 4 antes de selecionar produto/opção;
7. orientar a escolha adequada ao fluxo existente de pré-checkout + pagamento online + webhook;
8. não instalar SDK antes de saber exatamente qual integração será utilizada;
9. não realizar cobrança real;
10. não ativar assinatura pelo retorno do navegador.

## ARQUITETURA FINANCEIRA QUE DEVE SER PRESERVADA

Fluxo pretendido:

cliente
→ plano
→ barbeiro
→ capacidade
→ hold de 15 minutos
→ subscription_charge pending
→ Mercado Pago em ambiente de teste
→ webhook/validação server-side
→ pagamento confirmado
→ ativação/renovação
→ ciclo financeiro
→ comissão futuramente.

O navegador NÃO é autoridade para confirmar pagamento.

Webhooks futuros deverão ser:

- autenticados;
- idempotentes.

Eventos repetidos não podem:

- ativar duas vezes;
- renovar duas vezes;
- duplicar receita;
- duplicar comissão.

## CRONÔMETRO

Quando a área de pagamento for implementada, apresentar:

15:00
→
00:00

usando obrigatoriamente:

reservation_expires_at

retornado pelo servidor.

Não criar timer independente do hold real.

## COMISSÃO

Percentual ainda NÃO definido.

NÃO inventar percentual.

Nenhuma comissão antes de pagamento confirmado.

A definição financeira de comissão permanece pendente.

## BANCO

Migrations já aplicadas e que NÃO devem ser reaplicadas:

supabase/sql/007-subscriptions-commerce.sql
supabase/sql/008-subscription-checkout-capacity.sql
supabase/sql/009-subscription-checkout.sql
supabase/sql/010-service-role-subscription-plans-read.sql
supabase/sql/011-service-role-subscription-checkout.sql

Plano real:

Plano Mensal
R$ 150,00
billing_interval_months = 1
grace_days = 2
active = true

Capacidade:

30 por barbeiro.

Hold:

15 minutos.

Carência após ciclo pago:

2 dias.

NÃO confundir hold com carência.

## CREDENCIAL SUPABASE

SUPABASE_SERVICE_ROLE_KEY continua configurada localmente em .env.local com credencial válida.

NUNCA:

- imprimir;
- enviar ao browser;
- usar NEXT_PUBLIC_;
- pedir para colar no chat;
- versionar .env.local.

## NÃO ALTERAR

Não reconstruir:

/agendar

Não alterar:

create_public_multi_appointment

Não reconstruir integração existente dos benefícios de assinatura com agendamento.

Não fabricar histórico financeiro da assinatura legada.

Não reaplicar migrations já aplicadas.

## FORMA DE TRABALHO

Priorizar velocidade.

Trabalhar em BLOCOS/LOTES MAIORES quando seguro.

Quando o responsável precisar executar algo, fornecer UM comando PowerShell COMPLETO pronto para copiar e colar.

Usar npm.cmd.

Preferir Set-Content para código.

Interromper para:

- operação destrutiva;
- decisão financeira não definida;
- novas credenciais;
- alteração relevante de banco não autorizada;
- commit/push.


# CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / APLICAÇÃO E AMBIENTE DE TESTE — 2026-09-11

## REGRA OBRIGATÓRIA PARA A PRÓXIMA SESSÃO

ANTES DE QUALQUER AÇÃO:

- Ler INTEGRALMENTE o arquivo `CONTEXTO-PROJETO.md`.
- Dar PRIORIDADE ABSOLUTA a este checkpoint mais recente.
- NÃO reiniciar análises já concluídas.
- NÃO repetir diagnósticos já encerrados.
- Trabalhar em blocos/lotes maiores quando seguro.
- Quando o usuário precisar executar algo, fornecer UM comando PowerShell COMPLETO pronto para copiar e colar.
- Usar `npm.cmd`.
- Preferir `Set-Content` para código.
- Nunca usar `git add .`.
- Commit/push somente com autorização explícita.
- Interromper obrigatoriamente para operação destrutiva, decisão financeira não definida, novas credenciais, alteração relevante de banco não autorizada ou commit/push.

## GIT / ARQUIVOS

Branch esperada:

`main`

HEAD/origin informado no início desta sessão:

`aca3941 Registra inicio da integracao Mercado Pago`

Arquivos não rastreados esperados:

`?? ASSINATURAS-LOTE.txt`
`?? CODIGO-COMPLETO.txt`

Esses dois arquivos NÃO devem ser versionados.

`.env.local` NÃO deve ser exibido nem versionado.

## ESTADO ANTERIOR PRESERVADO

O pré-checkout de assinaturas permanece funcional e auditado:

browser
→ `/api/assinaturas/checkout`
→ `create_subscription_checkout`
→ hold de 15 minutos
→ `subscription_charge pending`

Confirmado anteriormente:

- amount = 150;
- currency = BRL;
- charge = pending;
- subscription_id = null;
- cycle_id = null;
- hold correspondente;
- hold exatamente 15 minutos;
- nenhum ciclo paid;
- nenhuma comissão;
- nenhuma assinatura ativada.

Plano real:

- Plano Mensal
- R$ 150,00
- `billing_interval_months = 1`
- `grace_days = 2`
- `active = true`

Barbeiro:

`Rodrigo Alves Correa`

Capacidade:

30 assinantes por barbeiro.

A UI deve continuar mostrando apenas:

- `Vagas disponíveis`
ou
- `Indisponível`

O backend continua usando a capacidade numérica real.

Preservar obrigatoriamente `SELECT ... FOR UPDATE`.

Não confundir:

- hold do checkout = 15 minutos;
- carência após ciclo pago = 2 dias.

Migrations 007/008/009/010/011 já aplicadas. NÃO reaplicar.

Não alterar:

- `/agendar`;
- `create_public_multi_appointment`;
- integração existente dos benefícios da assinatura com agendamento.

Não fabricar histórico financeiro da assinatura legada.

## MERCADO PAGO — APLICAÇÃO CRIADA

Gateway de desenvolvimento/teste:

Mercado Pago.

Aplicação criada com sucesso:

`Black Navalha - Desenvolvimento`

Configuração escolhida nas telas reais do Mercado Pago:

- Tipo de pagamento: `Pagamentos online`
- Loja: `Com um desenvolvimento próprio`
- URL da loja: deixada em branco
- Solução de pagamento: `Assinaturas`
- Modalidade apresentada pelo portal: `Assinaturas com integração`

A tela atual do Mercado Pago mostrou que:

- Checkout Pro NÃO aceita pagamentos recorrentes;
- Checkout Bricks aceita pagamentos recorrentes;
- Checkout Transparente aceita pagamentos recorrentes;
- a aba Assinaturas oferece `Assinaturas com integração`;
- `Assinaturas com integração` informa pagamentos recorrentes, frequência personalizável e retentativas automáticas.

A opção escolhida e criada foi `Assinaturas`.

Durante a primeira criação, o portal retornou repetidamente:

`DXT503-4TGK8FBSWFIA`

A aplicação inicialmente não havia sido criada.

Após nova tentativa pelo fluxo, a aplicação foi criada com sucesso.

Não é necessário reanalisar esse erro enquanto a aplicação continuar existente e funcional.

## CONTAS DE TESTE

O próprio portal atual do Mercado Pago orientou criar duas contas de teste do mesmo país:

- Vendedor;
- Comprador.

As duas foram criadas para Brasil.

Identificações finais confirmadas na interface:

- `Black Navalha - Vendedor`
- `Black Navalha - Comprador`

As senhas dessas contas são privadas e NÃO devem ser enviadas ao chat.

O portal também forneceu cartões de teste para realizar pagamento com a conta Comprador.

NENHUM pagamento de teste foi realizado ainda.

Não realizar cobrança real nesta fase.

## CREDENCIAIS DE TESTE

A área `Credenciais de teste` da aplicação foi acessada.

As credenciais de teste foram ATIVADAS com sucesso.

A tela apresentou:

- Public Key;
- Access Token;
- dados da aplicação/usuário de teste.

O Access Token estava oculto no print e NÃO foi enviado ao chat.

REGRA:

- Access Token é segredo;
- nunca enviar ao chat;
- nunca enviar ao browser;
- nunca usar prefixo `NEXT_PUBLIC_`;
- nunca versionar;
- armazenar somente de forma local/segura no servidor.

A Public Key foi explicitamente identificada pelo Mercado Pago como `Public Key`. Ela pode ser analisada separadamente para eventual uso frontend se a implementação realmente exigir. NÃO presumir que precisamos dela antes de definir o fluxo técnico.

Foi orientado configurar em `.env.local`:

`MERCADO_PAGO_ACCESS_TOKEN=<access token de teste>`

IMPORTANTE PARA A PRÓXIMA SESSÃO:

Antes de escrever código que dependa dessa variável, confirmar apenas se o usuário concluiu o armazenamento local, SEM pedir nem imprimir o valor.

`SUPABASE_SERVICE_ROLE_KEY` continua configurada localmente e segue secreta.

Não exibir `.env.local`.

## ARQUITETURA OBRIGATÓRIA

Preservar:

cliente
→ plano
→ barbeiro
→ capacidade
→ hold de 15 minutos
→ `subscription_charge pending`
→ Mercado Pago em teste
→ webhook/validação server-side
→ pagamento confirmado
→ ativação/renovação.

O navegador NÃO é autoridade para confirmar pagamento.

Nunca marcar `paid` apenas por redirect ou retorno do frontend.

Webhook futuro deve ser autenticado e idempotente.

Evento repetido não pode:

- ativar duas vezes;
- renovar duas vezes;
- duplicar receita;
- duplicar comissão.

Na futura área de pagamento, o cronômetro deve usar obrigatoriamente `reservation_expires_at` retornado pelo servidor:

15:00
→
00:00

Não criar timer independente do hold real.

## COMISSÃO

Percentual ainda NÃO definido.

Não inventar percentual.

Nenhuma comissão antes de pagamento confirmado.

## PRÓXIMO PASSO EXATO

Na próxima sessão:

1. Ler INTEGRALMENTE `CONTEXTO-PROJETO.md` antes de qualquer ação.
2. Dar prioridade absoluta a este checkpoint.
3. Confirmar SOMENTE se `MERCADO_PAGO_ACCESS_TOKEN` de TESTE foi salvo em `.env.local`, sem pedir/exibir o valor.
4. NÃO realizar pagamento ainda.
5. NÃO começar implementando com suposições antigas da API/SDK do Mercado Pago.
6. Inspecionar em lote a estrutura/código atual relacionado a assinaturas e o `subscription_charge pending`.
7. Definir, com base na modalidade real `Assinaturas com integração` e na documentação/API atual aplicável, a ligação entre o checkout existente e o Mercado Pago.
8. Preservar integralmente capacidade transacional, hold de 15 minutos e regras existentes.
9. Planejar/implementar confirmação server-side e webhook idempotente antes de considerar pagamento confirmado.
10. Somente depois executar pagamento usando comprador/cartão de TESTE.

Nenhuma cobrança real deve ser realizada.

Nenhum commit/push sem autorização explícita.

# FIM DO CHECKPOINT — 2026-09-11

---

# CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / PREPARAÇÃO DA IMPLEMENTAÇÃO — 2026-09-11

## PRIORIDADE ABSOLUTA

ANTES DE QUALQUER AÇÃO no próximo chat:

- ler INTEGRALMENTE CONTEXTO-PROJETO.md;
- dar PRIORIDADE ABSOLUTA a este checkpoint;
- NÃO reiniciar a análise;
- NÃO repetir inspeções e diagnósticos concluídos nesta sessão;
- NÃO presumir APIs antigas do Mercado Pago.

## MERCADO PAGO — ESTADO CONFIRMADO

Aplicação de desenvolvimento:

Black Navalha - Desenvolvimento

Modalidade:

Assinaturas com integração

Ambiente atual:

TESTE.

Contas de teste Vendedor e Comprador já existem.

Credenciais de teste já foram ativadas.

MERCADO_PAGO_ACCESS_TOKEN de TESTE foi salvo localmente em:

.env.local

A presença da variável foi confirmada sem revelar o valor.

NUNCA:
- exibir .env.local;
- pedir Access Token no chat;
- enviar segredo ao browser;
- versionar credenciais.

Nenhum pagamento de teste foi realizado até este checkpoint.

Nenhuma cobrança real deve ser realizada.

## DOCUMENTAÇÃO ATUAL DO MERCADO PAGO CONFIRMADA

Documentação oficial atual consultada:

https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview

A modalidade real utiliza a API de Assinaturas.

Endpoints documentados confirmados:

POST https://api.mercadopago.com/preapproval_plan

para criação de plano no Mercado Pago.

POST https://api.mercadopago.com/preapproval

para criação da assinatura.

A documentação atual confirmou suporte a:

- cobranças recorrentes;
- periodicidade configurável;
- retentativas automáticas;
- fluxo de pagamento do Mercado Pago.

Para assinatura com plano associado, a documentação apresenta:

preapproval_plan_id

e criação da assinatura através de /preapproval.

Não assumir exemplos antigos além do que foi confirmado na documentação atual.

## WEBHOOKS — DOCUMENTAÇÃO CONFIRMADA

Documentação oficial atual consultada:

https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks

No painel atual, o evento recomendado para Assinaturas é:

Planos e assinaturas

Tópicos relevantes documentados:

subscription_preapproval

para criação/atualização de assinatura.

subscription_authorized_payment

para criação/atualização de pagamento recorrente autorizado.

A documentação também apresenta recursos de payment para Assinaturas.

Após receber uma notificação, o backend deve consultar o recurso correspondente na API do Mercado Pago antes de alterar o estado financeiro interno.

O navegador NÃO pode confirmar pagamento.

### Autenticação do webhook

O Mercado Pago envia:

x-signature
x-request-id

A assinatura x-signature contém valores como:

ts
v1

A validação documentada utiliza manifesto baseado em:

id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];

e HMAC SHA-256 com a assinatura secreta configurada para Webhooks.

A futura assinatura secreta é SEGREDO.

NÃO enviar ao chat.
NÃO enviar ao browser.
NÃO versionar.

Webhook deve rejeitar notificações sem autenticação válida.

A documentação informa que o Mercado Pago espera HTTP 200 ou 201 para confirmar recebimento.

## WEBHOOK AINDA NÃO CONFIGURADO

No painel:

Webhooks → Configurar notificações

foi visualizado:

- Modo de teste;
- URL para teste;
- seleção de eventos;
- geração de assinatura secreta.

Nenhuma URL foi cadastrada ainda.

Nenhum evento foi salvo ainda.

Nenhuma assinatura secreta foi gerada/configurada para o projeto neste checkpoint.

NÃO configurar Webhook antes de o endpoint necessário estar implementado e acessível.

## TESTE DE COMPRA

A documentação oficial de Teste de integração foi consultada.

Ela orienta:

- utilizar conta de teste;
- realizar o fluxo pelo site;
- utilizar cartão de teste;
- informar dados do usuário de teste;
- confirmar a compra.

NENHUM pagamento de teste foi realizado ainda.

Não realizar pagamento antes da implementação server-side necessária estar pronta.

## CÓDIGO INSPECIONADO

Foram inspecionados os componentes atuais relacionados ao pré-checkout e assinaturas.

Pré-checkout existente preservado:

browser
→ /api/assinaturas/checkout
→ create_subscription_checkout
→ hold
→ subscription_charge pending.

app/api/assinaturas/checkout/route.ts:

- valida entrada server-side;
- usa createAdminClient();
- chama create_subscription_checkout;
- retorna chargeId;
- retorna checkoutToken;
- retorna amount/currency;
- retorna reservationExpiresAt;
- NÃO ativa assinatura;
- NÃO confirma pagamento.

app/assinaturas/subscription-checkout-form.tsx:

- coleta cliente;
- WhatsApp;
- e-mail;
- barbeiro;
- usa checkout_token idempotente;
- prepara contratação;
- atualmente termina após criação do hold/pending;
- ainda não possui pagamento Mercado Pago.

## CAPACIDADE / CONCORRÊNCIA

A implementação existente foi inspecionada.

reserve_subscription_checkout_capacity utiliza obrigatoriamente:

SELECT ... FOR UPDATE

na linha do barbeiro.

Isso serializa checkouts concorrentes por profissional.

PRESERVAR OBRIGATORIAMENTE.

Capacidade atual:

30 assinantes por barbeiro.

Cliente visualiza apenas:

Vagas disponíveis

ou:

Indisponível.

Hold:

15 minutos.

Carência após ciclo pago:

2 dias.

NÃO confundir hold com carência.

## ESTRUTURAS FINANCEIRAS EXISTENTES

subscription_charges possui estrutura genérica para gateway:

provider
provider_charge_id
idempotency_key

Além de:

status
amount
currency
plan_id
barber_id
subscription_id
cycle_id
checkout_token
dados do comprador.

Status financeiros previstos:

pending
paid
failed
cancelled
expired
refunded
partially_refunded

payment_events existe para idempotência/auditoria de Webhooks.

Possui unicidade por:

provider
provider_event_id

subscription_cycles existe separadamente.

subscription_commission_entries existe separadamente.

Nenhuma comissão deve ser gerada antes de pagamento confirmado.

Percentual de comissão continua NÃO DEFINIDO.

Não inventar percentual.

## MIGRATION 012 — CRIADA E APLICADA

Foi criada:

supabase/sql/012-mercado-pago-subscriptions.sql

Objetivo:

vincular o catálogo interno subscription_plans ao preapproval_plan correspondente do Mercado Pago.

Foi adicionada em:

public.subscription_plans

a coluna:

mercado_pago_preapproval_plan_id text

Ela aceita NULL enquanto o plano ainda não foi criado/vinculado no Mercado Pago.

Foi criada proteção contra string vazia e índice UNIQUE para IDs preenchidos.

A migration foi aplicada no Supabase em 2026-09-11.

Resultado:

Success. No rows returned

NÃO reaplicar 012 sem necessidade concreta.

Migrations 007/008/009/010/011 também já estavam aplicadas e NÃO devem ser reaplicadas.

## SDK / DEPENDÊNCIAS

package.json foi inspecionado.

Não existe SDK do Mercado Pago instalado.

Decisão atual:

não instalar SDK por padrão.

A API REST atual pode ser integrada server-side usando fetch nativo.

Não adicionar dependência sem necessidade concreta.

## NEXT.JS 16

AGENTS.md foi lido.

Antes de escrever novas Route Handlers foi consultada a documentação local:

node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md

Confirmado:

- Route Handlers usam Request/Response Web APIs;
- POST é suportado;
- request.json() pode ser utilizado;
- headers podem ser lidos da Request;
- Route Handlers são apropriadas para receber Webhooks;
- não é necessário bodyParser adicional.

Não repetir essa leitura sem nova necessidade relacionada à mesma convenção.

## ARQUITETURA OBRIGATÓRIA

Preservar exatamente:

cliente
→ plano interno
→ barbeiro
→ capacidade
→ SELECT ... FOR UPDATE
→ hold de 15 minutos
→ subscription_charge pending
→ Mercado Pago em TESTE
→ webhook autenticado
→ consulta/validação server-side no Mercado Pago
→ processamento idempotente
→ pagamento confirmado
→ ativação/renovação.

O navegador NÃO é autoridade para marcar pagamento como paid.

Redirect/retorno do frontend NÃO pode ativar assinatura.

Eventos repetidos não podem:

- ativar duas vezes;
- renovar duas vezes;
- duplicar receita;
- duplicar comissão.

## CRONÔMETRO

Na futura tela de pagamento implementar:

15:00 → 00:00

baseado exclusivamente em:

reservation_expires_at

retornado pelo servidor.

Não criar timer independente do hold real.

## NÃO ALTERAR

Não reconstruir:

/agendar

Não alterar:

create_public_multi_appointment

Não reconstruir benefício existente das assinaturas no agendamento.

Não fabricar histórico financeiro da assinatura legada.

Não reaplicar migrations já aplicadas.

## GIT / SEGURANÇA

Nunca versionar:

.env.local
ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt

Nunca usar:

git add .

Staging somente por caminhos explícitos.

Commit/push somente com autorização explícita.

## PRÓXIMO PASSO EXATO

No próximo chat:

1. LER INTEGRALMENTE CONTEXTO-PROJETO.md antes de qualquer ação.
2. Priorizar este checkpoint.
3. NÃO repetir inspeção de 007–012, package.json, AGENTS.md ou documentação já confirmada.
4. Continuar a implementação server-side do Mercado Pago usando a API REST atual.
5. Preparar a ligação entre subscription_plans e preapproval_plan.
6. Preparar criação de assinatura/preapproval associada ao subscription_charge pending.
7. Usar identificadores internos como referência/idempotência sempre que compatível com a API atual.
8. Implementar endpoint de Webhook antes de qualquer pagamento de teste.
9. Implementar validação HMAC x-signature.
10. Implementar consulta server-side ao recurso Mercado Pago antes de aceitar estado financeiro.
11. Implementar processamento interno idempotente antes de qualquer ativação.
12. Preservar SELECT ... FOR UPDATE e hold de 15 minutos.
13. NÃO realizar pagamento de teste antes de toda a implementação necessária estar pronta.
14. Depois configurar URL de teste do Webhook e assinatura secreta.
15. Somente então executar pagamento com conta/cartão de TESTE.

Não realizar cobrança real.


---

# CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / IMPLEMENTAÇÃO SERVER-SIDE E WEBHOOK — 2026-09-11

## PRIORIDADE ABSOLUTA

Este é o checkpoint mais recente e deve ter PRIORIDADE ABSOLUTA na próxima sessão.

ANTES DE QUALQUER AÇÃO:

- ler INTEGRALMENTE CONTEXTO-PROJETO.md;
- NÃO reiniciar a análise;
- NÃO repetir inspeções de migrations 007–013, package.json, AGENTS.md ou documentação já confirmada;
- NÃO reconstruir /agendar;
- NÃO alterar create_public_multi_appointment;
- preservar obrigatoriamente SELECT ... FOR UPDATE na proteção de capacidade;
- usar npm.cmd;
- fornecer UM comando PowerShell completo por etapa quando o responsável precisar executar algo;
- preferir Set-Content para código;
- nunca usar git add .;
- staging somente com caminhos explícitos;
- commit/push somente com autorização;
- nunca exibir nem versionar .env.local.

## GIT DE REFERÊNCIA NO INÍCIO DESTA SESSÃO

Branch:

main

HEAD/origin confirmado:

b7f8b39 Prepara integracao de assinaturas com Mercado Pago

Arquivos untracked auxiliares:

- ASSINATURAS-LOTE.txt
- CODIGO-COMPLETO.txt

Esses arquivos NÃO devem ser versionados.

## MERCADO PAGO

Aplicação:

Black Navalha - Desenvolvimento

Ambiente:

TESTE

Modalidade:

Assinaturas com integração

Contas Vendedor/Comprador de teste já existem.

MERCADO_PAGO_ACCESS_TOKEN de TESTE continua salvo somente em .env.local.

Nenhum pagamento de teste foi realizado nesta sessão.

Nenhuma cobrança real foi realizada.

## API ATUAL CONFIRMADA

Mantêm-se confirmados:

POST https://api.mercadopago.com/preapproval_plan

POST https://api.mercadopago.com/preapproval

Webhook:

- subscription_preapproval
- subscription_authorized_payment

Cabeçalhos:

- x-signature
- x-request-id

Manifesto HMAC SHA-256:

id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];

Também foi confirmado nesta sessão diretamente na referência atual do Mercado Pago:

GET https://api.mercadopago.com/authorized_payments/{id}

Exemplo atual documentado de authorized payment contém:

- id;
- preapproval_id;
- external_reference;
- currency_id;
- transaction_amount;
- status da fatura;
- payment.id;
- payment.status;
- payment.status_detail.

REGRA IMPLEMENTADA:

authorized_payment.status = scheduled NÃO é considerado confirmação financeira.

Somente:

payment.status = approved

pode avançar para processamento financeiro, e ainda exige validações internas adicionais.

## SCHEMA/ÍNDICES CONFIRMADOS NESTA SESSÃO

Foram consultados somente os contratos necessários das estruturas financeiras atuais.

Confirmado:

payment_events possui UNIQUE:

(provider, provider_event_id)

subscription_charges possui UNIQUE:

idempotency_key

e UNIQUE parcial:

(provider, provider_charge_id)

subscription_capacity_reservations possui UNIQUE:

checkout_token

subscription_cycles possui UNIQUE:

(subscription_id, period_start)

subscription_commission_entries possui proteção contra comissão duplicada por charge.

customers.phone possui índice comum, NÃO UNIQUE.

Portanto não utilizar ON CONFLICT(phone).

Não repetir essas consultas sem necessidade concreta.

## REGRA DE CICLO DEFINIDA

Para pagamento inicial confirmado na data D em America/Sao_Paulo:

period_start = D

period_end = D + billing_interval_months - 1 dia

Exemplo:

11/09/2026
→
10/10/2026

subscriptions.starts_at = início da contratação válida.

subscriptions.expires_at = fim do ciclo pago atual.

grace_until considera grace_days do plano após o encerramento do ciclo.

Para renovação, o próximo ciclo deve continuar após o period_end anterior quando aplicável.

## MIGRATION 013

Criada:

supabase/sql/013-mercado-pago-payment-confirmation.sql

Autorização de criação e aplicação foi fornecida explicitamente.

Migration aplicada no Supabase em 2026-09-11.

Resultado:

Success. No rows returned

NÃO reaplicar.

Ela cria:

public.confirm_mercado_pago_subscription_payment(...)

RPC SECURITY DEFINER acessível ao service_role.

Objetivo:

processar de maneira transacional/idempotente a confirmação financeira já validada server-side.

A RPC:

- bloqueia subscription_charge com FOR UPDATE;
- exige provider = mercado_pago;
- exige provider_charge_id correspondente;
- aceita processamento financeiro novo somente para charge pending;
- retorna idempotentemente se charge já estiver paid e completa;
- carrega o plano;
- bloqueia o barbeiro com FOR UPDATE;
- preserva proteção de capacidade;
- carrega o hold pelo checkout_token;
- revalida capacidade se o hold tiver expirado;
- não ultrapassa subscriber_capacity;
- normaliza WhatsApp;
- localiza cliente existente pelo telefone normalizado;
- cria cliente quando necessário;
- não usa ON CONFLICT(phone), pois customers.phone não é UNIQUE;
- preserva assinatura legada com plan_id NULL;
- cria/reutiliza assinatura comercial vinculada ao plano;
- cria ciclo paid;
- vincula barbeiro historicamente no ciclo;
- atualiza assinatura para active;
- registra expires_at do ciclo;
- copia os services ativos subscriber_service para subscription_services;
- transforma o hold em consumed;
- vincula charge a subscription/cycle;
- marca charge como paid;
- registra paid_at;
- NÃO cria comissão.

Percentual/regra de comissão continuam NÃO definidos.

Não inventar comissão.

## IMPLEMENTAÇÃO REST MERCADO PAGO

Criado:

lib/mercado-pago/client.ts

Responsabilidades:

- acesso exclusivamente server-side;
- MERCADO_PAGO_ACCESS_TOKEN lido do ambiente;
- fetch nativo;
- Authorization Bearer;
- suporte a X-Idempotency-Key;
- tratamento de respostas/erros;
- nenhum SDK do Mercado Pago instalado.

Criado/alterado:

lib/mercado-pago/subscriptions.ts

Implementado:

- criação de preapproval_plan;
- criação de preapproval;
- consulta GET de preapproval;
- consulta GET de authorized_payments/{id};
- parsing defensivo dos campos necessários.

## CRIAÇÃO DO PREAPPROVAL

Criado:

app/api/assinaturas/mercado-pago/route.ts

A rota:

- recebe chargeId + checkoutToken;
- busca somente subscription_charge correspondente;
- exige charge pending;
- exige e-mail para prosseguir ao Mercado Pago;
- valida hold vigente;
- valida plano interno ativo;
- compara preço da charge com preço do plano;
- exige BRL;
- cria preapproval_plan no Mercado Pago quando ainda não existe vínculo;
- utiliza X-Idempotency-Key determinístico para o plano;
- persiste mercado_pago_preapproval_plan_id no subscription_plans;
- cria preapproval associado ao plano;
- utiliza external_reference = subscription_charge.id;
- utiliza idempotência determinística baseada na charge;
- persiste:
  provider = mercado_pago
  provider_charge_id = preapproval.id
- em retry com provider_charge_id existente, consulta o preapproval no Mercado Pago em vez de criar outro;
- retorna init_point;
- retorna reservationExpiresAt.

IMPORTANTE:

A rota ainda NÃO foi chamada em teste nesta sessão.

Portanto nenhum preapproval_plan/preapproval foi criado por esta implementação até este checkpoint.

## WEBHOOK IMPLEMENTADO

Criado:

app/api/mercado-pago/webhook/route.ts

Criado:

lib/mercado-pago/webhook-signature.ts

Implementado:

- POST Route Handler;
- leitura de x-signature;
- leitura de x-request-id;
- extração de data.id;
- parsing de ts/v1;
- construção do manifesto documentado;
- HMAC SHA-256;
- comparação timing-safe;
- rejeição de assinatura inválida;
- nenhum segredo enviado ao browser;
- suporte aos tópicos:
  subscription_preapproval
  subscription_authorized_payment
- armazenamento em payment_events;
- idempotência baseada em provider + provider_event_id;
- provider_event_id utiliza type + x-request-id + data.id;
- eventos duplicados retornam sucesso sem reprocessar;
- subscription_preapproval é consultado server-side antes de ser considerado processado;
- subscription_authorized_payment é consultado server-side em:
  GET /authorized_payments/{id}.

## REGRA FINANCEIRA DO WEBHOOK

Para subscription_authorized_payment:

NÃO confiar somente no webhook.

Primeiro consultar o recurso no Mercado Pago server-side.

Somente continuar se:

payment.status = approved

Depois validar:

- external_reference existe;
- external_reference corresponde ao subscription_charge.id;
- charge existe;
- provider = mercado_pago;
- provider_charge_id corresponde a authorized_payment.preapproval_id;
- currency_id corresponde à charge;
- transaction_amount corresponde à charge.

Somente depois chamar:

confirm_mercado_pago_subscription_payment

Somente após sucesso da RPC:

- payment_events recebe charge_id;
- processed_at é preenchido;
- processamento é considerado concluído.

Eventos não aprovados não ativam assinatura.

Erros não marcam o evento como processado com sucesso.

## SEGREDO DO WEBHOOK

Ainda NÃO existe/configurado no projeto:

MERCADO_PAGO_WEBHOOK_SECRET

O código já exige essa variável para validar notificações.

Não pedir o valor no chat.

Não exibir.

Não versionar.

Ela deverá ser criada/obtida no painel do Mercado Pago somente na próxima etapa de configuração do Webhook e salva diretamente em .env.local.

## UI / CRONÔMETRO

Alterado:

app/assinaturas/subscription-checkout-form.tsx

Agora o pré-checkout preserva:

- chargeId;
- checkoutToken;
- amount;
- currency;
- reservationExpiresAt.

E-mail passou a ser obrigatório para avançar ao fluxo Mercado Pago.

Foi implementado cronômetro:

15:00
→
00:00

A contagem é calculada obrigatoriamente a partir de:

reservation_expires_at

retornado pelo servidor.

Não existe timer independente da validade real do hold.

Quando expira:

- botão de Mercado Pago fica desabilitado;
- UI informa que nova contratação deve ser preparada.

Foi criado botão:

CONTINUAR PARA O MERCADO PAGO

Ele chama:

/api/assinaturas/mercado-pago

e utiliza init_point retornado pelo servidor.

IMPORTANTE:

Esse botão NÃO foi utilizado nesta sessão.

Nenhum preapproval foi iniciado pela interface.

Nenhum pagamento foi realizado.

## BUILD

Foram executados builds após os principais lotes.

Build final desta sessão:

npm.cmd run build

APROVADO.

Resultado:

- Compiled successfully;
- TypeScript sem erros;
- rotas geradas normalmente.

Novas rotas reconhecidas:

/api/assinaturas/mercado-pago
/api/mercado-pago/webhook

Rota /assinaturas permanece funcional no build.

Houve apenas aviso Git de conversão futura LF → CRLF em subscription-checkout-form.tsx.

Não foi erro de build.

## BANCO

Migrations 007–013 estão aplicadas.

NÃO reaplicar.

A única alteração permanente de banco desta sessão foi a migration 013, aplicada com autorização explícita.

## ARQUITETURA PRESERVADA

Fluxo continua:

cliente
→ plano
→ barbeiro
→ capacidade
→ SELECT ... FOR UPDATE
→ hold 15 minutos
→ subscription_charge pending
→ preapproval Mercado Pago em TESTE
→ webhook autenticado
→ consulta server-side ao Mercado Pago
→ validação de pagamento aprovado
→ RPC transacional/idempotente
→ assinatura/ciclo
→ comissão somente futuramente.

O navegador NÃO confirma pagamento.

Redirect não confirma pagamento.

Nenhuma comissão antes de confirmação server-side.

## PRÓXIMO PASSO EXATO

A próxima etapa foi autorizada pelo responsável antes do encerramento:

usar um TÚNEL HTTPS TEMPORÁRIO para expor localhost:3000 ao Mercado Pago.

Ainda NÃO foi iniciado o túnel.

Próxima sessão:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint;
3. confirmar estado Git após os checkpoints;
4. NÃO repetir análise/inspeções já concluídas;
5. iniciar servidor local caso necessário;
6. abrir túnel HTTPS temporário para localhost:3000;
7. usar a URL pública:
   https://URL-DO-TUNEL/api/mercado-pago/webhook
8. configurar Webhook em MODO DE TESTE no painel Mercado Pago;
9. selecionar eventos de Assinaturas necessários, conforme painel atual;
10. gerar/obter assinatura secreta do Webhook;
11. salvar localmente em .env.local como:
    MERCADO_PAGO_WEBHOOK_SECRET=...
12. NÃO mostrar o segredo no chat;
13. reiniciar servidor se necessário para carregar a variável;
14. validar endpoint/webhook;
15. somente depois preparar uma contratação de TESTE;
16. somente depois criar preapproval/plano no ambiente de TESTE;
17. somente depois realizar pagamento com Comprador/cartão de TESTE;
18. auditar charge, evento, assinatura, ciclo e hold;
19. confirmar que nenhum evento duplicou processamento;
20. confirmar que nenhuma comissão foi criada.

Nenhuma cobrança real.

## TÚNEL

Uso de túnel HTTPS temporário foi explicitamente AUTORIZADO.

A sugestão preparada foi utilizar localtunnel temporariamente com:

npx.cmd --yes localtunnel --port 3000

sem adicionar dependência ao package.json.

Ainda NÃO foi executado.

Se a ferramenta apresentar problema, escolher alternativa somente com necessidade concreta.

## GIT / SEGURANÇA

Nunca versionar:

.env.local
ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt

Nunca usar:

git add .

Staging somente com caminhos explícitos.

Neste checkpoint deve ser versionado apenas o código/migration/contexto apropriados.

# FIM DO CHECKPOINT — 2026-09-11

---

# CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / WEBHOOK DE TESTE E PRIMEIRA TENTATIVA DE PREAPPROVAL — 2026-09-12

## PRIORIDADE ABSOLUTA

Este é o checkpoint mais recente e deve ter PRIORIDADE ABSOLUTA na próxima sessão.

ANTES DE QUALQUER AÇÃO:

- ler INTEGRALMENTE CONTEXTO-PROJETO.md;
- NÃO reiniciar a análise;
- NÃO repetir inspeções ou diagnósticos já concluídos;
- NÃO presumir APIs/SDKs antigos do Mercado Pago;
- preservar todas as decisões e restrições do checkpoint de 2026-09-11;
- usar npm.cmd;
- fornecer UM comando PowerShell completo quando execução local for necessária;
- nunca usar git add .;
- commit/push somente com autorização;
- nunca exibir .env.local ou qualquer segredo.

## GIT DE REFERÊNCIA

Estado informado no início da sessão:

Branch:
main

HEAD/origin:
741d528 Implementa base server-side do Mercado Pago

Arquivos untracked esperados:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Esses arquivos NÃO devem ser versionados.

Nenhum código, migration ou configuração versionada foi alterado nesta sessão antes desta atualização documental.

.env.local foi alterado somente para armazenar o segredo do Webhook e NÃO deve ser exibido/versionado.

## SERVIDOR LOCAL

Next.js 16.3.4 foi iniciado e confirmado em:

http://localhost:3000

.env.local foi carregado pelo servidor.

Ao final da sessão os processos locais podem ser encerrados normalmente.

## LOCAL TUNNEL — DESCARTADO

Foi tentado inicialmente:

npx.cmd --yes localtunnel@2.0.2 --port 3000

URLs obtidas incluíram:

https://sad-wings-boil.loca.lt
https://rude-dancers-smile.loca.lt

As URLs eram criadas, mas requisições externas apresentavam timeout.

O LocalTunnel foi abandonado para esta sessão.

Não é necessário repetir o diagnóstico.

## CLOUDFLARE QUICK TUNNEL — FUNCIONAL

Foi utilizado:

npx.cmd --yes cloudflared@latest tunnel --url http://localhost:3000

URL temporária da sessão:

https://engineer-lol-platform-citations.trycloudflare.com

Os pre-checks do cloudflared passaram e o túnel registrou conexão.

Foi validado externamente:

GET https://engineer-lol-platform-citations.trycloudflare.com/api/mercado-pago/webhook

Resultado:

HTTP 405

Esse é o resultado esperado porque a Route Handler do Webhook implementa POST.

Portanto foi confirmado:

internet
→ Cloudflare
→ localhost:3000
→ /api/mercado-pago/webhook

A URL é TEMPORÁRIA e não deve ser presumida válida na próxima sessão.

Na próxima sessão será necessário abrir novo túnel e atualizar a URL de teste do Mercado Pago caso esta URL tenha expirado.

## WEBHOOK MERCADO PAGO — CONFIGURADO EM TESTE

No painel da aplicação:

Black Navalha - Desenvolvimento

Ambiente:

Modo de teste

Evento selecionado:

Planos e assinaturas

Não foram selecionados eventos legacy desnecessários.

A URL temporária Cloudflare foi salva como URL de teste:

https://engineer-lol-platform-citations.trycloudflare.com/api/mercado-pago/webhook

O painel apresentou a assinatura secreta mascarada.

O valor NÃO foi enviado ao chat.

A assinatura secreta foi copiada diretamente do painel para a máquina local e armazenada em:

MERCADO_PAGO_WEBHOOK_SECRET

dentro de:

.env.local

O valor NÃO foi impresso.

MERCADO_PAGO_ACCESS_TOKEN de TESTE continua em .env.local.

SUPABASE_SERVICE_ROLE_KEY continua secreta.

Nunca pedir/exibir esses valores.

## SIMULAÇÃO DE WEBHOOK

A tela "Simular notificações" foi aberta.

Tipo selecionado:

Planos e assinaturas

O painel preencheu Data ID fictício:

123456

A simulação NÃO foi enviada.

Motivo:

o endpoint implementado consulta o recurso real no Mercado Pago após autenticar a notificação; usar 123456 não forneceria um recurso real adequado para a validação end-to-end.

Nenhum webhook de pagamento foi processado nesta etapa.

## PRIMEIRA CONTRATAÇÃO DE TESTE PREPARADA

Foi aberta:

http://localhost:3000/assinaturas

Foi preparada UMA contratação de TESTE pela interface.

Resultado visual confirmado:

- Plano Mensal;
- R$ 150,00;
- serviços incluídos corretos;
- vaga reservada temporariamente;
- checkout interno preparado;
- cronômetro iniciado em aproximadamente 15:00;
- cronômetro baseado em reservation_expires_at;
- botão CONTINUAR PARA O MERCADO PAGO disponível.

Nenhum pagamento foi realizado.

Nenhuma cobrança real foi realizada.

## PRIMEIRA TENTATIVA DE CONTINUAR PARA O MERCADO PAGO

Com hold ainda válido, foi clicado UMA vez:

CONTINUAR PARA O MERCADO PAGO

Resultado:

a interface permaneceu em /assinaturas e exibiu:

Checkout inválido.

O cronômetro continuava ativo.

Não houve redirecionamento ao Mercado Pago.

Não clicar repetidamente e não criar novo checkout antes de diagnosticar esta tentativa.

O diagnóstico do erro ainda NÃO foi realizado.

A sessão foi encerrada imediatamente após o erro a pedido do responsável.

## PRÓXIMO PASSO EXATO

Na próxima sessão:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint e o checkpoint server-side de 2026-09-11;
3. confirmar Git somente se necessário;
4. iniciar localhost:3000;
5. abrir novo Cloudflare Quick Tunnel;
6. atualizar no Mercado Pago a URL de teste caso a URL anterior tenha expirado;
7. NÃO criar outro checkout inicialmente;
8. investigar especificamente por que /api/assinaturas/mercado-pago retornou "Checkout inválido.";
9. começar pelo log server-side da tentativa e/ou pelo trecho mínimo da rota responsável pela validação;
10. NÃO reinspecionar migrations 007–013, schema geral, AGENTS.md, package.json ou documentação já confirmada sem necessidade concreta;
11. corrigir somente a causa comprovada;
12. executar build se houver alteração de código;
13. preparar nova contratação de TESTE somente depois da correção;
14. criar/vincular preapproval_plan/preapproval somente em TESTE;
15. validar Webhook antes do pagamento;
16. somente depois utilizar conta/cartão de TESTE;
17. auditar subscription_charge, payment_events, subscription, subscription_cycle e hold;
18. confirmar idempotência;
19. confirmar ausência de comissão.

## REGRAS PRESERVADAS

- capacidade: 30 assinantes por barbeiro;
- hold: 15 minutos;
- carência após ciclo pago: 2 dias;
- não confundir hold com carência;
- preservar SELECT ... FOR UPDATE;
- browser NÃO confirma pagamento;
- somente payment.status = approved pode avançar após todas as validações internas;
- comissão continua sem percentual definido;
- NÃO inventar comissão;
- NÃO realizar cobrança real;
- NÃO alterar /agendar;
- NÃO alterar create_public_multi_appointment;
- NÃO reconstruir integração existente dos benefícios das assinaturas;
- migrations 007–013 já aplicadas e NÃO devem ser reaplicadas;
- MERCADO_PAGO_WEBHOOK_SECRET, MERCADO_PAGO_ACCESS_TOKEN e SUPABASE_SERVICE_ROLE_KEY permanecem secretos.

## ESTADO DE SEGURANÇA

Não houve exposição no chat de:

- MERCADO_PAGO_ACCESS_TOKEN;
- MERCADO_PAGO_WEBHOOK_SECRET;
- SUPABASE_SERVICE_ROLE_KEY.

Nenhuma cobrança real foi realizada.

# FIM DO CHECKPOINT — 2026-09-12

---

# CHECKPOINT INTERMEDIÁRIO — MERCADO PAGO / DIAGNÓSTICO DO PREAPPROVAL — 2026-09-12

## PRIORIDADE

Este checkpoint complementa o checkpoint final de 2026-09-12 e registra exatamente o avanço posterior.

Preservar integralmente também:

- CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / IMPLEMENTAÇÃO SERVER-SIDE E WEBHOOK — 2026-09-11;
- CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / WEBHOOK DE TESTE E PRIMEIRA TENTATIVA DE PREAPPROVAL — 2026-09-12.

NÃO reiniciar a integração inteira.

A próxima abordagem deve priorizar testes isolados e conclusivos, evitando consumir novos checkouts para cada diagnóstico.

## ERRO "CHECKOUT INVÁLIDO" — CAUSA COMPROVADA E CORRIGIDA

Foi identificado que:

app/api/assinaturas/mercado-pago/route.ts

possuía UUID_PATTERN incorreto.

A parte final estava:

[89ab][0-9a-f]{12}

e faltava:

{3}-

O padrão foi corrigido para o mesmo formato válido utilizado pela rota de pré-checkout:

[89ab][0-9a-f]{3}-[0-9a-f]{12}

Foram verificados os IDs reais da tentativa anterior:

charge:
d84c5d8d-ccc9-400f-a866-68730416558a

checkout_token:
90241a5f-05a2-4b91-882a-35ab0029dbc2

Ambos são UUIDv4 válidos.

Portanto o erro original:

Checkout inválido.

está diagnosticado e corrigido.

Build após a correção:

APROVADO.

NÃO voltar a investigar essa causa sem nova evidência.

## SEGUNDO ERRO — PREAPPROVAL_PLAN / BACK_URL

Depois da correção do UUID, a requisição avançou até o Mercado Pago e houve resposta:

HTTP 400
invalid back_url

Foi confirmado em:

lib/mercado-pago/subscriptions.ts

que createPreapprovalPlan não enviava back_url.

Foi então implementado suporte a:

back_url

em createPreapprovalPlan.

A rota:

app/api/assinaturas/mercado-pago/route.ts

passou a ler:

MERCADO_PAGO_BACK_URL

server-side.

A URL é validada como HTTPS.

Foi configurada localmente, sem exibir segredos, utilizando a URL do Cloudflare Quick Tunnel da sessão seguida de:

/assinaturas

Variável:

MERCADO_PAGO_BACK_URL

está em .env.local e NÃO deve ser versionada.

Build após essa alteração:

APROVADO.

## CLOUDFLARE DA SESSÃO

Quick Tunnel atual durante este checkpoint:

https://ware-pairs-insider-rebel.trycloudflare.com

Webhook:

https://ware-pairs-insider-rebel.trycloudflare.com/api/mercado-pago/webhook

Validação externa:

HTTP 405

Resultado esperado porque a rota implementa POST.

A URL foi atualizada no painel Mercado Pago em:

Modo de teste
→ Webhooks
→ Planos e assinaturas

A URL é temporária e NÃO deve ser presumida válida em sessão futura.

MERCADO_PAGO_WEBHOOK_SECRET já permanece salvo localmente e não foi alterado/exposto.

## TERCEIRO ERRO — AUTHORIZATION HEADER

Após novo checkout de TESTE e nova tentativa de continuar ao Mercado Pago, ocorreu:

Mercado Pago POST /preapproval_plan falhou na rede (UND_ERR_INVALID_ARG): invalid Authorization header

A requisição falhou no Node/Undici antes de obter resposta HTTP do Mercado Pago.

Foi confirmado separadamente que a conectividade funciona:

PowerShell:
GET https://api.mercadopago.com
→ HTTP 404

Node fetch:
fetch('https://api.mercadopago.com')
→ HTTP 404

Portanto:

- DNS funciona;
- TLS funciona;
- acesso de rede ao host funciona;
- fetch nativo do Node consegue alcançar api.mercadopago.com.

O bloqueio atual está especificamente na construção/aceitação do header Authorization usado pela integração.

## INSTRUMENTAÇÃO DE REDE

Foi alterado:

lib/mercado-pago/client.ts

O fetch agora captura falhas de rede e preserva:

- código da causa;
- mensagem da causa;

sem imprimir:

- token;
- Authorization;
- headers;
- payload secreto.

Essa instrumentação revelou exatamente:

UND_ERR_INVALID_ARG
invalid Authorization header

Build após essa alteração:

APROVADO.

## PREAPPROVAL_PLAN AINDA NÃO VINCULADO

Consulta somente-leitura confirmou:

subscription_plans.mercado_pago_preapproval_plan_id = null

para:

Plano Mensal

Portanto nenhuma tentativa atual conseguiu persistir vínculo com preapproval_plan.

Nenhum pagamento foi realizado.

Nenhuma cobrança real foi realizada.

## PRÓXIMA ESTRATÉGIA

Evitar continuar consumindo novos holds/checkouts apenas para diagnosticar autenticação.

Primeiro validar isoladamente a configuração/autenticação do Mercado Pago.

Próximo teste previsto:

verificar de forma SEGURA propriedades do valor local de:

MERCADO_PAGO_ACCESS_TOKEN

sem imprimir o token.

Verificar somente:

- variável presente;
- comprimento;
- espaços externos;
- caracteres de controle;
- aspas externas.

NÃO pedir nem imprimir o Access Token no chat.

Se esse teste não revelar imediatamente a causa, mudar a estratégia para validar autenticação Mercado Pago isoladamente com uma operação GET segura, sem:

- criar preapproval_plan;
- criar preapproval;
- criar checkout;
- consumir hold;
- realizar pagamento.

Não continuar repetindo o mesmo fluxo completo enquanto a autenticação isolada não estiver comprovadamente funcional.

## ESTADO DOS PROCESSOS NA SESSÃO

Foi identificado um next dev antigo no PID 16464 e ele foi encerrado.

Depois foi iniciado um único:

npm.cmd run dev

visível em:

http://localhost:3000

O Cloudflare permaneceu apontando para localhost:3000.

Antes de nova sessão, processos podem precisar ser iniciados novamente.

## ALTERAÇÕES LOCAIS DE CÓDIGO DESTA ETAPA

Alterados:

- app/api/assinaturas/mercado-pago/route.ts
- lib/mercado-pago/subscriptions.ts
- lib/mercado-pago/client.ts
- CONTEXTO-PROJETO.md

.env.local também possui MERCADO_PAGO_BACK_URL, mas NÃO deve ser exibido/versionado.

## BUILDS

Foram executados builds após as correções.

Último:

npm.cmd run build

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- rotas geradas normalmente.

## SEGURANÇA / FINANCEIRO

Nenhum segredo foi exposto no chat nesta etapa.

NÃO exibir:

- MERCADO_PAGO_ACCESS_TOKEN;
- MERCADO_PAGO_WEBHOOK_SECRET;
- SUPABASE_SERVICE_ROLE_KEY;
- .env.local.

Nenhum pagamento foi realizado.

Nenhuma cobrança real foi realizada.

Percentual de comissão continua NÃO definido.

Nenhuma comissão foi criada.

## REGRAS PRESERVADAS

- capacidade: 30 assinantes por barbeiro;
- proteção concorrente: SELECT ... FOR UPDATE;
- hold: 15 minutos;
- carência após ciclo pago: 2 dias;
- cronômetro baseado em reservation_expires_at;
- browser não confirma pagamento;
- somente payment.status = approved pode avançar após validações internas;
- migrations 007–013 já aplicadas e não devem ser reaplicadas;
- não alterar /agendar;
- não alterar create_public_multi_appointment;
- não reconstruir benefícios existentes das assinaturas.

## GIT

Referência versionada permanece:

741d528 Implementa base server-side do Mercado Pago

Existem alterações locais ainda NÃO commitadas.

Não versionar:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## PRÓXIMO PASSO EXATO

1. NÃO criar novo checkout.
2. NÃO chamar novamente POST /preapproval_plan ainda.
3. Validar isoladamente a configuração de MERCADO_PAGO_ACCESS_TOKEN sem revelar seu valor.
4. Se necessário, validar autenticação com GET seguro contra a API Mercado Pago.
5. Somente após autenticação isolada funcionar, retomar criação de preapproval_plan.
6. Evitar novos diagnósticos circulares ou repetição do fluxo completo.
7. Corrigir somente causas comprovadas.
8. Build após alteração de código.
9. Pagamento somente com conta/cartão de TESTE depois de webhook e preapproval funcionais.
10. Nenhuma cobrança real.

# FIM DO CHECKPOINT INTERMEDIÁRIO — 2026-09-12

---

# CHECKPOINT INTERMEDIÁRIO — MERCADO PAGO / CREDENCIAL CORRIGIDA E CHECKOUT HOSPEDADO VALIDADO — 2026-09-13

## PRIORIDADE ABSOLUTA

Este checkpoint é o estado mais recente da integração Mercado Pago.

Preservar também integralmente:

- CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / IMPLEMENTAÇÃO SERVER-SIDE E WEBHOOK — 2026-09-11;
- CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / WEBHOOK DE TESTE E PRIMEIRA TENTATIVA DE PREAPPROVAL — 2026-09-12;
- CHECKPOINT INTERMEDIÁRIO — MERCADO PAGO / DIAGNÓSTICO DO PREAPPROVAL — 2026-09-12.

NÃO reiniciar a integração inteira.

NÃO repetir diagnósticos já concluídos.

Priorizar testes isolados e conclusivos.

## ERRO ORIGINAL "CHECKOUT INVÁLIDO"

CAUSA COMPROVADA E CORRIGIDA.

app/api/assinaturas/mercado-pago/route.ts possuía UUID_PATTERN incorreto.

Foi corrigido para aceitar corretamente UUIDs válidos.

Build após correção:

APROVADO.

Não voltar a investigar essa causa sem nova evidência.

## BACK_URL DO PREAPPROVAL_PLAN

Depois da correção do UUID, Mercado Pago respondeu:

HTTP 400
invalid back_url

Foi confirmado que createPreapprovalPlan não enviava back_url.

Foi implementado:

- suporte a backUrl em lib/mercado-pago/subscriptions.ts;
- envio de back_url no POST /preapproval_plan;
- MERCADO_PAGO_BACK_URL server-side;
- validação de URL HTTPS na rota.

MERCADO_PAGO_BACK_URL foi configurada localmente em .env.local apontando para a URL temporária Cloudflare + /assinaturas.

Build:

APROVADO.

## ACCESS TOKEN — CAUSA DO INVALID AUTHORIZATION HEADER

Posteriormente o Node/Undici retornou:

UND_ERR_INVALID_ARG
invalid Authorization header

Foi realizado diagnóstico seguro sem imprimir segredo.

A variável MERCADO_PAGO_ACCESS_TOKEN estava inicialmente com comprimento 1 e caractere de controle.

Na tentativa de corrigir, foi colocado por engano o segredo do Webhook no lugar de MERCADO_PAGO_ACCESS_TOKEN.

Isso produziu:

HTTP 403

em chamadas autenticadas.

A causa foi identificada pelo responsável.

O Access Token correto de TESTE foi então copiado especificamente de:

Black Navalha - Desenvolvimento
→ Credenciais de teste
→ Access Token

e salvo em .env.local sem ser exibido no chat.

Validação isolada posterior:

GET https://api.mercadopago.com/preapproval/search?limit=1

Resultado:

HTTP 200

Portanto:

MERCADO_PAGO_ACCESS_TOKEN DE TESTE ESTÁ AGORA CORRETO E FUNCIONAL.

Não repetir diagnóstico de credencial sem nova evidência.

Nunca exibir:
- Access Token;
- webhook secret;
- service role;
- .env.local.

## CLIENTE MERCADO PAGO — LOG DE REDE

lib/mercado-pago/client.ts foi instrumentado para preservar causa de falhas de fetch:

- código;
- mensagem;

sem imprimir:
- token;
- Authorization;
- headers secretos.

Build após instrumentação:

APROVADO.

## PLANO MERCADO PAGO CRIADO ISOLADAMENTE

Foi explicitamente autorizada a criação isolada de um preapproval_plan no ambiente de TESTE.

POST:

https://api.mercadopago.com/preapproval_plan

Resultado:

HTTP 201

Plano criado:

id:
5347a37a3e894606ac86542a5d402acb

reason:
Black Navalha - Plano Mensal

status:
active

valor:
R$ 150,00

moeda:
BRL

frequência:
1 month

back_url:
URL Cloudflare temporária da sessão + /assinaturas

Nenhum pagamento foi realizado.

Nenhuma cobrança real foi realizada.

## VÍNCULO DO PLANO INTERNO

Foi explicitamente autorizada a vinculação do plano Mercado Pago ao plano interno.

Plano interno:

id:
27fcd639-ddb5-43ab-8ddc-3fd141424fb5

name:
Plano Mensal

price:
150.00

Foi atualizado:

subscription_plans.mercado_pago_preapproval_plan_id

para:

5347a37a3e894606ac86542a5d402acb

UPDATE retornou exatamente uma linha.

A migration 012 já previa essa coluna.

Nenhuma migration nova foi criada para esse vínculo.

## PREAPPROVAL — HTTP 400

Depois do vínculo do plano, nova tentativa da aplicação avançou para:

POST /preapproval

Mercado Pago respondeu:

HTTP 400

A rota foi instrumentada para registrar MercadoPagoApiError com:

- message;
- status;
- body;

sem segredos.

Build:

APROVADO.

O hold utilizado posteriormente expirou normalmente.

Não forçar/reabrir hold expirado.

## TESTES ISOLADOS DE PREAPPROVAL

Com autorização existente para testes de preapproval em TESTE, foram realizados testes isolados sem criar novos holds internos.

Payloads incompletos/minimamente ampliados para /preapproval retornaram:

HTTP 400

Um retorno capturado foi:

{"message":"Parameters passed are invalid","status":400}

Nenhum pagamento foi realizado.

## DOCUMENTAÇÃO ATUAL INSPECIONADA

Foi consultada diretamente a referência atual do Mercado Pago para:

POST https://api.mercadopago.com/preapproval

A documentação mostrou:

preapproval_plan_id:
identificador do plano associado.

external_reference:
referência para sincronização com o sistema.
A documentação informa que é obrigatória para assinaturas sem plano associado.

payer_email:
OBRIGATÓRIO.

card_token_id:
aparece marcado como obrigatório na referência exibida.

auto_recurring:
configuração recorrente.

back_url:
OBRIGATÓRIO na referência exibida.

status:
pode ser pending ou authorized.

Definição exibida:

pending:
assinatura sem método de pagamento, aguardando por um meio de pagamento até que o cliente acesse o checkout.

authorized:
assinatura com método de pagamento.

A documentação apresenta aparente tensão entre card_token_id marcado como obrigatório e a descrição de status pending sem método de pagamento.

NÃO inventar comportamento além do confirmado.

## TESTE DE INTEGRAÇÃO — DOCUMENTAÇÃO

Foi aberta:

Assinaturas
→ Teste de integração
→ Teste de compra

Orientação atual exibida pelo Mercado Pago:

1. acessar o próprio site e buscar o produto/serviço;
2. realizar o fluxo de compra;
3. no pagamento inserir cartão de crédito de teste;
4. inserir os dados do usuário de teste;
5. confirmar a compra.

Nenhum pagamento de teste foi realizado ainda.

## CONTAS DE TESTE

As contas:

Black Navalha - Vendedor
Black Navalha - Comprador

continuam existentes.

O painel atual das contas de teste mostra:

- User ID;
- Usuário TESTUSER...;
- senha;
- código de verificação.

Não apresenta um campo de e-mail da conta.

A edição da conta de teste também não apresentou e-mail.

Não inventar e-mail associado à conta de teste.

Não enviar senha ao chat.

## CHECKOUT HOSPEDADO DO PREAPPROVAL_PLAN — VALIDADO

O POST /preapproval_plan bem-sucedido retornou init_point oficial:

https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=5347a37a3e894606ac86542a5d402acb

Esse init_point foi aberto manualmente, SEM pagamento.

Resultado visual confirmado:

- checkout oficial Mercado Pago;
- Black Navalha - Plano Mensal;
- R$ 150;
- cobrança mensal;
- botão Escolher meio de pagamento.

A tela exibiu o comprador logado e informou que nome/e-mail seriam compartilhados com o vendedor.

Nenhum meio de pagamento foi escolhido.

Nenhum cartão foi informado.

Nenhum pagamento foi confirmado.

Portanto está comprovado que:

preapproval_plan.init_point

abre corretamente o checkout hospedado da assinatura.

## DECISÃO AINDA NÃO TOMADA

Ainda NÃO alterar a aplicação para simplesmente redirecionar ao init_point do plano.

Motivo:

a arquitetura interna exige correlação segura entre:

subscription_charge.id

e o preapproval/pagamento criado pelo Mercado Pago.

O init_point atual contém apenas:

preapproval_plan_id

e não está comprovado que aceite/preserve:

external_reference = subscription_charge.id

Não aceitar correlação frágil apenas por e-mail.

Precisamos preservar:

- idempotência;
- concorrência;
- charge correta;
- barbeiro correto;
- plano correto;
- hold correto;
- webhook correto.

## PRÓXIMO PASSO EXATO

Antes de alterar código ou realizar pagamento:

investigar SOMENTE como correlacionar com segurança o preapproval criado através do checkout hospedado de:

preapproval_plan.init_point

com nosso:

subscription_charge.id

Verificar na documentação atual:

- se o checkout do preapproval_plan aceita external_reference;
- se existe parâmetro oficial de referência na URL;
- se o preapproval criado pelo checkout preserva alguma referência configurável;
- quais campos podem ser usados para correlação determinística.

Não aceitar apenas e-mail como correlação.

Não criar novo checkout interno durante essa investigação.

Não realizar novo POST de preapproval por tentativa e erro.

Não realizar pagamento ainda.

## ARQUITETURA QUE CONTINUA OBRIGATÓRIA

cliente
→ plano interno
→ barbeiro
→ capacidade
→ SELECT ... FOR UPDATE
→ hold 15 minutos
→ subscription_charge pending
→ Mercado Pago TESTE
→ webhook autenticado
→ consulta server-side ao Mercado Pago
→ correlação segura com charge interna
→ payment.status = approved
→ RPC transacional/idempotente
→ assinatura/ciclo
→ comissão apenas futuramente.

Browser NÃO confirma pagamento.

Redirect NÃO confirma pagamento.

## WEBHOOK

Quick Tunnel utilizado nesta sessão:

https://ware-pairs-insider-rebel.trycloudflare.com

Webhook de teste configurado:

https://ware-pairs-insider-rebel.trycloudflare.com/api/mercado-pago/webhook

GET externo:

HTTP 405

esperado.

Evento:

Planos e assinaturas.

A URL é temporária e NÃO deve ser presumida válida em nova sessão.

MERCADO_PAGO_WEBHOOK_SECRET permanece salvo localmente.

Não exibir.

## REGRAS FINANCEIRAS PRESERVADAS

Capacidade:

30 assinantes por barbeiro.

Hold:

15 minutos.

Carência após ciclo pago:

2 dias.

Não confundir hold com carência.

Cronômetro:

baseado em reservation_expires_at.

Comissão:

percentual NÃO definido.

Não criar comissão.

## BANCO

Migrations 007–013 já aplicadas.

NÃO reaplicar.

RPC:

confirm_mercado_pago_subscription_payment

permanece responsável pelo processamento transacional/idempotente após confirmação server-side válida.

Ela NÃO cria comissão.

## CÓDIGO LOCAL ALTERADO E AINDA NÃO VERSIONADO NESTA CONTINUIDADE

Alterados pelo trabalho atual:

- app/api/assinaturas/mercado-pago/route.ts
- lib/mercado-pago/subscriptions.ts
- lib/mercado-pago/client.ts
- CONTEXTO-PROJETO.md

.env.local também foi atualizado localmente, mas nunca deve ser versionado.

## BUILD

Últimos builds após alterações:

APROVADOS.

Next.js:
16.3.4

TypeScript:
sem erros.

## GIT / SEGURANÇA

Referência versionada:

741d528 Implementa base server-side do Mercado Pago

CONTEXTO-PROJETO.md já possuía alteração local e continua não commitado.

Não versionar:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## FORMA DE TRABALHO

Evitar andar em círculos.

Não consumir novos holds/checkouts para cada diagnóstico.

Preferir testes isolados quando seguros.

Corrigir apenas causas comprovadas.

Interromper para:
- operação destrutiva;
- decisão financeira;
- nova credencial;
- alteração relevante de banco;
- commit/push.

# FIM DO CHECKPOINT INTERMEDIÁRIO — 2026-09-13

---

# CHECKPOINT DE DIREÇÃO PRIORITÁRIA — MERCADO PAGO / PAGAMENTO MENSAL AVULSO VIA PIX — 2026-09-13

## PRIORIDADE ABSOLUTA

ESTE CHECKPOINT ALTERA A DIREÇÃO DE PRODUTO DO PAGAMENTO E TEM PRIORIDADE SOBRE OS CHECKPOINTS ANTERIORES ONDE HOUVER CONFLITO.

Preservar integralmente tudo que continua válido nos checkpoints anteriores, especialmente:

- capacidade e concorrência;
- hold;
- carência;
- estruturas financeiras internas;
- webhook autenticado/idempotente;
- integração de benefícios com /agendar;
- segurança;
- Git;
- migrations já aplicadas.

NÃO reiniciar o projeto.

NÃO repetir diagnósticos já concluídos.

## CORREÇÃO FUNDAMENTAL DE PRODUTO

Foi esclarecido pelo responsável que:

"Plano Mensal" NÃO significa que o Mercado Pago deve cobrar automaticamente todos os meses.

O produto desejado é:

PAGAMENTO MENSAL AVULSO COM RENOVAÇÃO VOLUNTÁRIA.

Fluxo comercial correto:

cliente
→ escolhe Plano Mensal
→ escolhe barbeiro
→ reserva capacidade
→ realiza UM pagamento de R$ 150
→ Mercado Pago confirma server-side
→ Black Navalha libera os benefícios pelo ciclo mensal pago
→ ao final do ciclo o cliente decide se quer comprar/renovar outro mês.

NÃO deve existir débito recorrente automático como requisito do produto atual.

O cliente NÃO deve ser obrigado a manter renovação automática.

A renovação futura será uma NOVA contratação/cobrança voluntária.

## CONSEQUÊNCIA PARA O MERCADO PAGO

A API de Assinaturas recorrentes baseada em:

- preapproval_plan;
- preapproval;
- card_token_id;
- cobrança automática;

NÃO é mais a direção principal da integração.

O trabalho anterior não foi inútil porque confirmou API, autenticação, webhook, infraestrutura, idempotência e comportamento do Mercado Pago, mas o fluxo recorrente não atende à regra comercial agora esclarecida.

O novo objetivo é:

PAGAMENTO AVULSO MERCADO PAGO

começando por:

PIX.

A integração deve utilizar a API/produto ATUAL do Mercado Pago apropriado para pagamento PIX avulso.

Antes de implementar, confirmar na documentação oficial atual o endpoint e contrato vigentes.

NÃO presumir endpoint/SDK antigo.

## PIX — OBJETIVO

Primeira forma de pagamento a ser implementada:

PIX.

Fluxo esperado:

/assinaturas
→ pré-checkout interno
→ subscription_charge pending
→ hold de 15 minutos
→ criação de pagamento PIX Mercado Pago
→ QR Code / copia e cola disponibilizado ao cliente
→ cliente paga em ambiente de TESTE
→ Mercado Pago envia notificação
→ backend autentica webhook
→ backend consulta pagamento diretamente no Mercado Pago
→ somente pagamento approved avança
→ valida external_reference, valor e moeda
→ processamento transacional/idempotente
→ assinatura active
→ subscription_cycle paid
→ hold consumed
→ benefícios liberados.

O navegador NÃO confirma pagamento.

QR Code exibido ou retorno visual NÃO confirma pagamento.

## RENOVAÇÃO

Ao encerrar o ciclo pago:

- não cobrar automaticamente;
- cliente escolhe se deseja renovar;
- renovação gera nova cobrança avulsa;
- pagamento confirmado gera novo ciclo;
- regras de capacidade/barbeiro já definidas continuam aplicáveis.

A carência existente de 2 dias continua sendo regra INTERNA de capacidade após ciclo pago.

Ela não representa tolerância de pagamento do Mercado Pago e não cria cobrança automática.

## CAPACIDADE

Preservar:

30 assinantes por barbeiro.

Preservar obrigatoriamente:

SELECT ... FOR UPDATE

nas operações de capacidade.

Hold:

15 minutos.

Carência após ciclo pago:

2 dias.

NÃO confundir hold e carência.

## PREÇO

Plano Mensal:

R$ 150,00

O banco interno continua sendo autoridade sobre o preço comercial através de subscription_plans.

Não confiar no valor enviado pelo navegador.

services.price = 0 nos serviços subscriber_service continua significando benefício incluído no plano, não gratuidade pública.

## ESTRUTURA FINANCEIRA INTERNA

Preservar:

subscription_charges
subscription_cycles
payment_events
subscription_capacity_reservations
subscriptions
subscription_services

Essas estruturas foram desenhadas de forma suficientemente genérica para pagamento por gateway.

subscription_charges já possui campos como:

provider
provider_charge_id
external/idempotency concepts já implementados no fluxo

e deve continuar sendo a cobrança interna autoritativa.

Estados financeiros existentes permanecem:

pending
paid
failed
cancelled
expired
refunded
partially_refunded

Não colocar estado financeiro inadequadamente em subscriptions.status.

## RPC DE CONFIRMAÇÃO

Existe:

confirm_mercado_pago_subscription_payment

Ela implementa processamento transacional/idempotente da confirmação já validada server-side.

Ela:

- bloqueia charge;
- protege capacidade;
- cria/localiza customer;
- cria/reutiliza assinatura;
- cria ciclo paid;
- ativa assinatura;
- copia benefícios;
- consome hold;
- marca charge paid;
- não cria comissão.

Antes de reutilizá-la para PIX, verificar SOMENTE o contrato necessário para saber se ela depende semanticamente de preapproval_id ou se aceita provider_charge_id genérico do Mercado Pago.

NÃO reinspecionar schema geral/migrations sem necessidade.

Se adaptação for necessária para pagamento PIX, fazer a menor alteração possível e versionar SQL.

## COMISSÃO

Continua NÃO DEFINIDA.

NÃO inventar percentual.

PIX aprovado também NÃO deve criar comissão enquanto a regra financeira não estiver definida.

## WEBHOOK

Webhook server-side já existe:

/api/mercado-pago/webhook

A infraestrutura existente de:

- x-signature;
- x-request-id;
- HMAC SHA-256;
- payment_events;
- idempotência;

deve ser reaproveitada quando compatível com o evento de PAGAMENTO PIX atual.

O webhook atual foi escrito inicialmente para:

subscription_preapproval
subscription_authorized_payment

e precisará ser estendido/adaptado para o tópico de pagamento atual do Mercado Pago, SOMENTE depois de confirmar a documentação vigente para pagamentos PIX.

Não remover a segurança existente.

Para PIX, após notificação:

consultar o recurso de pagamento diretamente na API Mercado Pago.

Somente:

status = approved

pode liberar o ciclo, após validação interna de:

- external_reference;
- provider/payment id;
- currency;
- transaction_amount;
- charge interna correta.

## CORRELAÇÃO

Para a nova cobrança PIX, usar sempre que suportado oficialmente:

external_reference = subscription_charge.id

Isso fornece correlação determinística entre pagamento Mercado Pago e cobrança interna.

Não correlacionar apenas por:

- e-mail;
- nome;
- telefone.

Idempotência deve continuar obrigatória.

## CRONÔMETRO

Preservar:

15:00 → 00:00

baseado exclusivamente em:

reservation_expires_at

retornado pelo servidor.

O pagamento deve respeitar a estratégia de capacidade/hold.

Não criar timer independente.

## AUTENTICAÇÃO MERCADO PAGO — RESOLVIDA

MERCADO_PAGO_ACCESS_TOKEN de TESTE está correto em .env.local.

Teste isolado confirmado:

GET /preapproval/search?limit=1
→ HTTP 200

Não repetir diagnóstico da credencial sem nova evidência.

O erro anterior:

UND_ERR_INVALID_ARG invalid Authorization header

ocorreu porque inicialmente havia valor incorreto na variável.

Depois houve HTTP 403 porque o segredo de Webhook havia sido colocado por engano como Access Token.

Isso foi corrigido.

NÃO voltar a investigar esse ponto sem nova evidência.

## PREAPPROVAL_PLAN CRIADO DURANTE INVESTIGAÇÃO

Foi criado em TESTE:

preapproval_plan_id:
5347a37a3e894606ac86542a5d402acb

Plano:

Black Navalha - Plano Mensal
R$ 150
mensal

Foi vinculado ao plano interno em:

subscription_plans.mercado_pago_preapproval_plan_id

Esse recurso não será usado como base do novo fluxo PIX enquanto a direção for pagamento mensal avulso.

NÃO é necessário apagá-lo agora.

Não realizar operação destrutiva apenas para limpeza.

A coluna criada pela migration 012 também pode permanecer.

## DESCOBERTA SOBRE /preapproval

Teste isolado atual confirmou:

POST /preapproval
com status pending e sem cartão

→ HTTP 400

Mensagem exata:

card_token_id is required

Portanto não insistir em /preapproval sem cartão.

Checkout hospedado do preapproval_plan também foi validado visualmente, mas deixou problema de correlação com external_reference e, principalmente, corresponde à direção de assinatura recorrente que não é mais requisito do produto.

Não continuar investigando preapproval enquanto estivermos implementando PIX avulso.

## NENHUM PAGAMENTO REALIZADO

Até este checkpoint:

- nenhum pagamento de teste foi concluído;
- nenhuma cobrança real foi realizada;
- nenhum cartão foi informado;
- nenhum PIX foi pago;
- nenhuma assinatura foi ativada pela integração Mercado Pago;
- nenhum ciclo paid foi criado por pagamento Mercado Pago;
- nenhuma comissão foi criada.

## CLOUDFLARE / WEBHOOK

Último Quick Tunnel usado:

https://ware-pairs-insider-rebel.trycloudflare.com

Webhook:

https://ware-pairs-insider-rebel.trycloudflare.com/api/mercado-pago/webhook

GET externo:

HTTP 405

esperado.

URL TEMPORÁRIA.

Não presumir válida em sessão futura.

No próximo chat, criar novo Quick Tunnel somente quando realmente necessário para teste de webhook.

## VARIÁVEIS LOCAIS

.env.local contém configuração server-side necessária, incluindo credenciais secretas.

NUNCA exibir ou versionar.

MERCADO_PAGO_ACCESS_TOKEN:
válido atualmente.

MERCADO_PAGO_WEBHOOK_SECRET:
armazenado localmente.

SUPABASE_SERVICE_ROLE_KEY:
permanece secreta.

MERCADO_PAGO_BACK_URL:
foi adicionada para o fluxo de preapproval e pode não ser necessária no futuro fluxo PIX.

Não removê-la precipitadamente; revisar somente quando a implementação PIX estiver definida.

## CÓDIGO LOCAL MODIFICADO E AINDA NÃO VERSIONADO

Estado antes deste checkpoint:

M CONTEXTO-PROJETO.md
M app/api/assinaturas/mercado-pago/route.ts
M lib/mercado-pago/client.ts
M lib/mercado-pago/subscriptions.ts
?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

As alterações atuais incluem:

- correção UUID_PATTERN;
- suporte a back_url no preapproval_plan;
- diagnóstico seguro de fetch;
- logging detalhado de MercadoPagoApiError.

NÃO descartar automaticamente essas alterações.

Ao migrar para PIX, revisar quais continuam úteis e quais ficaram específicas do fluxo recorrente antes do commit.

## GIT

Referência versionada:

741d528 Implementa base server-side do Mercado Pago

Não versionar:

ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt
.env.local

Nunca usar:

git add .

Staging somente com caminhos explícitos.

COMMIT/PUSH CONTINUAM EXIGINDO AUTORIZAÇÃO EXPLÍCITA.

## Migrations

007–013 já aplicadas.

NÃO reaplicar.

Nova alteração REAL de banco deve ser versionada no próximo número disponível.

Não alterar banco por conveniência sem necessidade técnica comprovada.

## /AGENDAR

NÃO ALTERAR:

/agendar
create_public_multi_appointment
integração existente de benefício das assinaturas.

Quando assinatura/ciclo forem ativados corretamente pelo pagamento, a integração existente deve continuar concedendo os benefícios como já funciona hoje.

## AUTORIZAÇÃO OPERACIONAL AMPLIADA — 2026-09-13

O responsável autorizou maior autonomia técnica para acelerar o desenvolvimento e evitar microinterrupções.

Está autorizado, quando tecnicamente necessário e seguro:

- investigar documentação oficial atual;
- criar/alterar arquivos de aplicação;
- criar Route Handlers;
- criar utilitários server-side;
- refatorar código relacionado à integração;
- adicionar validações;
- adicionar logs seguros;
- adicionar testes;
- utilizar fetch/API REST;
- instalar/adicionar dependência técnica realmente necessária quando trouxer benefício concreto;
- utilizar ferramentas locais de desenvolvimento;
- utilizar túnel HTTPS temporário;
- trabalhar em blocos maiores;
- escolher detalhes técnicos reversíveis;
- remover código local recém-criado que tenha ficado obsoleto pela mudança PIX, desde que não envolva dado/banco e seja claramente parte da integração em andamento.

Continuam exigindo interrupção/autorização específica:

- operação destrutiva sobre dados reais;
- nova credencial/segredo;
- cobrança real;
- decisão financeira não definida;
- alteração de banco de risco ou não claramente necessária;
- commit;
- push.

Nenhuma autorização genérica deve ser interpretada como autorização para expor segredos ou realizar cobrança real.

## FORMA DE TRABALHO

Priorizar resultado funcional.

Evitar microdiagnósticos quando um teste isolado conclusivo puder responder.

Evitar consumir checkout/hold repetidamente para investigar problemas externos.

Quando execução local for necessária:

- fornecer UM comando PowerShell completo;
- indicar claramente se é Terminal VS Code ou PowerShell do Windows;
- usar npm.cmd;
- preferir Set-Content para arquivos completos quando apropriado.

Trabalhar em blocos/lotes maiores quando seguro.

## PRÓXIMO PASSO EXATO — NOVO CHAT

1. Ler integralmente CONTEXTO-PROJETO.md.
2. Priorizar este checkpoint.
3. NÃO retomar preapproval/recorrência automática.
4. NÃO criar novo checkout inicialmente.
5. Consultar somente a documentação oficial ATUAL necessária do Mercado Pago para PAGAMENTO PIX AVULSO.
6. Confirmar endpoint/API vigente, payload e resposta para PIX.
7. Confirmar tópico atual de Webhook de pagamento e consulta server-side do payment.
8. Planejar o menor reaproveitamento da infraestrutura existente.
9. Usar:
   external_reference = subscription_charge.id
   quando oficialmente suportado.
10. Reaproveitar hold, cronômetro, capacidade e subscription_charge pending.
11. Verificar apenas o contrato mínimo da RPC confirm_mercado_pago_subscription_payment antes de reutilizá-la.
12. Implementar PIX server-side.
13. Exibir QR Code e PIX copia e cola no fluxo público.
14. Implementar/ajustar webhook de payment antes de qualquer pagamento.
15. npm.cmd run build.
16. Criar novo Cloudflare Quick Tunnel somente quando chegar ao teste do webhook.
17. Configurar evento de pagamento no Webhook de TESTE conforme painel/documentação atual.
18. Criar UMA nova contratação de TESTE.
19. Criar PIX de TESTE.
20. Validar QR/copia e cola.
21. Somente depois realizar pagamento de TESTE, nunca real.
22. Auditar:
    subscription_charge;
    payment_events;
    subscription;
    subscription_cycle;
    hold.
23. Confirmar idempotência.
24. Confirmar ausência de comissão.

## NOVO FLUXO-ALVO

Plano Mensal interno
→ R$ 150
→ escolha do barbeiro
→ capacidade protegida com FOR UPDATE
→ hold 15 minutos
→ subscription_charge pending
→ pagamento PIX avulso Mercado Pago
→ external_reference = charge.id
→ QR Code / copia e cola
→ webhook autenticado
→ GET payment server-side
→ validar approved + referência + valor + moeda
→ RPC transacional/idempotente
→ assinatura ativa pelo ciclo mensal pago
→ benefícios existentes em /agendar
→ fim do ciclo
→ cliente escolhe voluntariamente se deseja renovar.

SEM RENOVAÇÃO AUTOMÁTICA DO MERCADO PAGO.

# FIM DO CHECKPOINT DE DIREÇÃO PRIORITÁRIA — 2026-09-13
---
# CHECKPOINT FINAL DA SESSÃO — MERCADO PAGO / PIX AVULSO VIA ORDERS API — 2026-09-13
PRIORIDADE ABSOLUTA: este é o checkpoint mais recente. Plano Mensal continua sendo pagamento avulso de R$ 150 via PIX, sem recorrência automática.
Documentação oficial atual confirmada: Orders API. Criar PIX: POST /v1/orders. Consultar server-side: GET /v1/orders/{id}. Webhook: Order (Mercado Pago). external_reference = subscription_charge.id.
PIX confirmado na documentação com payment_method.id=pix, type=bank_transfer, ticket_url, qr_code e qr_code_base64. Estado inicial documentado: action_required/waiting_transfer. Exemplo concluído: processed/accredited.
Implementação local migrada de preapproval para Orders PIX. provider_charge_id representa Order ID ORD. UI preparada para QR Code/Copia e Cola. Webhook valida assinatura, faz GET da Order e só depois pode chamar a RPC transacional/idempotente.
RPC confirm_mercado_pago_subscription_payment verificada: provider_charge_id é texto genérico e pode receber Order ID. RPC continua sem comissão.
Hold alterado de 15 para 30 minutos para alinhar ao mínimo do PIX. Order usa expiration_time=PT30M. Carência pós-ciclo continua 2 dias. SELECT ... FOR UPDATE preservado.
Migration 014-align-pix-checkout-hold.sql criada e APLICADA: Success. No rows returned. NÃO reaplicar.
Migration 015-service-role-subscription-charges-update.sql criada após erro 42501 de UPDATE e APLICADA: Success. No rows returned. NÃO reaplicar.
Builds da implementação PIX: APROVADOS.
Webhook TESTE configurado no Mercado Pago com Order (Mercado Pago). Planos e assinaturas e Pagamentos legacy ficaram desmarcados.
Quick Tunnel da sessão: https://seasons-edward-lover-bottle.trycloudflare.com . É TEMPORÁRIO e não deve ser reutilizado automaticamente amanhã.
Primeiro erro PIX comprovado: HTTP 400 invalid_email_for_sandbox. Mercado Pago exige email contendo @testuser.com no sandbox.
Teste seguinte utilizou Teste Black Navalha / (41) 99999-9999 / blacknavalha@testuser.com.
Após migration 015 foi feita nova tentativa de GERAR PIX e a UI ainda retornou: Não foi possível gerar o Pix. O erro server-side DESSA ÚLTIMA tentativa NÃO foi coletado.
PRÓXIMO PASSO EXATO: amanhã NÃO criar checkout e NÃO clicar GERAR PIX inicialmente. Primeiro ler a linha mais recente de .next/dev/logs/next-development.log contendo mercado pago pix creation error. Diagnosticar somente a falha pós-015.
Depois corrigir somente a causa comprovada, buildar e continuar com uma tentativa controlada. Antes de pagar auditar charge pending, provider, ORD, GET Order, external_reference, R, BRL, PAY, status, QR e hold.
Nenhum PIX foi pago. Nenhum pagamento de teste foi concluído. Nenhuma cobrança real. Nenhuma ativação/ciclo Mercado Pago. Nenhuma comissão.
Migrations 007–015 estão aplicadas e NÃO devem ser reaplicadas.
MERCADO_PAGO_ACCESS_TOKEN de TESTE está válido. Nunca pedir/imprimir Access Token, webhook secret, service role ou .env.local.
Não alterar /agendar, create_public_multi_appointment ou integração existente de benefícios.
Não versionar ASSINATURAS-LOTE.txt, CODIGO-COMPLETO.txt ou .env.local. Nunca usar git add . Commit/push somente com autorização explícita.
Referência Git versionada: 741d528 Implementa base server-side do Mercado Pago.
GIT STATUS AO ENCERRAR:  M CONTEXTO-PROJETO.md;  M app/api/assinaturas/mercado-pago/route.ts;  M app/api/mercado-pago/webhook/route.ts;  M app/assinaturas/subscription-checkout-form.tsx;  M lib/mercado-pago/client.ts;  M lib/mercado-pago/subscriptions.ts; ?? ASSINATURAS-LOTE.txt; ?? CODIGO-COMPLETO.txt; ?? supabase/sql/014-align-pix-checkout-hold.sql; ?? supabase/sql/015-service-role-subscription-charges-update.sql
# FIM DO CHECKPOINT — 2026-09-13


---

# CHECKPOINT INTERMEDIÁRIO — MERCADO PAGO / PIX ORDERS APROVADO NO SANDBOX / WEBHOOK 401 — 2026-09-15

## PRIORIDADE

Este é o checkpoint mais recente da integração Mercado Pago e deve ter PRIORIDADE ABSOLUTA quando houver conflito com checkpoints anteriores.

A direção de produto permanece:

Plano Mensal = pagamento mensal AVULSO de R$ 150 via PIX.

SEM renovação automática.

NÃO retomar preapproval/preapproval_plan como fluxo principal.

NÃO insistir em card_token_id.

## FLUXO MERCADO PAGO ATUAL

Integração atual:

Checkout API via Orders API.

Criação:

POST /v1/orders

Consulta server-side:

GET /v1/orders/{id}

PIX:

payment_method.id = pix
payment_method.type = bank_transfer

Correlação:

external_reference = subscription_charge.id

provider_charge_id representa o Order ID ORD...

Payment ID utiliza PAY...

O navegador NÃO confirma pagamento.

## CORREÇÃO DO ERRO PÓS-MIGRATION 015

Foi finalmente correlacionada a última tentativa registrada após a migration 015.

Charge:

32425d24-1368-4f30-a6f4-73afef358347

Foi confirmado por consulta somente-leitura que o e-mail gravado nessa charge possuía domínio:

gmail.com

A Orders API em sandbox retornou:

HTTP 400
invalid_email_for_sandbox

Mensagem do Mercado Pago indicou que o sandbox exige e-mail contendo:

@testuser.com

Portanto a causa pós-015 foi comprovada:

a tentativa utilizou e-mail incompatível com o sandbox.

NÃO rediagnosticar Access Token.

MERCADO_PAGO_ACCESS_TOKEN de TESTE continua válido.

## PRIMEIRA ORDER PIX VALIDADA

Foi criada posteriormente uma Order PIX com e-mail de teste válido.

A auditoria server-side confirmou:

- subscription_charge pending;
- amount = 150;
- currency = BRL;
- provider = mercado_pago;
- provider_charge_id = ORDTST...;
- GET /v1/orders/{id} = HTTP 200;
- external_reference = subscription_charge.id;
- Payment PAY...;
- Order action_required / waiting_transfer;
- Payment action_required / waiting_transfer;
- payment_method.id = pix;
- payment_method.type = bank_transfer;
- QR Code presente;
- qr_code_base64 presente;
- ticket_url presente;
- hold = held;
- hold exatamente 30 minutos;
- subscription_id = null;
- cycle_id = null;
- paid_at = null.

Nenhum pagamento real foi realizado.

## CORREÇÃO DO PARSER DE MOEDA

A resposta REAL da Orders API mostrou:

currency = BRL

e não:

currency_id = BRL

O parser local lia somente:

response.currency_id

e produzia currency = null.

Isso faria o webhook rejeitar uma Order válida depois do pagamento.

Foi corrigido em:

lib/mercado-pago/subscriptions.ts

para usar:

response.currency

com fallback para:

response.currency_id

Build após a correção:

APROVADO.

## MIGRATION 016 — PAYMENT_EVENTS

Durante a auditoria foi comprovado:

42501
permission denied for table payment_events

ao utilizar service_role para SELECT.

A migration 007 havia criado payment_events e habilitado RLS, mas não havia concedido explicitamente os privilégios necessários ao service_role.

Foi autorizada, criada e APLICADA:

supabase/sql/016-service-role-payment-events.sql

Conteúdo funcional:

GRANT SELECT, INSERT, UPDATE
ON public.payment_events
TO service_role;

Não foi concedido DELETE.

Não foi concedido acesso adicional para anon/authenticated.

Validação após aplicação:

PAYMENT_EVENTS_SELECT=OK

NÃO reaplicar a migration 016.

Migrations 007–016 estão aplicadas.

NÃO reaplicar nenhuma delas.

## CLOUDFLARE / WEBHOOK DE TESTE

Quick Tunnel funcional atual:

https://pentium-florists-char-blanket.trycloudflare.com

Webhook:

https://pentium-florists-char-blanket.trycloudflare.com/api/mercado-pago/webhook

Validação externa:

HTTP 405

esperado para GET porque a Route Handler implementa POST.

O painel Mercado Pago foi atualizado em Modo de teste para essa URL.

Evento mantido:

Order (Mercado Pago)

Planos e assinaturas:

desmarcado.

Pagamentos legacy:

desmarcado.

A URL é TEMPORÁRIA.

Não presumir que continuará válida em sessão futura.

MERCADO_PAGO_WEBHOOK_SECRET continua existente localmente.

Não regenerar sem necessidade.

Nunca exibir seu valor.

## TESTE PIX OFICIAL — APRO

Foi localizada na documentação oficial atual do Mercado Pago a seção:

Realizar compra de teste com Pix

A documentação informa que o teste de Pix via Orders deve utilizar valores predefinidos.

Para cenário de aprovação:

payer.first_name = "APRO"

A documentação informa que a Order inicialmente retorna:

action_required / waiting_transfer

e depois o pagamento é atualizado automaticamente para aprovado.

Portanto NÃO é necessário e NÃO se deve utilizar banco real para pagar o QR de sandbox.

## IMPLEMENTAÇÃO DO MODO DE TESTE

Foi implementado suporte opcional a:

payerFirstName

em:

lib/mercado-pago/subscriptions.ts

A criação da Order envia first_name somente quando fornecido.

Em:

app/api/assinaturas/mercado-pago/route.ts

foi implementado:

MERCADO_PAGO_TEST_MODE === "true"
→ payerFirstName = "APRO"

Caso contrário:

first_name não é enviado.

Foi adicionada localmente em .env.local:

MERCADO_PAGO_TEST_MODE=true

Essa variável não é segredo, mas .env.local inteiro continua proibido de exibição/versionamento.

O objetivo é impedir que APRO seja enviado acidentalmente em produção.

Build após essa implementação:

APROVADO.

next dev foi reiniciado para carregar a variável.

## ORDER APRO — RESULTADO

Foi criada UMA nova contratação/Order de TESTE usando o cenário oficial APRO.

Charge:

d4235514-6fa8-4106-be1d-448f377a6853

Order:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

Payment:

PAY01M2HZ39VQC7KHXPM1SDN3WJJX

Após aguardar sem pagar nada e sem utilizar banco real, GET server-side confirmou:

Order:
processed / accredited

Payment:
processed / accredited

amount:
150.00

paid_amount:
150.00

currency:
BRL

external_reference:
d4235514-6fa8-4106-be1d-448f377a6853

Portanto o sandbox APRO funcionou corretamente.

Nenhuma transferência bancária real foi realizada.

## ESTADO INTERNO APÓS APRO

Apesar da Order Mercado Pago estar:

processed / accredited

o estado interno permaneceu:

subscription_charge = pending
subscription_id = null
cycle_id = null
paid_at = null
hold = held

payment_events:

vazio para essa tentativa.

Portanto a confirmação financeira interna NÃO ocorreu.

Isso é correto enquanto o webhook não for autenticado/processado.

NÃO chamar a RPC manualmente apenas para contornar o webhook.

## WEBHOOK AUTOMÁTICO

Após a atualização automática APRO, não foi encontrado POST do Mercado Pago nos logs locais.

Nenhum payment_event foi criado.

Para testar o endpoint foi utilizada a ferramenta oficial:

Webhooks
→ Simular notificação

Evento:

Order (Mercado Pago)

Data ID utilizado:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

O simulador enviou:

type = order
action = order.processed

A resposta do nosso endpoint foi:

401 Unauthorized

Descrição do painel:

faltam credenciais válidas de autenticação.

Portanto a requisição chegou ao endpoint, mas foi rejeitada pela validação de x-signature antes do processamento financeiro.

Nenhum estado financeiro interno foi alterado pela simulação.

## WEBHOOK — IMPLEMENTAÇÃO ATUAL

Arquivo:

app/api/mercado-pago/webhook/route.ts

O webhook:

- lê x-signature;
- lê x-request-id;
- obtém data.id;
- valida assinatura antes de processar;
- aceita somente type = order;
- grava payment_events;
- consulta GET /v1/orders/{id};
- ignora o body como autoridade financeira;
- exige Order processed/accredited;
- exige Payment processed/accredited;
- valida external_reference;
- valida provider/order;
- valida valor;
- valida moeda;
- valida PIX/bank_transfer;
- chama confirm_mercado_pago_subscription_payment;
- atualiza payment_events.

A arquitetura permanece correta:

o navegador e o body do webhook NÃO são autoridade financeira.

## BLOQUEIO ATUAL — X-SIGNATURE

Arquivo:

lib/mercado-pago/webhook-signature.ts

Implementação atual confirmada antes da última proposta de alteração:

manifest:

id:${dataId};request-id:${requestId};ts:${parts.ts};

HMAC SHA-256 com:

MERCADO_PAGO_WEBHOOK_SECRET

comparação timing-safe.

A simulação oficial retornou 401.

Precisamos diagnosticar especificamente a validação de assinatura.

Hipóteses atuais incluem:

- canonicalização de data.id;
- correspondência do segredo local com a configuração de Webhook atual;
- formato real dos headers enviados pelo simulador.

IMPORTANTE:

Foi PROPOSTO alterar dataId para lowercase na construção do manifesto porque Orders utiliza ID alfanumérico em maiúsculas e a documentação do Mercado Pago possui regras de canonicalização.

Porém, no momento deste checkpoint, NÃO foi confirmado que esse comando tenha sido executado.

Portanto, antes de qualquer nova alteração, verificar o estado real de:

lib/mercado-pago/webhook-signature.ts

e NÃO presumir que dataId.toLowerCase() já esteja aplicado.

Não regenerar o Webhook secret sem evidência.

Não exibir:

x-signature completo;
MERCADO_PAGO_WEBHOOK_SECRET;
MERCADO_PAGO_ACCESS_TOKEN;
SUPABASE_SERVICE_ROLE_KEY;
.env.local.

## NÃO CRIAR NOVA ORDER

A Order de sandbox:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

já está processed/accredited e serve como recurso real para continuar testando o webhook.

NÃO criar novo checkout/hold/PIX para diagnosticar x-signature.

Usar a ferramenta de simulação com essa mesma Order somente depois de corrigir/validar a autenticação.

## CAPACIDADE / REGRAS PRESERVADAS

Capacidade:

30 assinantes por barbeiro.

Preservar obrigatoriamente:

SELECT ... FOR UPDATE

Hold PIX:

30 minutos.

Order:

expiration_time = PT30M

Carência pós-ciclo:

2 dias.

Não confundir hold com carência.

## RPC

confirm_mercado_pago_subscription_payment

continua sendo a confirmação transacional/idempotente após validação server-side.

provider_charge_id aceita Order ID textual.

A RPC NÃO cria comissão.

Não chamar manualmente para mascarar falha do webhook.

## COMISSÃO

Percentual NÃO definido.

NÃO inventar percentual.

Nenhuma comissão foi criada.

## BANCO

Migrations aplicadas:

007–016.

NÃO reaplicar nenhuma.

Migration 014:
hold PIX de 30 minutos.

Migration 015:
UPDATE de subscription_charges para service_role.

Migration 016:
SELECT/INSERT/UPDATE de payment_events para service_role.

## BUILD

Builds após:

- correção de moeda;
- implementação de MERCADO_PAGO_TEST_MODE / APRO;

foram APROVADOS.

Next.js:

16.3.4

TypeScript:

sem erros.

## GIT

Referência versionada continua:

741d528 Implementa base server-side do Mercado Pago

Existem alterações locais NÃO commitadas.

Não descartar automaticamente.

Arquivos relacionados atualmente incluem alterações em:

- CONTEXTO-PROJETO.md
- app/api/assinaturas/mercado-pago/route.ts
- app/api/mercado-pago/webhook/route.ts
- app/assinaturas/subscription-checkout-form.tsx
- lib/mercado-pago/client.ts
- lib/mercado-pago/subscriptions.ts
- possivelmente lib/mercado-pago/webhook-signature.ts, dependendo de a proposta de lowercase ter sido executada ou não
- supabase/sql/014-align-pix-checkout-hold.sql
- supabase/sql/015-service-role-subscription-charges-update.sql
- supabase/sql/016-service-role-payment-events.sql

Nunca versionar:

ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt
.env.local

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## PRÓXIMO PASSO EXATO

1. NÃO criar novo checkout.
2. NÃO criar nova Order.
3. NÃO realizar pagamento real.
4. NÃO chamar manualmente a RPC de confirmação.
5. Verificar primeiro o estado atual de:
   lib/mercado-pago/webhook-signature.ts
6. Confirmar se a alteração proposta:
   dataId.toLowerCase()
   foi ou não aplicada.
7. Diagnosticar especificamente o 401 da simulação oficial.
8. Preferir instrumentação segura que revele apenas presença/formato dos componentes necessários, nunca segredo ou assinatura completa.
9. Corrigir somente a causa comprovada.
10. Build após alteração.
11. Reiniciar next dev se necessário.
12. Manter/recriar Quick Tunnel somente se necessário.
13. Reutilizar:
    ORDTST01M2HZ39TZ187852ED7YM3BD4G
14. Reenviar UMA simulação Order.
15. Esperar HTTP 200/201.
16. Auditar:
    payment_events;
    subscription_charge paid;
    subscription active;
    subscription_cycle paid;
    hold consumed;
    idempotência;
    ausência de comissão.
17. Depois testar evento duplicado/idempotência sem criar nova cobrança.
18. Nenhuma cobrança real.

# FIM DO CHECKPOINT INTERMEDIÁRIO — 2026-09-15

---

# CHECKPOINT INTERMEDIÁRIO — MERCADO PAGO / PIX APRO + HMAC RESOLVIDO / WEBHOOK AVANÇOU PARA 500 — 2026-09-15

## PRIORIDADE ABSOLUTA

Este é o checkpoint mais recente da integração Mercado Pago.

Quando houver conflito com checkpoints anteriores, este prevalece.

Produto:

Plano Mensal = pagamento mensal AVULSO de R$ 150 via PIX.

SEM renovação automática.

NÃO retomar preapproval/preapproval_plan como fluxo principal.

NÃO insistir em card_token_id.

## ESTADO CONSOLIDADO DO PIX

Integração:

Mercado Pago Checkout API via Orders API.

Criação:

POST /v1/orders

Consulta autoritativa server-side:

GET /v1/orders/{id}

PIX:

payment_method.id = pix
payment_method.type = bank_transfer

Correlação:

external_reference = subscription_charge.id

provider_charge_id:

Order ID ORD...

Payment:

PAY...

O navegador NÃO confirma pagamento.

## ORDER DE TESTE ATUAL

Foi criada em sandbox a Order:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

Charge interna:

d4235514-6fa8-4106-be1d-448f377a6853

Payment:

PAY01M2HZ39VQC7KHXPM1SDN3WJJX

O cenário oficial de teste do Mercado Pago utiliza:

payer.first_name = APRO

Isso é enviado SOMENTE quando:

MERCADO_PAGO_TEST_MODE=true

A variável está configurada localmente em .env.local.

APRO NÃO deve ser enviado em produção.

Nenhum banco/app real foi utilizado.

Nenhuma transferência real foi realizada.

## RESULTADO DO SANDBOX APRO

GET server-side da Order confirmou:

Order:
processed / accredited

Payment:
processed / accredited

amount:
150.00

paid_amount:
150.00

currency:
BRL

external_reference:
d4235514-6fa8-4106-be1d-448f377a6853

Portanto o cenário oficial APRO funcionou e simulou aprovação sem movimentação financeira real.

## CORREÇÃO DO PARSER DA ORDERS API

Foi confirmado na resposta real:

order.currency = BRL

enquanto:

currency_id

não era o campo correto dessa resposta.

lib/mercado-pago/subscriptions.ts foi corrigido para usar:

response.currency

com fallback para:

response.currency_id

Build:

APROVADO.

## MIGRATION 016

Foi criada e APLICADA:

supabase/sql/016-service-role-payment-events.sql

Ela concede exclusivamente ao service_role:

SELECT
INSERT
UPDATE

em:

public.payment_events

Não concede DELETE.

Não concede novos privilégios a anon/authenticated.

Validação após aplicação:

PAYMENT_EVENTS_SELECT=OK

Migrations 007–016 estão aplicadas.

NÃO reaplicar nenhuma.

## WEBHOOK DE TESTE

Evento configurado no Mercado Pago:

Order (Mercado Pago)

Planos e assinaturas:

desmarcado.

Pagamentos legacy:

desmarcado.

Quick Tunnel mais recente:

https://take-massachusetts-respect-reflections.trycloudflare.com

Webhook:

https://take-massachusetts-respect-reflections.trycloudflare.com/api/mercado-pago/webhook

O Quick Tunnel é TEMPORÁRIO.

Não presumir que continuará válido em outra sessão.

GET externo retornou:

HTTP 405

esperado.

## SEGREDO DO WEBHOOK — PROBLEMA ENCONTRADO E CORRIGIDO

Durante o diagnóstico do HTTP 401 foi verificado de forma segura o formato local de:

MERCADO_PAGO_WEBHOOK_SECRET

O valor local estava incorreto:

length = 2003
endsWithQuote = true

Isso comprovou que a variável estava malformada.

O segredo correto foi novamente copiado diretamente do painel Mercado Pago sem ser enviado ao chat.

.env.local foi atualizado sem imprimir seu conteúdo.

Validação posterior:

present = true
length = 64
leadingOrTrailingWhitespace = false
hasCR = false
hasLF = false
hasTab = false
startsWithQuote = false
endsWithQuote = false

Não regenerar o segredo sem necessidade.

Nunca imprimir ou enviar ao chat:

MERCADO_PAGO_WEBHOOK_SECRET
MERCADO_PAGO_ACCESS_TOKEN
SUPABASE_SERVICE_ROLE_KEY
.env.local

## HMAC / DATA.ID — CAUSA DO 401 COMPROVADA

Mesmo com o segredo corrigido, o webhook ainda retornava 401.

Foi criada instrumentação temporária segura.

Confirmado que a requisição real do simulador enviava:

- x-signature presente;
- ts presente;
- v1 presente;
- x-request-id presente;
- data.id presente na URL;
- data.id presente no body;
- URL e body com exatamente o mesmo data.id;
- segredo presente no processo.

Foi testado internamente, sem imprimir HMAC/segredo/header, o manifesto com:

dataId.toLowerCase()

e com:

dataId original.

Resultado conclusivo:

lowerMatches = false
originalMatches = true

Portanto, para o webhook atual:

Order (Mercado Pago)

o manifesto válido utiliza o Order ID exatamente como recebido, preservando maiúsculas.

A alteração anterior de lowercase foi revertida.

## VALIDADOR HMAC DEFINITIVO

lib/mercado-pago/webhook-signature.ts voltou ao formato limpo:

id:${dataId};request-id:${requestId};ts:${parts.ts};

HMAC:

SHA-256

com:

MERCADO_PAGO_WEBHOOK_SECRET

e comparação timing-safe.

As instrumentações temporárias de diagnóstico HMAC/auth foram removidas.

Build depois da limpeza:

APROVADO.

## RESULTADO MAIS RECENTE DO SIMULADOR

Após:

- segredo correto;
- data.id original;
- build;
- reinício do next dev;
- túnel funcional;

foi enviada UMA nova simulação oficial usando:

Tipo:
Order (Mercado Pago)

Data ID:
ORDTST01M2HZ39TZ187852ED7YM3BD4G

Resultado:

HTTP 500 Internal Server Error

IMPORTANTE:

Anteriormente a mesma simulação retornava:

401 Unauthorized

Portanto o HTTP 401 FOI RESOLVIDO.

A autenticação HMAC agora passou e o webhook avançou para uma etapa posterior do processamento.

## BLOQUEIO ATUAL EXATO

O bloqueio atual é:

HTTP 500 após autenticação bem-sucedida do webhook.

A causa server-side específica desse 500 AINDA NÃO FOI LIDA.

NÃO simular novamente antes de ler o log.

NÃO criar nova Order.

NÃO criar novo checkout.

NÃO gerar novo PIX.

NÃO chamar manualmente a RPC.

Próximo passo deve ser exclusivamente consultar os logs da última simulação procurando:

mercado pago webhook
event insert
duplicate lookup
processing error
payment confirmation
permission denied
42501
500

Diagnosticar SOMENTE a causa concreta encontrada.

## ESTADO INTERNO ANTES DO 500

Antes da simulação que avançou para 500, a auditoria havia mostrado:

subscription_charge:
pending

subscription_id:
null

cycle_id:
null

paid_at:
null

hold:
held

payment_events:
nenhum evento relevante naquele momento.

Como o webhook agora passou da autenticação, esse estado pode ter mudado parcialmente.

Portanto, depois de ler o erro do log, auditar o estado antes de tentar novamente.

Não presumir que nada foi gravado.

## SEGURANÇA DO BODY DO SIMULADOR

O body exibido pelo simulador do Mercado Pago contém dados fictícios que não correspondem ao PIX real, incluindo exemplo de cartão/valores.

Isso NÃO deve ser usado como autoridade financeira.

O webhook implementado consulta obrigatoriamente:

GET /v1/orders/{id}

usando o data.id autenticado.

Somente o recurso consultado server-side no Mercado Pago pode avançar para confirmação financeira.

Essa arquitetura deve ser preservada.

## CAPACIDADE

Capacidade:

30 assinantes por barbeiro.

Preservar obrigatoriamente:

SELECT ... FOR UPDATE

Hold PIX:

30 minutos.

Order:

expiration_time = PT30M

Carência pós-ciclo:

2 dias.

Não confundir hold com carência.

## RPC

RPC existente:

confirm_mercado_pago_subscription_payment

Aceita provider_charge_id textual genérico e pode receber Order ID.

É responsável pelo processamento transacional/idempotente depois da validação server-side.

Ela NÃO cria comissão.

Não chamá-la manualmente para contornar o webhook.

## COMISSÃO

Percentual ainda NÃO definido.

NÃO inventar percentual.

Nenhuma comissão deve ser criada.

## BUILD

Builds recentes:

APROVADOS.

Incluem:

- parser currency;
- sandbox APRO;
- instrumentações temporárias;
- remoção das instrumentações;
- validador HMAC definitivo com data.id original.

Next.js:

16.3.4

TypeScript:

sem erros.

## GIT

Referência versionada:

741d528 Implementa base server-side do Mercado Pago

Existem alterações locais NÃO commitadas.

NÃO descartar automaticamente.

Arquivos relacionados incluem:

- CONTEXTO-PROJETO.md
- app/api/assinaturas/mercado-pago/route.ts
- app/api/mercado-pago/webhook/route.ts
- app/assinaturas/subscription-checkout-form.tsx
- lib/mercado-pago/client.ts
- lib/mercado-pago/subscriptions.ts
- lib/mercado-pago/webhook-signature.ts
- supabase/sql/014-align-pix-checkout-hold.sql
- supabase/sql/015-service-role-subscription-charges-update.sql
- supabase/sql/016-service-role-payment-events.sql

Nunca versionar:

ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt
.env.local

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## NÃO ALTERAR

Não alterar:

/agendar
create_public_multi_appointment
integração existente dos benefícios da assinatura.

Não retomar fluxo recorrente automático Mercado Pago.

Não criar comissão.

## PRÓXIMO PASSO EXATO

1. NÃO simular novamente.
2. NÃO criar checkout.
3. NÃO criar Order.
4. NÃO gerar PIX.
5. NÃO chamar a RPC manualmente.
6. Ler o erro server-side da ÚLTIMA simulação que retornou HTTP 500.
7. Procurar no log:
   mercado pago webhook
   event insert
   duplicate lookup
   processing error
   payment confirmation
   permission denied
   42501
   500
8. Auditar se payment_events ou outros registros foram parcialmente alterados.
9. Corrigir SOMENTE a causa comprovada.
10. Build após alteração.
11. Reutilizar a mesma Order:
    ORDTST01M2HZ39TZ187852ED7YM3BD4G
12. Repetir UMA simulação somente depois da correção.
13. Esperar HTTP 200/201.
14. Auditar:
    payment_events;
    subscription_charge paid;
    subscription active;
    subscription_cycle paid;
    hold consumed;
    idempotência;
    ausência de comissão.
15. Testar duplicidade somente depois de processamento bem-sucedido.
16. Nenhuma cobrança real.

# FIM DO CHECKPOINT INTERMEDIÁRIO — 2026-09-15

---

# CHECKPOINT FINAL — MERCADO PAGO / PIX ORDERS END-TO-END APROVADO E IDEMPOTENTE — 2026-09-15

## PRIORIDADE ABSOLUTA

Este é o checkpoint mais recente da integração Mercado Pago e prevalece sobre checkpoints anteriores quando houver conflito.

Regra de produto:

Plano Mensal NÃO é assinatura recorrente automática do Mercado Pago.

Fluxo comercial:

cliente escolhe plano + barbeiro
→ reserva capacidade
→ paga UMA mensalidade avulsa de R$ 150 via PIX
→ Mercado Pago confirma server-side
→ sistema libera um ciclo mensal
→ ao final o cliente decide voluntariamente se deseja comprar outro mês.

SEM renovação automática.

NÃO retomar preapproval/preapproval_plan como fluxo principal.

NÃO insistir em card_token_id.

## MERCADO PAGO — INTEGRAÇÃO VALIDADA

Integração escolhida:

Checkout API via Orders API.

Criação:

POST /v1/orders

Consulta autoritativa:

GET /v1/orders/{id}

PIX:

payment_method.id = pix
payment_method.type = bank_transfer

Correlação:

external_reference = subscription_charge.id

provider_charge_id:

Order ID ORD...

Payment ID:

PAY...

QR Code, qr_code_base64 e ticket_url já foram validados anteriormente.

O navegador NÃO confirma pagamento.

O body recebido pelo simulador também NÃO é autoridade financeira.

## ORDER SANDBOX UTILIZADA

Order:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

Charge:

d4235514-6fa8-4106-be1d-448f377a6853

Payment:

PAY01M2HZ39VQC7KHXPM1SDN3WJJX

Foi utilizado o cenário oficial Mercado Pago para teste PIX:

payer.first_name = APRO

Esse comportamento somente é ativado quando:

MERCADO_PAGO_TEST_MODE=true

configurado localmente.

Nenhum banco/app PIX real foi utilizado.

Nenhum dinheiro real foi movimentado.

GET server-side confirmou anteriormente:

Order = processed / accredited
Payment = processed / accredited
amount = 150.00
paid_amount = 150.00
currency = BRL
external_reference = d4235514-6fa8-4106-be1d-448f377a6853

## PARSER DA ORDERS API

A resposta real da Orders API utiliza:

order.currency = BRL

O parser foi corrigido para usar:

response.currency

com fallback para:

response.currency_id

Build aprovado.

## HMAC DO WEBHOOK — RESOLVIDO

O erro HTTP 401 está definitivamente resolvido.

Primeira causa comprovada:

MERCADO_PAGO_WEBHOOK_SECRET estava malformado localmente.

Após correção, sua estrutura foi validada sem imprimir o segredo:

length = 64
sem whitespace externo
sem CR/LF/tab
sem aspas externas.

Segunda descoberta comprovada:

para o webhook atual Order (Mercado Pago), o manifesto válido utiliza o Order ID ORIGINAL preservando maiúsculas.

Teste experimental:

lowerMatches = false
originalMatches = true

Validador definitivo:

id:${dataId};request-id:${requestId};ts:${parts.ts};

NÃO aplicar dataId.toLowerCase() sem nova evidência.

Instrumentações temporárias de HMAC/auth foram removidas.

## WEBHOOK

Route Handler:

/api/mercado-pago/webhook

Evento de teste:

Order (Mercado Pago)

Fluxo validado:

x-signature + x-request-id
→ HMAC válido
→ data.id autenticado
→ GET /v1/orders/{id}
→ body ignorado como autoridade financeira
→ validação da Order
→ validação do Payment
→ validação de processed/accredited
→ validação de external_reference
→ validação de valor
→ validação de BRL
→ validação PIX/bank_transfer
→ confirm_mercado_pago_subscription_payment
→ atualização de payment_events.

O simulador envia body fictício contendo outros valores/meios de pagamento, inclusive cartão.

Esses dados NÃO foram aceitos como autoridade financeira.

A confirmação utilizou a Order real consultada server-side.

## HTTP 500 — CAUSA COMPROVADA

Depois da resolução do HMAC, a primeira simulação avançou de:

401 Unauthorized

para:

500 Internal Server Error

Log server-side:

mercado pago webhook processing error "payment confirmation failed: column reference \"subscription_id\" is ambiguous"

Foi comprovado que a falha ocorria dentro da RPC:

confirm_mercado_pago_subscription_payment

A função é RETURNS TABLE e possui variável de saída chamada:

subscription_id

Ao mesmo tempo utilizava:

ON CONFLICT (subscription_id, service_id) DO NOTHING

no INSERT de subscription_services.

Essa referência era ambígua no PL/pgSQL.

## AUDITORIA ANTES DA CORREÇÃO

Após o HTTP 500 foi confirmado:

subscription_charge:
pending

subscription_id:
null

cycle_id:
null

paid_at:
null

hold:
held

O webhook havia criado um payment_event não processado com:

processed_at = null

processing_error:
payment confirmation failed: column reference "subscription_id" is ambiguous

Portanto não houve ativação financeira parcial da RPC.

O evento com erro foi preservado como trilha de auditoria e NÃO deve ser apagado apenas para limpeza.

## MIGRATION 017

Foi criada:

supabase/sql/017-fix-mercado-pago-payment-confirmation-ambiguity.sql

A migration deriva da definição versionada da RPC na migration 013 e altera exclusivamente:

ON CONFLICT (subscription_id, service_id) DO NOTHING

para:

ON CONFLICT DO NOTHING

Isso elimina a referência ambígua mantendo a idempotência pretendida ao copiar subscription_services.

Migration 017 aplicada no Supabase em 2026-09-15.

Resultado:

Success. No rows returned

NÃO reaplicar.

Migrations 007–017 estão aplicadas.

NÃO reaplicar nenhuma.

## BUILD APÓS CORREÇÃO

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- rotas geradas normalmente;
- /api/mercado-pago/webhook reconhecida.

## NEXT DEV / CLOUDFLARE

Foi encontrado um processo antigo de next dev que não respondia.

Ele foi encerrado e um novo next dev foi iniciado corretamente em:

http://localhost:3000

Quick Tunnel utilizado na validação final:

https://rangers-forests-readings-looks.trycloudflare.com

Webhook de teste:

https://rangers-forests-readings-looks.trycloudflare.com/api/mercado-pago/webhook

Essa URL é TEMPORÁRIA.

Não presumir válida em sessão futura.

O painel Mercado Pago foi atualizado somente na URL de TESTE.

O segredo HMAC NÃO foi regenerado.

## PRIMEIRO PROCESSAMENTO BEM-SUCEDIDO

Depois da migration 017, foi realizada UMA simulação oficial usando a MESMA Order:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

Resultado:

HTTP 200 OK

Auditoria posterior confirmou:

subscription_charge:
paid

provider:
mercado_pago

provider_charge_id:
ORDTST01M2HZ39TZ187852ED7YM3BD4G

subscription_id:
e7973ff4-9601-4a28-9050-23a7328e78fd

cycle_id:
06b90ddd-f4ff-47f4-9d0d-e2d1cda2d849

paid_at preenchido.

## PAYMENT_EVENTS

Evento bem-sucedido:

event_type:
order.processed

charge_id:
d4235514-6fa8-4106-be1d-448f377a6853

processed_at:
preenchido

processing_error:
null

O evento antigo da tentativa que falhou com HTTP 500 permanece:

processed_at:
null

processing_error:
payment confirmation failed: column reference "subscription_id" is ambiguous

Isso é histórico de auditoria e pode permanecer.

## HOLD

Hold da contratação:

id:
7dbfc757-247a-417c-8716-43f5fc130638

Após processamento:

status:
consumed

subscription_id:
e7973ff4-9601-4a28-9050-23a7328e78fd

cycle_id:
06b90ddd-f4ff-47f4-9d0d-e2d1cda2d849

Portanto a reserva de capacidade foi consumida corretamente.

## ASSINATURA

Validação visual realizada em:

/admin/assinantes

Assinatura criada:

Teste Black Navalha

Status:

ATIVO

Plano:

Plano Mensal

Início:

15/09/2026

Validade:

14/10/2026

Serviços incluídos confirmados:

- Cabelo Assinante Mensal;
- Barba Assinante Mensal;
- Cabelo + Barba Assinante Mensal;
- Raspado + Barba Assinante Mensal.

A integração existente dos benefícios foi preservada.

## CICLO

Ciclo criado:

06b90ddd-f4ff-47f4-9d0d-e2d1cda2d849

status:

paid

period_start:

2026-09-15

period_end:

2026-10-14

price_amount:

150

grace_until:

2026-10-17T03:00:00+00:00

A carência continua sendo 2 dias após o encerramento do ciclo.

Não confundir com o hold PIX.

## CAPACIDADE

Capacidade:

30 assinantes por barbeiro.

Preservar obrigatoriamente:

SELECT ... FOR UPDATE

Hold PIX:

30 minutos.

Order expiration_time:

PT30M

Carência pós-ciclo:

2 dias.

## IDEMPOTÊNCIA — VALIDADA END-TO-END

Depois do primeiro processamento bem-sucedido foi realizada UMA segunda simulação oficial para a mesma Order.

Resultado:

HTTP 200 OK

O simulador forneceu novo x-request-id e, portanto, um novo provider_event_id foi registrado.

Auditoria confirmou:

- charge continuou a mesma;
- charge continuou paid;
- subscription_id continuou o mesmo;
- cycle_id continuou o mesmo;
- exatamente 1 subscription_cycle existe para essa assinatura;
- nenhum novo ciclo foi criado;
- período permaneceu 15/09/2026 → 14/10/2026;
- valor permaneceu R$ 150;
- segundo payment_event foi processado com sucesso;
- nenhuma duplicação financeira ocorreu;
- nenhuma comissão foi criada.

Portanto a idempotência foi comprovada mesmo com múltiplas entregas da mesma Order possuindo x-request-id diferentes.

## COMISSÃO

Percentual/regra continuam NÃO definidos.

NÃO inventar percentual.

Auditoria final:

commissions = []

A RPC NÃO cria comissão.

Isso deve permanecer assim até decisão financeira específica.

## SEGURANÇA

Nunca pedir, imprimir, registrar ou versionar:

MERCADO_PAGO_ACCESS_TOKEN
MERCADO_PAGO_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
.env.local

Nenhum segredo foi necessário para documentar este checkpoint.

Nenhuma cobrança real foi realizada.

O cenário APRO foi exclusivamente sandbox oficial Mercado Pago.

## NÃO ALTERAR

Não alterar:

/agendar
create_public_multi_appointment
integração existente dos benefícios da assinatura.

Não retomar recorrência automática Mercado Pago.

Plano Mensal permanece como compra mensal avulsa e voluntária.

## MIGRATIONS

Aplicadas:

007–017.

Em especial:

014:
hold PIX alterado para 30 minutos.

015:
UPDATE de subscription_charges para service_role.

016:
SELECT/INSERT/UPDATE de payment_events para service_role.

017:
corrige ambiguidade subscription_id na RPC de confirmação.

NÃO reaplicar nenhuma migration já aplicada.

## GIT

Referência versionada anterior:

741d528 Implementa base server-side do Mercado Pago

Existem alterações locais da integração Mercado Pago ainda NÃO commitadas.

NÃO descartar automaticamente.

Nunca versionar:

ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt
.env.local

Nunca usar:

git add .

Staging somente com caminhos explícitos.

Commit/push somente com autorização explícita.

## ESTADO FINAL DESTA ETAPA

PIX Orders sandbox:

APROVADO END-TO-END.

Webhook HMAC:

APROVADO.

Consulta server-side da Order:

APROVADA.

Confirmação transacional:

APROVADA.

subscription_charge paid:

APROVADO.

subscription active:

APROVADO.

subscription_cycle paid:

APROVADO.

hold consumed:

APROVADO.

Idempotência:

APROVADA.

Ausência de comissão:

CONFIRMADA.

Nenhum dinheiro real foi movimentado.

## PRÓXIMO PASSO

Antes de iniciar nova evolução funcional:

1. verificar git status;
2. revisar somente os arquivos alterados relacionados ao Mercado Pago;
3. não descartar alterações locais úteis;
4. manter arquivos auxiliares e .env.local fora do staging;
5. decidir conscientemente o checkpoint Git;
6. commit/push somente com autorização explícita.

Não é necessário criar nova Order ou repetir o teste PIX já aprovado para continuar o desenvolvimento.

# FIM DO CHECKPOINT FINAL — 2026-09-15

---

# CHECKPOINT — ASSINATURAS / ACOMPANHAMENTO AUTOMÁTICO DO PIX — 2026-09-17

## PRIORIDADE

Este checkpoint complementa o checkpoint:

MERCADO PAGO / PIX ORDERS END-TO-END APROVADO E IDEMPOTENTE — 2026-09-15

A integração financeira validada permanece inalterada.

Regra de produto:

Plano Mensal = pagamento mensal AVULSO de R$ 150 via PIX.

SEM renovação automática Mercado Pago.

O navegador continua NÃO sendo autoridade financeira.

## OBJETIVO DESTA ETAPA

Melhorar a experiência do cliente depois da geração do PIX.

Antes:

- cliente gerava QR Code;
- via Pix Copia e Cola;
- aguardava confirmação;
- a página não acompanhava automaticamente o estado interno da cobrança.

Agora a página pode observar a confirmação já realizada server-side pelo webhook/RPC.

## NOVA ROTA DE STATUS

Criada:

app/api/assinaturas/status/route.ts

Método:

POST

Entrada:

- chargeId;
- checkoutToken.

O checkoutToken é enviado no body JSON.

NÃO é enviado em query string.

A rota:

- valida os dois UUIDs;
- utiliza createAdminClient server-side;
- procura subscription_charges simultaneamente por charge id + checkout_token;
- não consulta estado informado pelo navegador como autoridade financeira;
- não chama RPC de confirmação;
- não altera charge;
- não altera assinatura;
- não altera ciclo;
- não altera hold;
- não consulta Mercado Pago para confirmar pagamento;
- apenas observa o estado financeiro interno já consolidado pelo webhook/RPC.

Resposta relevante:

status
paid
activated
paidAt

paid = true somente quando:

subscription_charges.status = paid

activated = true somente quando:

status = paid
E subscription_id existe
E cycle_id existe.

Cache:

Cache-Control: no-store

## SEGURANÇA DA CONSULTA

Foram testados três casos diretamente contra o endpoint:

Charge + checkoutToken corretos:

HTTP 200

Resultado:

status = paid
paid = true
activated = true

Token UUID válido porém incorreto:

HTTP 404

Checkout não encontrado.

Entrada inválida:

HTTP 400

Checkout inválido.

O checkoutToken deixou de aparecer na URL.

## POLLING NA INTERFACE

Alterado:

app/assinaturas/subscription-checkout-form.tsx

Após a geração do PIX, a página consulta periodicamente:

POST /api/assinaturas/status

Intervalo planejado:

aproximadamente 3 segundos.

O polling envia:

chargeId
checkoutToken

em JSON.

A página somente apresenta confirmação quando o backend responde simultaneamente:

paid = true
activated = true

Portanto:

QR Code NÃO confirma pagamento.

Pix Copia e Cola NÃO confirma pagamento.

ticket_url NÃO confirma pagamento.

retorno visual do Mercado Pago NÃO confirma pagamento.

Somente o estado interno produzido pela confirmação server-side pode mudar a interface para sucesso.

## TELA DE PAGAMENTO CONFIRMADO

Quando a cobrança interna está paga e vinculada a assinatura/ciclo, a interface apresenta:

Pagamento confirmado.

A página informa que:

- Plano Mensal está ativo;
- pagamento foi confirmado com segurança pelo servidor;
- benefícios estão liberados para o ciclo pago.

Também é apresentado botão:

AGENDAR HORÁRIO

com destino:

/agendar

Nenhuma regra de /agendar foi alterada.

## EXPIRAÇÃO DO PIX

O cronômetro continua baseado exclusivamente em:

reservation_expires_at

retornado pelo servidor.

Hold PIX:

30 minutos.

Nenhum timer independente foi criado.

Quando o cronômetro chega a zero, a UI NÃO declara imediatamente a cobrança como expirada.

Foi implementada uma consulta final ao backend.

Fluxo:

cronômetro chega a 00:00
→ tela mostra Verificando pagamento...
→ POST final para /api/assinaturas/status
→ se paid + activated: mostrar sucesso
→ caso contrário: mostrar reserva expirada.

Isso cobre o caso em que a confirmação financeira acontece muito próxima da expiração.

A RPC existente continua sendo autoridade para eventual confirmação posterior ao hold e continua revalidando capacidade sob lock.

## RECOMEÇO APÓS EXPIRAÇÃO

Quando a consulta final não encontra pagamento confirmado, a interface apresenta:

Esta reserva expirou.

Botão:

PREPARAR NOVA CONTRATAÇÃO

Esse botão limpa somente o estado local da tentativa:

- prepared;
- pix;
- estado visual de confirmação;
- mensagens;
- checkoutToken local.

Na próxima tentativa será gerado um novo checkoutToken.

Nenhuma cobrança antiga é apagada pelo navegador.

Nenhum dado financeiro é removido.

Nenhum hold é manipulado diretamente pelo browser.

## CSS

Alterado:

app/assinaturas/page.module.css

Foram adicionados estilos para:

- link/botão AGENDAR HORÁRIO após confirmação;
- estado visual de reserva expirada.

A identidade visual existente da página foi preservada.

## TESTE COM CHARGE JÁ CONFIRMADA

Foi reutilizada somente para leitura a charge sandbox já validada anteriormente:

d4235514-6fa8-4106-be1d-448f377a6853

O novo endpoint retornou:

status = paid
paid = true
activated = true

paidAt:

2026-09-15T19:53:13.173+00:00

Nenhuma nova operação financeira foi realizada nesse teste.

## NOVA TENTATIVA SANDBOX PARA VALIDAR ESTADO PENDENTE

Foi preparada uma nova contratação de TESTE pela interface.

Dados de teste utilizados:

Nome:

Teste Black Navalha Polling

E-mail de sandbox:

blacknavalhapolling@testuser.com

Foi gerado um PIX sandbox.

Charge:

9fc3d74b-10e7-49b9-b2c0-a7f5c4243f22

Order:

ORDTST01M2PKBNKTG4J4XT97B09SGX0Y

Payment:

PAY01M2PKBNMFZ5822Q7AKFTQSJX6

Auditoria server-side confirmou:

charge:
pending

subscription_id:
null

cycle_id:
null

paid_at:
null

Order:

action_required / waiting_transfer

Payment:

action_required / waiting_transfer

amount:

150.00

currency:

BRL

payment_method.id:

pix

payment_method.type:

bank_transfer

external_reference:

9fc3d74b-10e7-49b9-b2c0-a7f5c4243f22

payment_events:

nenhum para essa Order durante a auditoria.

Portanto a interface permaneceu aguardando corretamente.

NÃO houve falso positivo de pagamento.

## CENÁRIO APRO NESSA NOVA ORDER

MERCADO_PAGO_TEST_MODE foi verificado de forma segura:

true

createPixOrder foi verificado e envia:

payer.first_name

quando payerFirstName é fornecido.

A rota atual fornece:

APRO

quando:

MERCADO_PAGO_TEST_MODE=true

Porém essa nova Order permaneceu:

action_required / waiting_transfer

durante a observação.

GET da Order não retornou objeto payer, portanto esse GET não permite provar se first_name foi persistido/exposto na resposta.

NÃO foi alterada a integração apenas por causa desse comportamento do sandbox.

NÃO foi utilizado banco/app PIX real.

NÃO foi forçada confirmação financeira.

A Order pendente deve permanecer como dado de teste/auditoria, salvo necessidade futura específica.

## BUILD

Foram executados builds após as alterações.

Estado final salvo passou em:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- páginas geradas;
- nova rota /api/assinaturas/status reconhecida.

## DIFF CHECK

Verificação final:

git diff --check

Resultado:

NONE

Avisos LF/CRLF conhecidos não representam erro funcional.

## BANCO

Nenhuma migration criada nesta etapa.

Nenhuma alteração estrutural de banco.

Migrations aplicadas permanecem:

007–017.

NÃO reaplicar.

## MERCADO PAGO

Nenhuma alteração na arquitetura financeira validada.

Fluxo continua:

plano
→ barbeiro
→ capacidade
→ SELECT ... FOR UPDATE
→ hold 30 minutos
→ charge pending
→ Order PIX
→ webhook autenticado
→ GET Order server-side
→ validações financeiras
→ RPC transacional/idempotente
→ charge paid
→ assinatura active
→ ciclo paid
→ hold consumed.

O polling apenas OBSERVA o resultado desse fluxo.

Ele não confirma pagamento.

## CAPACIDADE

Permanece:

30 assinantes por barbeiro.

Preservar obrigatoriamente:

SELECT ... FOR UPDATE.

Hold PIX:

30 minutos.

Carência após ciclo pago:

2 dias.

Não confundir hold e carência.

## COMISSÃO

Percentual continua NÃO definido.

NÃO inventar percentual.

Nenhuma comissão foi implementada nesta etapa.

## NÃO ALTERAR

Não alterar:

/agendar
create_public_multi_appointment
integração existente dos benefícios.

Não retomar renovação automática do Mercado Pago.

## ARQUIVOS DESTA ETAPA

Modificados:

app/assinaturas/subscription-checkout-form.tsx
app/assinaturas/page.module.css

Criado:

app/api/assinaturas/status/route.ts

Nenhum outro arquivo funcional deve ser incluído automaticamente no checkpoint desta etapa.

## GIT

Checkpoint versionado anterior:

b8eab1b Conclui pagamento PIX via Mercado Pago Orders

Não versionar:

ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt
.env.local

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## ESTADO DA ETAPA

API de acompanhamento:

APROVADA.

Validação de acesso charge + token:

APROVADA.

Polling:

IMPLEMENTADO.

Confirmação visual baseada exclusivamente no backend:

IMPLEMENTADA.

Proteção contra falso positivo:

VALIDADA com Order pendente.

Consulta final na expiração:

IMPLEMENTADA.

Recomeço após expiração:

IMPLEMENTADO.

Build:

APROVADO.

Nenhuma cobrança real realizada.

## PRÓXIMO PASSO

Antes de nova evolução:

- revisar Git status;
- revisar somente o diff dos três arquivos funcionais desta etapa e deste contexto;
- validar visualmente o estado de expiração quando oportuno, sem adulterar banco/relógio apenas para forçar o teste;
- decidir checkpoint Git conscientemente;
- commit/push somente com autorização explícita.

# FIM DO CHECKPOINT — 2026-09-17

## COMPLEMENTO DE VALIDAÇÃO — EXPIRAÇÃO E HARD REFRESH

Após a tentativa sandbox pendente atingir o fim do período observado, foi realizada auditoria somente-leitura da charge:

9fc3d74b-10e7-49b9-b2c0-a7f5c4243f22

Resultado:

- status = pending;
- subscription_id = null;
- cycle_id = null;
- paid_at = null.

Hold relacionado:

- status persistido = held;
- expires_at já no passado;
- subscription_id = null;
- cycle_id = null.

Isso confirma ausência de ativação indevida.

O status persistido held após expires_at não foi alterado manualmente. A validade temporal continua determinada por expires_at e as rotinas existentes revalidam/expiram capacidade quando necessário.

A aba que permaneceu aberta durante alterações de código voltou ao formulário ao final da tentativa. Essa aba havia sido carregada antes da implementação final da UX de expiração e, portanto, NÃO é considerada validação visual do novo estado "Esta reserva expirou".

Depois de Ctrl+Shift+R, a versão atual de /assinaturas foi validada visualmente.

Confirmado:

- Plano Mensal R$ 150;
- quatro serviços incluídos;
- formulário de contratação;
- barbeiro com Vagas disponíveis;
- botão PREPARAR CONTRATAÇÃO;
- aviso de reserva por 30 minutos;
- nenhum resíduo visual da tentativa anterior;
- nenhuma ativação indevida.

O estado específico "Esta reserva expirou" permanece implementado e coberto por build, mas não foi forçado com nova espera de 30 minutos apenas para validação visual.

Não criar novo PIX somente para esse teste sem necessidade funcional.

---

# CHECKPOINT FINAL — RENOVAÇÃO VOLUNTÁRIA DE ASSINATURA — 2026-09-17

## PRIORIDADE

Este checkpoint complementa os checkpoints recentes de Mercado Pago PIX e acompanhamento automático.

Regra de produto permanece:

Plano Mensal = pagamento mensal AVULSO de R$ 150 via PIX.

SEM cobrança recorrente automática.

Cada novo mês depende de decisão voluntária do cliente e de novo pagamento confirmado server-side.

## REGRA DE RENOVAÇÃO DEFINIDA

A renovação voluntária passa a ser permitida:

- a partir de 7 dias antes do encerramento do ciclo pago atual;
- durante os 2 dias de carência já configurados.

Antes dessa janela, uma nova tentativa para a mesma assinatura/plano é recusada.

Depois de encerrada a carência, a vaga antiga já não é garantida e uma nova contratação depende da capacidade disponível.

## CAPACIDADE

Capacidade permanece:

30 assinantes por barbeiro.

SELECT ... FOR UPDATE permanece obrigatório e foi preservado.

Foi identificada e corrigida uma situação importante:

uma renovação com o MESMO barbeiro não pode consumir uma segunda vaga temporariamente.

A assinatura já ocupa uma das vagas do profissional.

A função de reserva agora reconhece essa situação através de subscription_id.

Em lotação 30/30:

- assinante que já ocupa aquele barbeiro pode renovar a própria vaga;
- nova ocupação continua recusada.

## TROCA DE BARBEIRO

Na renovação o cliente pode escolher outro barbeiro.

Quando escolhe outro profissional:

- o hold no novo barbeiro é tratado como nova ocupação;
- o novo barbeiro precisa possuir capacidade real;
- a vaga do barbeiro anterior não é liberada antecipadamente apenas porque existe tentativa pendente;
- pagamento pendente/falhado não transfere a vaga.

O vínculo histórico do novo ciclo continua sendo determinado pelo barber_id da cobrança confirmada.

## CONFIRMAÇÃO APÓS EXPIRAÇÃO DO HOLD

Também foi corrigido o caso de confirmação financeira posterior aos 30 minutos do hold.

Se a renovação é para o MESMO barbeiro e a própria assinatura continua ocupando uma vaga válida, a confirmação não é rejeitada apenas porque o profissional está 30/30.

Para:

- contratação inicial;
- troca de barbeiro;

a capacidade continua sendo revalidada normalmente após a expiração do hold.

Nenhuma 31ª ocupação deve ser aceita.

## MIGRATION 018

Criada:

supabase/sql/018-subscription-voluntary-renewal.sql

Aplicada no Supabase em 2026-09-17.

Resultado:

Success. No rows returned

NÃO reaplicar.

Migrations 007–018 estão aplicadas.

A migration 018 atualiza:

- reserve_subscription_checkout_capacity;
- create_subscription_checkout;
- confirm_mercado_pago_subscription_payment.

## RESERVE_SUBSCRIPTION_CHECKOUT_CAPACITY

A função continua:

- validando checkout token;
- validando expiração futura;
- validando assinatura quando informada;
- bloqueando a linha do barbeiro com SELECT ... FOR UPDATE;
- serializando checkouts concorrentes do mesmo profissional;
- preservando idempotência por checkout_token;
- expirando holds vencidos antes da contagem;
- contando ocupação por assinatura/checkout;
- recusando nova ocupação quando capacidade foi atingida.

Novo comportamento:

se p_subscription_id já possui ciclo paid/grace ocupando o mesmo barbeiro, o hold representa a mesma vaga existente e não uma vaga adicional.

## CREATE_SUBSCRIPTION_CHECKOUT

Continua com:

hold de 30 minutos;
preço autoritativo do subscription_plans;
charge pending;
nenhuma ativação;
nenhum ciclo paid;
nenhuma comissão.

Passou a:

- normalizar WhatsApp server-side;
- localizar customer existente pelo telefone normalizado;
- localizar assinatura comercial do mesmo plano;
- localizar ciclo paid/grace vigente;
- determinar janela de renovação;
- rejeitar renovação antecipada;
- reconhecer renovação com mesmo barbeiro;
- exigir nova capacidade quando barbeiro escolhido é diferente;
- vincular subscription_id à charge de renovação para rastreabilidade.

Nenhum dado privado da assinatura é exposto publicamente por essa lógica.

## CONFIRM_MERCADO_PAGO_SUBSCRIPTION_PAYMENT

A RPC transacional/idempotente continua sendo a autoridade de confirmação após validação server-side do Mercado Pago.

Permanece:

- FOR UPDATE na charge;
- FOR UPDATE no barbeiro;
- validação de provider/provider_charge_id;
- capacidade;
- customer;
- assinatura;
- ciclo;
- benefícios;
- hold;
- charge paid;
- idempotência;
- ausência deliberada de comissão.

Foi acrescentada somente a consideração da ocupação existente da própria assinatura ao revalidar hold expirado para renovação no mesmo barbeiro.

## ROTA DE PRÉ-CHECKOUT

Alterado:

app/api/assinaturas/checkout/route.ts

A rota reconhece a exceção:

subscription renewal not available before YYYY-MM-DD

e responde:

HTTP 409

com mensagem amigável:

Sua renovação estará disponível a partir de DD/MM/AAAA.

## TESTE REAL — RENOVAÇÃO ANTECIPADA

Foi utilizada a assinatura sandbox/teste existente:

Teste Black Navalha

Ciclo atual:

15/09/2026 → 14/10/2026

Janela de renovação:

07/10/2026

Em 17/09/2026 foi realizada UMA tentativa controlada somente de pré-checkout.

Resultado:

HTTP 409

Mensagem:

Sua renovação estará disponível a partir de 07/10/2026.

Auditoria pelo mesmo checkout_token confirmou:

chargesCreated = 0
holdsCreated = 0

Portanto a rejeição acontece antes de:

- criar charge;
- criar hold;
- consumir capacidade;
- criar Order;
- gerar PIX.

Nenhuma operação Mercado Pago foi iniciada nesse teste.

## CENÁRIOS NÃO FORÇADOS

Não foram adulterados:

- datas do ciclo;
- relógio do banco;
- capacidade;
- assinatura validada;
- dados financeiros;

apenas para testar artificialmente os demais cenários.

Portanto ainda NÃO foram exercitados end-to-end nesta data:

- renovação permitida dentro dos 7 dias;
- renovação com mesmo barbeiro em lotação exatamente 30/30;
- troca de barbeiro durante renovação;
- confirmação tardia de renovação após hold expirado.

Esses cenários foram cobertos pela lógica da migration 018 e devem ser testados naturalmente quando houver janela/dados adequados, ou futuramente com fixture isolada conscientemente criada.

Não confundir revisão lógica com teste end-to-end executado.

## SEGURANÇA / PRIVACIDADE

Não foi criada página pública de consulta de assinatura por telefone.

Motivo:

não expor informações de assinatura a qualquer pessoa que conheça o WhatsApp do cliente.

A identificação por WhatsApp ocorre server-side apenas para aplicação das regras de renovação.

O formulário público continua sem revelar:

- assinatura existente;
- barbeiro histórico;
- ciclo;
- validade privada;

por uma API de consulta aberta.

## MERCADO PAGO

Nenhuma alteração no fluxo financeiro validado.

Renovação continua gerando uma NOVA cobrança PIX avulsa quando permitida.

O navegador não confirma pagamento.

Fluxo permanece:

pré-checkout
→ hold
→ charge pending
→ Order PIX
→ webhook HMAC
→ GET Order server-side
→ validações financeiras
→ RPC transacional/idempotente
→ novo ciclo paid.

SEM renovação automática Mercado Pago.

## HOLD E CARÊNCIA

Hold PIX:

30 minutos.

Carência pós-ciclo:

2 dias.

Janela de renovação antecipada:

7 dias antes do period_end.

Não confundir essas três regras.

## COMISSÃO

Percentual continua NÃO definido.

NÃO inventar percentual.

Migration 018 não cria comissão.

## NÃO ALTERAR

Não alterar:

/agendar
create_public_multi_appointment
integração existente dos benefícios da assinatura.

## BUILD

Após a adaptação da Route Handler:

npm.cmd run build

APROVADO.

TypeScript sem erros.

## GIT

Checkpoint anterior:

fd9f4dc Adiciona acompanhamento do pagamento PIX

Arquivos desta etapa:

- app/api/assinaturas/checkout/route.ts
- supabase/sql/018-subscription-voluntary-renewal.sql
- CONTEXTO-PROJETO.md

Não versionar:

ASSINATURAS-LOTE.txt
CODIGO-COMPLETO.txt
.env.local

Nunca usar:

git add .

## ESTADO

Renovação automática:

INEXISTENTE, conforme produto.

Renovação voluntária:

REGRA IMPLEMENTADA.

Janela de 7 dias:

IMPLEMENTADA.

Carência de 2 dias:

PRESERVADA.

Mesmo barbeiro sem dupla vaga:

IMPLEMENTADO.

Troca de barbeiro exige capacidade:

IMPLEMENTADO.

Rejeição antecipada:

TESTADA E APROVADA.

Nenhuma cobrança real realizada.

# FIM DO CHECKPOINT — 2026-09-17

---

# CHECKPOINT — ADMIN DE ASSINANTES / HISTÓRICO FINANCEIRO E OPERACIONAL — 2026-09-17

## PRIORIDADE

Este checkpoint complementa:

- CHECKPOINT FINAL — MERCADO PAGO / PIX ORDERS END-TO-END APROVADO E IDEMPOTENTE — 2026-09-15;
- CHECKPOINT — ASSINATURAS / ACOMPANHAMENTO AUTOMÁTICO DO PIX — 2026-09-17;
- CHECKPOINT FINAL — RENOVAÇÃO VOLUNTÁRIA DE ASSINATURA — 2026-09-17.

As regras financeiras e operacionais desses checkpoints permanecem inalteradas.

## OBJETIVO

Foi evoluída a área:

/admin/assinantes/[id]

para fornecer visão administrativa somente leitura do histórico financeiro e operacional real da assinatura.

A menor evolução arquitetônica foi escolhida:

- preservar a página existente de edição;
- preservar o formulário existente;
- adicionar o histórico na própria página;
- não criar nova rota;
- não alterar banco.

## ARQUIVOS

Alterado:

- app/admin/assinantes/[id]/page.tsx

Criado:

- app/admin/assinantes/[id]/subscription-history.tsx

Nenhum arquivo do Mercado Pago, fluxo público de assinatura ou agendamento foi alterado nesta etapa.

## IMPLEMENTAÇÃO

A página administrativa passou a apresentar:

- ciclo atual;
- status do ciclo;
- barbeiro vinculado ao ciclo;
- início e fim do ciclo;
- carência;
- situação financeira;
- data/hora do pagamento;
- histórico de ciclos;
- valor histórico do ciclo;
- histórico de cobranças;
- valor da cobrança;
- status da cobrança;
- provider;
- Order ID do Mercado Pago quando existente;
- barbeiro relacionado à cobrança;
- vínculo da cobrança com o ciclo;
- Charge ID;
- Cycle ID;
- data de criação da cobrança.

Status de ciclo tratados:

- pending;
- paid;
- grace;
- expired;
- cancelled.

Status financeiros tratados:

- pending;
- paid;
- failed;
- cancelled;
- expired;
- refunded;
- partially_refunded.

Provider:

mercado_pago

é apresentado administrativamente como:

Mercado Pago.

## ASSINATURA LEGADA

Nenhum histórico foi fabricado.

Se uma assinatura não possuir:

- subscription_cycles;
- subscription_charges;

a interface apresenta estado explícito de ausência de histórico financeiro.

Isso preserva a assinatura legada existente.

## LEITURA DOS DADOS

O formulário existente continua usando o client administrativo autenticado para:

- subscriptions;
- customers;
- subscription_services;
- services.

O histórico financeiro utiliza createAdminClient server-side para leitura de:

- subscription_cycles;
- subscription_charges.

Durante a validação foi identificado que service_role não possuía SELECT em barbers.

Não foi criada migration nem ampliada permissão apenas para apresentação.

A solução mínima foi reutilizar o createClient administrativo já existente na página para carregar:

- barbers.id;
- barbers.name;

e fornecer esses dados ao componente de histórico.

Isso corrigiu a apresentação do profissional sem alteração de banco.

## CONTRATOS UTILIZADOS

subscription_cycles:

- id;
- subscription_id;
- plan_id;
- barber_id;
- period_start;
- period_end;
- grace_until;
- status;
- price_amount;
- created_at.

subscription_charges:

- id;
- subscription_id;
- cycle_id;
- plan_id;
- barber_id;
- amount;
- currency;
- status;
- provider;
- provider_charge_id;
- paid_at;
- failed_at;
- cancelled_at;
- expired_at;
- refunded_at;
- created_at.

Foi respeitada a alteração posterior da migration 009 que permite subscription_charges.subscription_id NULL durante pré-checkout.

## VALIDAÇÃO COM DADOS REAIS DE SANDBOX

Foi utilizada a assinatura sandbox já existente.

Nenhum PIX novo foi criado.

Nenhuma cobrança foi realizada.

Nenhum dado artificial foi criado.

Validação visual aprovada em:

/admin/assinantes/[id]

Dados reais apresentados:

Assinatura:

Teste Black Navalha

Ciclo:

15/09/2026 até 14/10/2026

Status:

Pago

Barbeiro:

Rodrigo Alves Correa

Carência:

até 17/10/2026 00:00

Valor do ciclo:

R$ 150,00

Situação financeira:

Pago

Pagamento:

15/09/2026 16:53

Provider:

Mercado Pago

Order ID:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

A relação entre charge e ciclo também foi apresentada.

## CORREÇÃO DURANTE O TESTE

Na primeira validação visual o barbeiro apareceu como:

Profissional não identificado

O log server-side mostrou:

permission denied for table barbers

A causa era exclusivamente a tentativa de leitura de barbers com createAdminClient/service_role.

A leitura foi transferida para o client administrativo autenticado já existente.

Após a correção, a interface apresentou corretamente:

Rodrigo Alves Correa

em:

- Barbeiro do ciclo;
- Histórico de ciclos;
- Histórico de cobranças.

Nenhuma alteração de banco foi necessária.

## BUILD

Executado:

npm.cmd run build

Resultado final:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- páginas geradas;
- /admin/assinantes/[id] reconhecida como rota dinâmica.

## DIFF CHECK

Executado:

git diff --check

Resultado:

APROVADO.

Existe somente aviso conhecido de conversão futura LF para CRLF, sem erro de whitespace.

## BANCO

Nenhuma alteração.

Nenhuma migration criada.

Nenhuma migration aplicada.

Migrations 007–018 permanecem aplicadas e NÃO devem ser reaplicadas.

Não houve alteração em:

- schema;
- RLS;
- policies;
- RPCs;
- capacidade;
- hold;
- carência;
- Mercado Pago;
- renovação.

## REGRAS PRESERVADAS

Plano Mensal continua sendo pagamento mensal avulso via PIX.

SEM renovação automática Mercado Pago.

Renovação continua voluntária.

Capacidade:

30 assinantes por barbeiro.

Hold PIX:

30 minutos.

Carência pós-ciclo:

2 dias.

Janela de renovação:

7 dias antes do fim do ciclo.

SELECT ... FOR UPDATE permanece preservado.

confirm_mercado_pago_subscription_payment permanece transacional/idempotente e sem comissão.

Percentual/regra de comissão continuam NÃO definidos.

Nenhuma comissão foi criada.

## NÃO ALTERADO

Não foi alterado:

- /agendar;
- create_public_multi_appointment;
- integração dos benefícios da assinatura;
- criação PIX;
- webhook;
- HMAC;
- polling;
- capacidade;
- renovação voluntária.

## GIT

HEAD/origin oficial de início desta frente:

188a565 Implementa renovacao voluntaria de assinaturas

Arquivos funcionais desta etapa ainda não commitados:

- app/admin/assinantes/[id]/page.tsx
- app/admin/assinantes/[id]/subscription-history.tsx

Após esta atualização, CONTEXTO-PROJETO.md também ficará modificado.

Devem permanecer fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## ESTADO DA ETAPA

Histórico operacional:

IMPLEMENTADO E VALIDADO.

Histórico financeiro:

IMPLEMENTADO E VALIDADO.

Barbeiro do ciclo:

VALIDADO.

Ciclo atual:

VALIDADO.

Carência:

VALIDADA.

Cobrança e valor:

VALIDADOS.

Pagamento:

VALIDADO.

Provider Mercado Pago:

VALIDADO.

Order ID:

VALIDADO.

Relação Charge -> Ciclo -> Assinatura:

VALIDADA.

Build:

APROVADO.

Nenhuma alteração de banco realizada.

# FIM DO CHECKPOINT — 2026-09-17

---

# CHECKPOINT — ADMIN DE ASSINANTES / RESUMO OPERACIONAL NA LISTAGEM — 2026-09-17

## PRIORIDADE

Este checkpoint complementa o checkpoint imediatamente anterior:

ADMIN DE ASSINANTES / HISTÓRICO FINANCEIRO E OPERACIONAL — 2026-09-17.

As regras consolidadas de PIX Orders, acompanhamento do pagamento e renovação voluntária permanecem inalteradas.

## OBJETIVO

A listagem:

/admin/assinantes

foi evoluída para permitir que o proprietário visualize a situação operacional e financeira principal sem precisar abrir individualmente cada assinatura.

O histórico detalhado continua disponível em:

/admin/assinantes/[id]

## IMPLEMENTAÇÃO

Arquivo alterado:

- app/admin/assinantes/page.tsx

Cada card passou a apresentar, quando existem dados reais:

- barbeiro do ciclo;
- período do ciclo;
- carência;
- situação financeira;
- data/hora do pagamento.

Foram preservados:

- cliente;
- WhatsApp;
- plano;
- status da assinatura;
- início;
- validade;
- serviços incluídos;
- busca;
- filtro;
- edição da assinatura.

## LEITURA EM LOTE

Não foram criadas consultas financeiras individuais por card.

A listagem carrega em lote:

- subscription_cycles;
- subscription_charges.

As estruturas financeiras são lidas server-side através de createAdminClient.

Os barbeiros necessários são carregados pelo client administrativo autenticado já existente, seguindo a solução validada na etapa anterior.

Não foi criada migration para ampliar acesso de service_role a barbers.

Não existe consulta ao Mercado Pago nessa página.

Não existe leitura de payment_events nessa página.

O estado financeiro apresentado utiliza subscription_charges, que já contém o resultado financeiro interno consolidado pelo fluxo server-side validado.

## ASSINATURA SANDBOX — VALIDAÇÃO VISUAL

A assinatura real de sandbox:

Teste Black Navalha

foi validada visualmente na própria listagem.

Apresentado corretamente:

Barbeiro:

Rodrigo Alves Correa

Ciclo:

15/09/2026 até 14/10/2026

Carência:

até 17/10/2026 00:00

Financeiro:

Pago

Pagamento:

15/09/2026 16:53

Os quatro serviços incluídos permaneceram visíveis.

Status ATIVO e botão EDITAR ASSINATURA permaneceram preservados.

## ASSINATURA LEGADA — VALIDAÇÃO VISUAL

A assinatura legada existente também foi validada.

Ela continua preservada sem fabricação de histórico.

Como não possui ciclo/cobrança comercial registrada, a listagem apresenta:

Barbeiro:

Sem ciclo

Ciclo:

Sem histórico

Carência:

-

Financeiro:

Sem cobrança

Os serviços existentes, status e edição da assinatura legada permaneceram preservados.

## BUILD

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Compiled successfully;
- TypeScript sem erros;
- páginas geradas;
- /admin/assinantes permanece rota dinâmica.

## DIFF CHECK

Executado:

git diff --check

Resultado:

APROVADO.

Somente aviso conhecido LF/CRLF, sem erro funcional ou de whitespace.

## BANCO

Nenhuma alteração.

Nenhuma migration criada ou aplicada.

Migrations 007-018 permanecem aplicadas e NÃO devem ser reaplicadas.

## REGRAS PRESERVADAS

Plano Mensal continua sendo pagamento mensal avulso via PIX.

SEM renovação automática Mercado Pago.

Renovação permanece voluntária.

Capacidade:

30 assinantes por barbeiro.

Hold PIX:

30 minutos.

Carência pós-ciclo:

2 dias.

Janela de renovação:

7 dias antes do fim do ciclo.

SELECT ... FOR UPDATE permanece preservado.

Nenhuma comissão foi criada.

Percentual/regra de comissão continuam não definidos.

## NÃO ALTERADO

Não foi alterado:

- /agendar;
- create_public_multi_appointment;
- Mercado Pago;
- PIX;
- webhook;
- HMAC;
- polling;
- RPC de confirmação;
- capacidade;
- renovação voluntária;
- integração dos benefícios.

Nenhuma cobrança ou PIX foi criado para validar esta etapa.

## GIT

Checkpoint anterior versionado:

9b8ef18 Adiciona historico financeiro de assinaturas

Arquivo funcional desta etapa ainda não commitado:

- app/admin/assinantes/page.tsx

Após esta atualização:

- CONTEXTO-PROJETO.md também ficará modificado.

Devem permanecer fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## ESTADO

Resumo operacional na listagem:

IMPLEMENTADO E VALIDADO.

Assinatura sandbox:

VALIDADA.

Assinatura legada:

VALIDADA.

Build:

APROVADO.

Banco:

INALTERADO.

# FIM DO CHECKPOINT — 2026-09-17

---

# CHECKPOINT — ADMIN DE BARBEIROS / CAPACIDADE DE ASSINANTES — 2026-09-17

## OBJETIVO

A página:

/admin/barbeiros

foi evoluída para fornecer visão operacional da capacidade de assinantes por profissional.

A implementação é somente leitura.

Nenhuma capacidade foi alterada pelo Admin.

## ARQUIVO FUNCIONAL

Alterado:

- app/admin/barbeiros/page.tsx

## IMPLEMENTAÇÃO

Cada barbeiro passa a apresentar:

- capacidade total de assinantes;
- quantidade de vagas ocupadas;
- quantidade de vagas disponíveis;
- percentual de ocupação;
- barra visual de ocupação;
- assinantes que atualmente ocupam vaga;
- período do ciclo;
- indicação de ciclo pago ou carência.

As ações administrativas existentes foram preservadas:

- Editar;
- Horários;
- Serviços.

## REGRA DE OCUPAÇÃO

A visualização segue a regra operacional já consolidada no backend.

São considerados ciclos que:

- pertencem ao barbeiro;
- possuem status paid ou grace;
- possuem grace_until no futuro.

Cada subscription_id é contado no máximo uma vez por barbeiro.

Isso evita dupla contagem da mesma assinatura.

A assinatura legada sem ciclo comercial não ocupa vaga artificialmente.

A interface diferencia:

- Ciclo pago;
- Carência.

A condição de carência é determinada temporalmente quando period_end já passou e grace_until ainda está no futuro.

## LEITURA DOS DADOS

barbers é carregado pelo client administrativo autenticado existente, incluindo:

subscriber_capacity.

subscription_cycles é carregado server-side através de createAdminClient.

Os nomes dos assinantes são resolvidos através de subscriptions/customers utilizando o client administrativo autenticado.

Nenhuma consulta ao Mercado Pago foi adicionada.

Nenhuma leitura de payment_events foi necessária.

## VALIDAÇÃO REAL

Rota validada visualmente:

/admin/barbeiros

Profissional:

Rodrigo Alves Correa

Resultado:

- capacidade: 30;
- ocupadas: 1;
- disponíveis: 29;
- ocupação: 3%.

Assinante ocupando vaga:

Teste Black Navalha

Ciclo apresentado:

15/09/2026 até 14/10/2026

Situação:

CICLO PAGO

A assinatura legada sem ciclo comercial não apareceu como ocupação.

Acentuação validada visualmente, incluindo:

- disponíveis;
- ocupação;
- horários;
- serviços.

## BUILD

Executado:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /admin/barbeiros permanece rota dinâmica.

## DIFF CHECK

Executado:

git diff --check

Resultado:

APROVADO.

Existe somente aviso conhecido LF/CRLF no arquivo funcional.

## BANCO

Nenhuma alteração.

Nenhuma migration criada ou aplicada.

Migrations 007-018 permanecem aplicadas e NÃO devem ser reaplicadas.

## REGRAS PRESERVADAS

Capacidade real:

30 assinantes por barbeiro no estado atual.

A proteção autoritativa de capacidade continua no backend.

SELECT ... FOR UPDATE permanece preservado.

A visualização administrativa NÃO substitui a proteção transacional.

Hold PIX:

30 minutos.

Carência pós-ciclo:

2 dias.

Renovação voluntária:

preservada.

Mesmo barbeiro não consome segunda vaga em renovação.

Troca de barbeiro exige capacidade no novo profissional.

## NÃO ALTERADO

Não foi alterado:

- /agendar;
- create_public_multi_appointment;
- Mercado Pago;
- PIX;
- webhook;
- HMAC;
- polling;
- RPCs;
- capacidade no banco;
- renovação voluntária;
- comissão.

## GIT

Checkpoint versionado anterior:

413beb1 Adiciona resumo operacional de assinantes

Arquivo funcional desta etapa ainda não commitado:

- app/admin/barbeiros/page.tsx

app/admin/assinantes/page.tsx pode aparecer como M no working tree por normalização EOL/stat do Windows, porém git diff para esse arquivo está vazio e ele NÃO deve ser incluído no staging desta etapa.

Após este checkpoint:

- CONTEXTO-PROJETO.md ficará modificado.

Devem permanecer fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## ESTADO

Visão de capacidade por barbeiro:

IMPLEMENTADA E VALIDADA.

Dados reais:

VALIDADOS.

Build:

APROVADO.

Banco:

INALTERADO.

# FIM DO CHECKPOINT — 2026-09-17

---

# CHECKPOINT — ADMIN DE ASSINANTES / ACOMPANHAMENTO DE RENOVAÇÃO — 2026-09-17

## OBJETIVO

A listagem:

/admin/assinantes

passou a apresentar o estado administrativo da renovação voluntária de cada assinatura.

A funcionalidade é somente leitura.

Ela NÃO autoriza renovação no frontend e NÃO substitui as regras server-side implementadas pela migration 018.

## ARQUIVO FUNCIONAL

Alterado:

- app/admin/assinantes/page.tsx

## ESTADOS APRESENTADOS

A interface deriva o estado de renovação a partir do ciclo real.

Antes da janela:

- Abre em DD/MM/AAAA;
- detalhe: 7 dias antes do fim do ciclo.

Dentro dos últimos 7 dias do ciclo:

- Disponível.

Depois do period_end, enquanto grace_until ainda estiver no futuro:

- Disponível na carência.

Depois do encerramento da carência:

- Carência encerrada.

Assinatura sem ciclo comercial:

- Sem ciclo comercial.

## REGRA PRESERVADA

A janela administrativa segue a regra de produto já implementada no backend:

- renovação abre 7 dias antes do fim do ciclo;
- permanece possível durante os 2 dias de carência;
- não existe renovação automática Mercado Pago;
- renovação gera nova cobrança PIX voluntária.

A informação visual não concede permissão.

create_subscription_checkout e as RPCs da migration 018 continuam sendo autoridade para aceitar ou rejeitar uma tentativa real.

## VALIDAÇÃO SANDBOX

Assinatura:

Teste Black Navalha

Ciclo:

15/09/2026 até 14/10/2026

Data atual da validação:

17/09/2026

Estado apresentado:

RENOVAÇÃO

Abre em 07/10/2026

Detalhe:

7 dias antes do fim do ciclo

A data apresentada está consistente com a regra de 7 dias antes do encerramento em 14/10/2026.

## VALIDAÇÃO LEGADA

A assinatura legada existente, sem ciclo comercial, foi validada.

Estado apresentado:

RENOVAÇÃO

Sem ciclo comercial

Nenhum histórico ou janela de renovação foi fabricado para essa assinatura.

## DADOS PRESERVADOS

Continuaram visíveis e corretos:

- cliente;
- plano;
- status;
- barbeiro;
- ciclo;
- carência;
- financeiro;
- data de pagamento;
- serviços incluídos;
- edição da assinatura.

Acentuação e caracteres UTF-8 foram validados visualmente.

## BUILD

Executado:

npm.cmd run build

Resultado:

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /admin/assinantes permanece dinâmica.

## BANCO

Nenhuma alteração.

Nenhuma migration criada ou aplicada.

Migrations 007-018 permanecem aplicadas.

NÃO reaplicar.

## NÃO ALTERADO

Não foi alterado:

- /agendar;
- create_public_multi_appointment;
- Mercado Pago;
- PIX;
- webhook;
- HMAC;
- polling;
- capacidade;
- RPCs;
- renovação server-side;
- comissão.

Nenhum PIX ou cobrança foi criado para esta validação.

## GIT

Checkpoint funcional anterior:

fe91695 Adiciona capacidade de assinantes por barbeiro

Arquivo funcional desta etapa:

- app/admin/assinantes/page.tsx

Após esta atualização:

- CONTEXTO-PROJETO.md ficará modificado.

Devem permanecer fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## ESTADO

Acompanhamento administrativo da renovação:

IMPLEMENTADO E VALIDADO.

Regra de 7 dias:

VALIDADA.

Assinatura legada:

PRESERVADA.

Build:

APROVADO.

Banco:

INALTERADO.

# FIM DO CHECKPOINT — 2026-09-17

---

# CHECKPOINT — MINHA ASSINATURA / IDENTIDADE SEGURA E BASE DA RENOVAÇÃO AUTENTICADA — 2026-09-17

## PRIORIDADE

Este é o checkpoint funcional mais recente e complementa:

- CHECKPOINT FINAL — MERCADO PAGO / PIX ORDERS END-TO-END APROVADO E IDEMPOTENTE — 2026-09-15;
- CHECKPOINT — ASSINATURAS / ACOMPANHAMENTO AUTOMÁTICO DO PIX — 2026-09-17;
- CHECKPOINT FINAL — RENOVAÇÃO VOLUNTÁRIA DE ASSINATURA — 2026-09-17;
- CHECKPOINT — ADMIN DE ASSINANTES / ACOMPANHAMENTO DE RENOVAÇÃO — 2026-09-17.

As regras financeiras, capacidade e renovação server-side anteriores permanecem válidas.

## OBJETIVO

Foi criada a fundação segura da área:

/minha-assinatura

para que dados privados da assinatura não sejam revelados somente pelo conhecimento do WhatsApp do cliente.

WhatsApp continua sendo utilizado operacionalmente onde já existia, mas NÃO é prova de identidade para a área privada.

## IDENTIDADE

Foi adotado:

Supabase Auth por e-mail + senha.

A área administrativa existente permanece separada em:

/login

A área do cliente utiliza:

/minha-assinatura/entrar

O fluxo real de um novo usuário confirmou envio de e-mail pelo Supabase com confirmação obrigatória.

Callback configurado no Supabase para desenvolvimento:

http://localhost:3000/minha-assinatura/auth/callback

Site URL permanece:

http://localhost:3000

Produção deverá receber URL HTTPS própria futuramente.

## MIGRATION 019

Criada, aplicada e registrada localmente:

supabase/sql/019-customer-auth-identity.sql

Adiciona:

customers.auth_user_id uuid NULL

com FK para:

auth.users(id)

ON DELETE SET NULL.

Também cria unicidade para auth_user_id preenchido.

Foi criada policy SELECT para permitir ao cliente autenticado visualizar somente o próprio customer:

auth_user_id = auth.uid()

Clientes legados continuam compatíveis porque auth_user_id é nullable.

NÃO reaplicar.

## MIGRATION 020

Criada, aplicada e registrada:

supabase/sql/020-customer-identity-claim.sql

Cria:

public.claim_customer_identity()

A função:

- usa auth.uid();
- consulta identidade real em auth.users;
- exige email_confirmed_at;
- não recebe customer_id;
- não recebe telefone;
- não recebe e-mail do browser;
- vincula somente quando existe exatamente um customer com o mesmo e-mail;
- recusa correspondência zero ou múltipla;
- recusa customer já vinculado a outra identidade;
- é idempotente para o mesmo usuário;
- não retorna dados privados.

EXECUTE:

authenticated.

anon/public:

sem acesso.

Não foi concedido SELECT geral de customers ao service_role apenas por conveniência.

NÃO reaplicar.

## ÁREA DO CLIENTE

Criados:

- app/minha-assinatura/page.tsx
- app/minha-assinatura/page.module.css
- app/minha-assinatura/actions.ts
- app/minha-assinatura/link-customer-button.tsx
- app/minha-assinatura/entrar/page.tsx
- app/minha-assinatura/entrar/customer-auth-form.tsx
- app/minha-assinatura/auth/callback/route.ts
- lib/customer-auth/identity.ts

Funcionalidades:

- criar acesso;
- login;
- confirmação de e-mail;
- callback;
- vinculação explícita do customer;
- logout;
- persistência do vínculo entre sessões;
- proteção server-side;
- nenhuma consulta privada por WhatsApp.

## TESTES DE IDENTIDADE

Foi criado customer específico para teste de identidade sem assinatura.

Foi criada nova conta Auth com e-mail real ainda não utilizado.

Confirmação de e-mail foi recebida de fato.

Após confirmação:

- callback funcionou;
- vínculo funcionou;
- área apresentou o customer correto.

Logout + novo login:

APROVADO.

O sistema voltou diretamente ao customer previamente vinculado, sem exigir novo claim.

## ISOLAMENTO ENTRE CLIENTES

Com uma identidade vinculada a um customer sem assinatura:

/minha-assinatura

apresentou:

Você ainda não possui uma assinatura comercial.

Nenhum dado da assinatura sandbox pertencente a outro customer foi revelado.

Isso validou o isolamento básico da área privada.

## MIGRATION 021

Criada, aplicada e registrada:

supabase/sql/021-my-subscription-read.sql

Cria:

public.get_my_subscription()

RPC somente leitura.

Ela:

- não recebe customer_id;
- não recebe subscription_id;
- deriva o customer exclusivamente de auth.uid();
- retorna DTO privado mínimo;
- não retorna telefone;
- não retorna notas;
- não retorna Charge ID;
- não retorna Cycle ID;
- não retorna Mercado Pago Order ID;
- não fabrica histórico para assinatura legada.

Retorna somente informações necessárias da assinatura comercial:

- plano;
- status;
- ciclo;
- período;
- carência;
- barbeiro;
- serviços.

NÃO reaplicar.

## VALIDAÇÃO COM ASSINATURA SANDBOX

Para permitir teste real da identidade da assinatura sandbox, foi alterado SOMENTE o e-mail do customer:

Teste Black Navalha

para um endereço real controlado durante o teste.

O customers.id foi preservado.

Não foram alterados:

- nome;
- WhatsApp;
- assinatura;
- ciclo;
- charge;
- Order ID;
- histórico financeiro;
- benefícios.

Foi criada e confirmada uma identidade Auth correspondente.

O vínculo foi realizado com sucesso.

Resultado visual em /minha-assinatura:

Cliente:

Teste Black Navalha

Plano:

Plano Mensal

Valor:

R$ 150,00 por mês

Status:

Ativa

Ciclo:

15/09/2026 até 14/10/2026

Barbeiro:

Rodrigo Alves Correa

Renovação:

Abre em 07/10/2026

Carência:

até 17/10/2026 00:00

Serviços:

- Barba Assinante Mensal;
- Cabelo + Barba Assinante Mensal;
- Cabelo Assinante Mensal;
- Raspado + Barba Assinante Mensal.

Nenhum Order ID ou histórico financeiro foi exposto ao cliente.

## MIGRATION 022

Criada, aplicada e registrada:

supabase/sql/022-authenticated-subscription-renewal-checkout.sql

Cria:

public.create_my_subscription_renewal_checkout(
  p_barber_id uuid,
  p_checkout_token uuid
)

Objetivo:

fronteira segura entre a identidade autenticada e o motor existente de renovação.

A função:

- exige auth.uid();
- exige email_confirmed_at;
- deriva customer por customers.auth_user_id;
- deriva a assinatura comercial do próprio customer;
- deriva plan_id do banco;
- utiliza nome/telefone/e-mail autoritativos do customer;
- não recebe customer_id do browser;
- não recebe subscription_id do browser;
- não recebe plan_id do browser;
- delega para create_subscription_checkout.

Portanto NÃO reconstrói:

- janela de 7 dias;
- capacidade;
- mesmo barbeiro;
- troca de barbeiro;
- hold;
- charge.

Essas regras continuam na infraestrutura existente/migration 018.

NÃO reaplicar.

## ROTA AUTENTICADA DE RENOVAÇÃO

Criada:

app/api/minha-assinatura/renovacao/route.ts

Entrada pública limitada a:

- barberId;
- checkoutToken.

A rota:

- revalida sessão com supabase.auth.getUser();
- exige e-mail confirmado;
- chama create_my_subscription_renewal_checkout;
- trata renovação antecipada;
- trata capacidade;
- não recebe nome/WhatsApp/e-mail/plano do browser.

Build reconheceu:

/api/minha-assinatura/renovacao

como rota dinâmica.

## MIGRATION 023

Criada, aplicada e registrada:

supabase/sql/023-my-subscription-barber-id.sql

Atualiza somente:

get_my_subscription()

para também retornar:

cycle.barber_id

O ID é necessário para identificar com segurança o barbeiro atual na futura escolha de renovação.

Nenhuma regra ou nova permissão foi adicionada.

NÃO reaplicar.

## UX DE RENOVAÇÃO AUTENTICADA

Criado:

app/minha-assinatura/renewal-checkout.tsx

O componente está conectado condicionalmente à área privada.

Ele somente é renderizado quando a janela informativa local indica renovação disponível.

Antes da janela:

- não mostra seletor de barbeiro;
- não mostra PREPARAR RENOVAÇÃO;
- não mostra GERAR PIX DA RENOVAÇÃO.

Validação em 17/09/2026:

Ciclo:

15/09/2026 → 14/10/2026

Resultado:

Abre em 07/10/2026

Sem controles de renovação.

APROVADO visualmente.

A migration 018 continua sendo a autoridade real, independentemente da UI.

## ESCOLHA DE BARBEIRO

Quando a janela estiver aberta, a UX preparada permite:

- manter barbeiro atual;
- escolher outro profissional disponível.

Usa:

get_public_subscription_barbers()

O barbeiro atual é considerado selecionável mesmo se a disponibilidade pública numérica for zero, pois a migration 018 preserva a própria vaga em renovação com o mesmo profissional.

Outro barbeiro exige disponibilidade.

A autoridade final continua no backend com SELECT ... FOR UPDATE.

## REUTILIZAÇÃO DO PIX

A renovação autenticada foi preparada para reutilizar:

/api/assinaturas/mercado-pago

e:

/api/assinaturas/status

Portanto NÃO foi criado segundo motor PIX.

Fluxo-alvo permanece:

identidade autenticada
→ assinatura correta
→ janela server-side
→ barbeiro
→ create_subscription_checkout
→ hold 30 minutos
→ nova subscription_charge pending
→ nova Order PIX
→ webhook HMAC
→ GET Order server-side
→ RPC transacional/idempotente
→ novo ciclo.

O browser NÃO confirma pagamento.

## PENDÊNCIAS CONHECIDAS / NÃO FABRICAR TESTE

Em 17/09/2026 a assinatura sandbox ainda NÃO está na janela real de renovação.

Portanto NÃO foram adulterados:

- datas;
- relógio;
- ciclo;
- capacidade;

para fabricar teste.

Ainda NÃO foi validado end-to-end pela nova área autenticada:

- abertura real da janela em 07/10/2026;
- seletor de barbeiro dentro da janela;
- renovação com mesmo barbeiro pela nova área;
- troca de barbeiro pela nova área;
- criação do novo PIX pela área autenticada;
- pagamento sandbox da renovação autenticada;
- novo ciclo após esse pagamento.

A regra server-side de renovação antecipada já havia sido validada anteriormente pela migration 018 com HTTP 409 e zero charge/hold.

## PENDÊNCIA UX ESPECÍFICA

O componente público de checkout já possui consulta final de status quando o cronômetro chega a zero.

O novo componente:

app/minha-assinatura/renewal-checkout.tsx

ainda deve receber futuramente o mesmo refinamento:

00:00
→ consulta final /api/assinaturas/status
→ somente depois declarar expiração.

Também é desejável após confirmação:

router.refresh()

para mostrar automaticamente o novo ciclo.

Essas duas melhorias não alteram a autoridade financeira e podem ser feitas antes do teste end-to-end da janela real.

## BUILDS

Foram executados builds durante toda a implementação.

Último build após conexão condicional da UX:

npm.cmd run build

APROVADO.

- compilação concluída;
- TypeScript sem erros;
- /minha-assinatura dinâmica;
- /minha-assinatura/entrar dinâmica;
- /minha-assinatura/auth/callback dinâmica;
- /api/minha-assinatura/renovacao dinâmica.

## BANCO

Migrations agora aplicadas:

007–023.

NÃO reaplicar nenhuma.

Novas desta frente:

019:
vínculo auth user → customer.

020:
claim seguro por identidade/e-mail confirmado.

021:
leitura privada da própria assinatura.

022:
wrapper autenticado de renovação.

023:
barber_id no DTO privado da assinatura.

## MERCADO PAGO

NÃO alterado nesta frente.

Permanece:

Orders API;
PIX avulso;
external_reference = subscription_charge.id;
webhook HMAC;
data.id ORIGINAL preservando maiúsculas;
GET Order server-side;
polling observacional;
RPC transacional/idempotente.

Nenhuma cobrança real foi realizada.

Nenhum PIX novo foi criado nesta frente.

## CAPACIDADE / RENOVAÇÃO

Permanecem:

30 assinantes por barbeiro.

SELECT ... FOR UPDATE obrigatório.

Hold PIX:

30 minutos.

Order expiration_time:

PT30M.

Janela antecipada:

7 dias.

Carência pós-ciclo:

2 dias.

Mesmo barbeiro não consome segunda vaga.

Troca de barbeiro exige capacidade real.

Pagamento pendente não transfere/libera antecipadamente a vaga anterior.

## COMISSÃO

Percentual/regra continuam NÃO definidos.

NÃO inventar percentual.

Nenhuma comissão foi criada.

## NÃO ALTERADO

Não foi alterado:

- /agendar;
- create_public_multi_appointment;
- integração dos benefícios;
- Mercado Pago Orders;
- webhook;
- HMAC;
- polling público;
- Admin financeiro;
- Admin de capacidade.

## GIT

Estado oficial antes desta frente:

main

HEAD/origin informado:

4a84590 Adiciona acompanhamento de renovacao no admin

Devem continuar fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

Nenhum commit/push foi autorizado nesta frente até este checkpoint.

## PRÓXIMO CHAT

Antes de qualquer ação:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint e os checkpoints financeiros recentes;
3. confirmar Git;
4. NÃO refazer identidade;
5. NÃO refazer PIX;
6. NÃO refazer renovação server-side;
7. NÃO refazer Admin.

Próxima evolução recomendada:

- revisar estado atual de renewal-checkout.tsx;
- acrescentar consulta final no 00:00;
- acrescentar refresh automático depois de paid + activated;
- validar build;
- validar mobile/desktop da área Minha assinatura;
- considerar adicionar entrada clara para Minha assinatura na experiência pública;
- testar renovação end-to-end quando houver janela real ou fixture isolada conscientemente autorizada.

Não alterar datas reais apenas para forçar a janela.

# FIM DO CHECKPOINT — 2026-09-17

---

# CHECKPOINT FINAL — MINHA ASSINATURA / UX DA RENOVAÇÃO AUTENTICADA E ACESSO PÚBLICO — 2026-09-17

## PRIORIDADE

Este checkpoint sucede e complementa:

- CHECKPOINT — MINHA ASSINATURA / IDENTIDADE SEGURA E BASE DA RENOVAÇÃO AUTENTICADA — 2026-09-17;
- CHECKPOINT FINAL — RENOVAÇÃO VOLUNTÁRIA DE ASSINATURA — 2026-09-17;
- CHECKPOINT — ASSINATURAS / ACOMPANHAMENTO AUTOMÁTICO DO PIX — 2026-09-17;
- CHECKPOINT FINAL — MERCADO PAGO / PIX ORDERS END-TO-END APROVADO E IDEMPOTENTE — 2026-09-15.

As regras financeiras, de capacidade, identidade e renovação server-side permanecem inalteradas.

## GIT

Commit funcional:

22c6e03 Refina renovacao autenticada e acesso do cliente

Push realizado com sucesso:

main → origin/main

HEAD e origin/main confirmados no mesmo commit:

22c6e03827cf6535a3e135c145cf7032d7d4e710

Estado após o push:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Esses dois arquivos devem continuar fora do Git.

Nunca usar:

git add .

## UX DA RENOVAÇÃO AUTENTICADA

Alterado:

- app/minha-assinatura/renewal-checkout.tsx

O componente agora espelha a proteção já existente no checkout público quando o cronômetro atinge 00:00.

Fluxo implementado:

cronômetro chega a 00:00
→ NÃO declara expiração imediatamente
→ apresenta "Verificando pagamento..."
→ faz consulta final para POST /api/assinaturas/status
→ se paid = true e activated = true, apresenta sucesso
→ somente caso contrário apresenta reserva expirada.

A consulta de status continua apenas observacional.

O navegador NÃO confirma pagamento.

O endpoint de status NÃO confirma pagamento.

A autoridade financeira permanece:

Mercado Pago Order
→ webhook HMAC
→ GET Order server-side
→ validações financeiras
→ RPC transacional/idempotente.

## REFRESH AUTOMÁTICO

Após confirmação simultânea:

paid = true
activated = true

o componente executa:

router.refresh()

Objetivo:

atualizar automaticamente os Server Components de /minha-assinatura para que o novo ciclo possa ser refletido sem depender de reload manual.

A mensagem de sucesso também foi atualizada para informar que os dados da assinatura são atualizados automaticamente.

## CRONÔMETRO

Permanece baseado exclusivamente em:

reservation_expires_at

retornado pelo servidor.

Nenhum timer financeiro independente foi criado.

Hold PIX permanece:

30 minutos.

Order expiration_time permanece:

PT30M.

## VALIDAÇÃO DA JANELA REAL

A assinatura sandbox continua com:

Cliente:
Teste Black Navalha

Plano:
Plano Mensal

Valor:
R$ 150,00 por mês

Status:
Ativa

Ciclo:
15/09/2026 → 14/10/2026

Barbeiro:
Rodrigo Alves Correa

Renovação:
Abre em 07/10/2026

Carência:
até 17/10/2026 00:00

Em 17/09/2026 a área privada continuou corretamente SEM apresentar:

- seletor de barbeiro;
- PREPARAR RENOVAÇÃO;
- GERAR PIX DA RENOVAÇÃO.

Nenhuma data, ciclo, capacidade ou relógio foi adulterado para forçar a janela.

Nenhum PIX foi criado para esta validação.

## VALIDAÇÃO DESKTOP E MOBILE

/minha-assinatura foi validada visualmente em desktop.

APROVADO.

Também foi validada em viewport mobile de aproximadamente 390 x 844.

APROVADO.

No mobile:

- cards permanecem contidos;
- não foi observado overflow horizontal;
- ciclo, barbeiro, renovação e carência permanecem legíveis;
- serviços permanecem corretamente apresentados;
- controles de renovação continuam ausentes antes da janela.

## ENTRADA PÚBLICA "MINHA ASSINATURA"

Alterados:

- app/page.tsx;
- app/page.module.css.

Foi adicionada entrada clara:

Minha assinatura

na navegação pública da Home.

Também foi adicionado acesso no rodapé.

Desktop:

- Minha assinatura aparece antes do CTA Agendar horário;
- navegação preservada;
- direção visual existente preservada.

Mobile:

o CSS anterior escondia todos os links comuns da navegação e preservava somente Agendar horário.

Foi criada exceção específica para Minha assinatura.

Em viewport mobile, o cabeçalho agora apresenta:

- marca Black Navalha;
- Minha assinatura;
- Agendar horário.

Os links Trabalhos, Serviços e Contato continuam ocultos no cabeçalho mobile, preservando a composição enxuta existente.

Validação visual mobile:

APROVADA.

## FLUXO HOME → MINHA ASSINATURA

O acesso Minha assinatura da Home foi testado no mobile.

Com sessão válida do cliente, abriu diretamente:

/minha-assinatura

e apresentou a assinatura correta:

Teste Black Navalha

Nenhuma consulta por WhatsApp foi introduzida.

A identidade continua baseada em Supabase Auth e customers.auth_user_id.

## BUILD

Build final executado após todas as alterações:

npm.cmd run build

Resultado:

APROVADO.

- Next.js 16.3.4;
- compilação concluída;
- TypeScript sem erros;
- rotas geradas normalmente.

## DIFF CHECK

Executado:

git diff --check

Resultado:

APROVADO.

Somente avisos conhecidos de futura conversão LF/CRLF, sem erro de whitespace.

## BANCO

Nenhuma alteração de banco nesta frente.

Nenhuma migration criada ou aplicada.

Migrations 007–023 permanecem aplicadas.

NÃO reaplicar nenhuma.

## MERCADO PAGO

Nenhuma alteração no motor financeiro.

Preservado:

- POST /v1/orders;
- GET /v1/orders/{id};
- external_reference = subscription_charge.id;
- provider_charge_id = Order ID ORD...;
- webhook HMAC;
- data.id ORIGINAL, inclusive maiúsculas;
- polling observacional;
- confirmação server-side;
- idempotência.

Nenhuma cobrança real foi realizada.

Nenhum PIX novo foi criado nesta frente.

## CAPACIDADE E RENOVAÇÃO

Permanecem:

- capacidade de 30 assinantes por barbeiro;
- SELECT ... FOR UPDATE obrigatório;
- hold PIX de 30 minutos;
- Order expiration_time PT30M;
- janela antecipada de 7 dias;
- carência pós-ciclo de 2 dias;
- mesmo barbeiro não consome segunda vaga;
- troca de barbeiro exige capacidade real;
- pagamento pendente não transfere/libera antecipadamente a vaga anterior.

Migration 018 continua sendo autoridade dessas regras.

## COMISSÃO

Percentual/regra continuam NÃO definidos.

NÃO inventar percentual.

Nenhuma comissão foi criada.

## NÃO ALTERADO

Não foi alterado:

- /agendar;
- create_public_multi_appointment;
- integração existente dos benefícios;
- criação PIX;
- webhook;
- HMAC;
- Admin financeiro;
- Admin de capacidade;
- renovação server-side;
- identidade segura já validada.

## TESTE END-TO-END DA RENOVAÇÃO AUTENTICADA

Continua conscientemente PENDENTE.

A assinatura sandbox entra na janela real somente em:

07/10/2026

Não adulterar datas/ciclo/relógio apenas para forçar esse teste.

Quando existir janela adequada ou fixture isolada conscientemente autorizada, validar:

identidade segura
→ assinatura correta
→ janela correta
→ barbeiro
→ capacidade
→ nova charge
→ nova Order PIX
→ confirmação server-side
→ novo ciclo
→ refresh automático da área privada.

Nenhuma cobrança real.

## ESTADO FINAL

UX segura de expiração da renovação autenticada:

IMPLEMENTADA.

Consulta final no 00:00:

IMPLEMENTADA.

Refresh automático após paid + activated:

IMPLEMENTADO.

Desktop /minha-assinatura:

APROVADO.

Mobile /minha-assinatura:

APROVADO.

Entrada pública Minha assinatura:

IMPLEMENTADA E VALIDADA.

Home mobile:

APROVADA após inclusão do acesso.

Build:

APROVADO.

Banco:

INALTERADO.

## PRÓXIMO PASSO

Versionar somente esta atualização de CONTEXTO-PROJETO.md quando houver autorização explícita.

Não incluir:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Depois do checkpoint documental, o estado esperado é somente:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

A renovação autenticada end-to-end deve aguardar a janela real de 07/10/2026 ou fixture isolada conscientemente autorizada.

# FIM DO CHECKPOINT — 2026-09-17
---

# CHECKPOINT DE CONTINUIDADE — RENOVAÇÃO AUTENTICADA E2E / RECUPERAÇÃO DE SENHA PENDENTE — 2026-09-17

## PRIORIDADE

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver conflito.

Preservar integralmente:

- CHECKPOINT FINAL — MERCADO PAGO / PIX ORDERS END-TO-END APROVADO E IDEMPOTENTE — 2026-09-15;
- CHECKPOINT — ASSINATURAS / ACOMPANHAMENTO AUTOMÁTICO DO PIX — 2026-09-17;
- CHECKPOINT FINAL — RENOVAÇÃO VOLUNTÁRIA DE ASSINATURA — 2026-09-17;
- CHECKPOINT — MINHA ASSINATURA / IDENTIDADE SEGURA E BASE DA RENOVAÇÃO AUTENTICADA — 2026-09-17;
- CHECKPOINT FINAL — MINHA ASSINATURA / UX DA RENOVAÇÃO AUTENTICADA E ACESSO PÚBLICO — 2026-09-17.

## GIT OFICIAL VERSIONADO

Branch:

main

HEAD/origin antes do trabalho local posterior:

8ca5116 Registra refinamento da Minha Assinatura

Commit funcional anterior:

22c6e03 Refina renovacao autenticada e acesso do cliente

main e origin/main estavam sincronizados em 8ca5116.

Devem continuar fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

## RENOVAÇÃO AUTENTICADA — TESTE END-TO-END AGORA APROVADO

A pendência anterior de teste E2E da renovação autenticada foi exercitada com uma FIXTURE ISOLADA conscientemente autorizada.

Não foram adulterados:

- ciclo da assinatura sandbox Teste Black Navalha;
- datas da assinatura sandbox original;
- relógio do banco;
- histórico financeiro da assinatura sandbox original.

A assinatura original Teste Black Navalha permanece separada.

## FIXTURE QA

Foi criada uma fixture isolada identificada como:

Fixture Renovacao Autenticada

Foi utilizado customer próprio, identidade Auth própria, assinatura própria e ciclo-base sintético próprio.

O ciclo-base foi criado deliberadamente como dado de QA para permitir teste dentro da janela de renovação sem alterar a assinatura sandbox principal.

Não foi criada charge histórica fictícia para o ciclo-base.

Não foi criado payment_event histórico fictício.

Não foi criada comissão.

A fixture utiliza o Plano Mensal e Rodrigo Alves Correa.

A identidade foi vinculada por:

Supabase Auth
→ customers.auth_user_id

preservando o modelo seguro da área privada.

## JANELA DA FIXTURE

Antes da renovação, a área privada apresentou:

Ciclo:
22/08/2026 até 21/09/2026

Barbeiro:
Rodrigo Alves Correa

Renovação:
Disponível

Carência:
até 24/09/2026 00:00

Os quatro serviços subscriber_service foram apresentados corretamente.

Pela primeira vez a UX autenticada apresentou, dentro de uma janela válida:

- seleção do barbeiro;
- indicação Seu barbeiro atual;
- PREPARAR RENOVAÇÃO.

## PREPARAÇÃO AUTENTICADA

Foi clicado uma única vez:

PREPARAR RENOVAÇÃO

Resultado:

APROVADO.

Foi criado pelo motor real:

identidade autenticada
→ create_my_subscription_renewal_checkout
→ create_subscription_checkout
→ regra da migration 018
→ hold
→ subscription_charge pending.

O cronômetro iniciou próximo de:

30:00

e permaneceu baseado em:

reservation_expires_at.

Mesmo barbeiro foi corretamente aceito sem exigir segunda vaga.

## PIX DA RENOVAÇÃO

Foi clicado uma única vez:

GERAR PIX DA RENOVAÇÃO

Resultado:

APROVADO.

A interface apresentou:

- QR Code;
- Pix Copia e Cola;
- cronômetro;
- aviso de que a confirmação é feita pelo servidor.

Nenhum banco/app PIX real foi utilizado.

Nenhuma transferência real foi realizada.

## ORDER PIX DA RENOVAÇÃO

Charge:

0998f703-d133-441f-b09d-c79bb07375bb

Order sandbox:

ORDTST01M2S2F4T3ZHM0C8TBTCDK3W74

Payment sandbox:

PAY01M2S2F4TTQ2HJ5M1KYBK8AD0D

GET server-side da Order confirmou:

Order:
processed / accredited

Payment:
processed / accredited

external_reference:
0998f703-d133-441f-b09d-c79bb07375bb

currency:
BRL

total_amount:
150.00

Portanto a correlação financeira da renovação estava correta.

## WEBHOOK DA RENOVAÇÃO

Foi aberto novo Cloudflare Quick Tunnel temporário:

https://want-grown-disco-rated.trycloudflare.com

Webhook de teste utilizado:

https://want-grown-disco-rated.trycloudflare.com/api/mercado-pago/webhook

A URL é TEMPORÁRIA e NÃO deve ser presumida válida em outra sessão.

No Mercado Pago permaneceu selecionado somente:

Order (Mercado Pago)

O segredo HMAC NÃO foi regenerado.

Foi utilizada a ferramenta oficial de simulação com a MESMA Order da renovação.

Resultado:

HTTP 200 OK

O body fictício do simulador NÃO foi usado como autoridade financeira.

O webhook continuou consultando GET /v1/orders/{id} server-side.

## REFRESH AUTOMÁTICO — VALIDADO E2E

Após o HTTP 200 do webhook, a aba /minha-assinatura permaneceu aberta.

NÃO foi utilizado F5 manual.

O polling observou:

paid = true
activated = true

e o fluxo com:

router.refresh()

atualizou automaticamente a página.

A tela passou do ciclo:

22/08/2026 → 21/09/2026

para:

22/09/2026 → 21/10/2026

Também passou a apresentar:

Renovação:
Abre em 14/10/2026

Carência:
até 24/10/2026 00:00

Os controles de renovação desapareceram novamente porque o novo ciclo ficou fora da janela antecipada.

Portanto o refresh automático foi VALIDADO end-to-end.

## AUDITORIA FINAL DA RENOVAÇÃO

Auditoria somente leitura confirmou:

subscription_status:
active

starts_at:
2026-08-22

expires_at:
2026-10-21

total_cycles:
2

paid_cycles:
2

commissions:
0

Cobrança da renovação:

status:
paid

amount:
150.00

currency:
BRL

provider_charge_id:
ORDTST01M2S2F4T3ZHM0C8TBTCDK3W74

cycle_id:
preenchido

paid_at:
preenchido

Hold:

status:
consumed

Portanto foi validado:

identidade segura
→ assinatura correta
→ janela correta
→ mesmo barbeiro
→ capacidade
→ hold
→ nova charge
→ nova Order PIX
→ confirmação Mercado Pago sandbox
→ webhook HMAC
→ GET Order server-side
→ RPC transacional/idempotente
→ novo ciclo
→ polling
→ router.refresh()
→ novo ciclo exibido automaticamente.

Nenhuma cobrança real.

Nenhuma comissão.

## RECUPERAÇÃO DE SENHA — NOVA FRENTE LOCAL

Durante a criação da identidade fixture ocorreu uma situação em que a senha utilizada no signup não ficou conhecida pelo responsável.

Isso revelou uma lacuna real de produto:

a área do cliente não possuía fluxo de recuperação de senha.

Foi iniciada implementação local de recuperação.

Arquivos locais envolvidos:

- app/minha-assinatura/entrar/customer-auth-form.tsx;
- app/minha-assinatura/recuperar-senha/page.tsx;
- app/minha-assinatura/recuperar-senha/recover-password-form.tsx;
- app/minha-assinatura/auth/recuperacao/route.ts;
- app/minha-assinatura/redefinir-senha/page.tsx;
- app/minha-assinatura/redefinir-senha/reset-password-form.tsx.

## VALIDAÇÃO DE SENHA

customer-auth-form.tsx recebeu validação programática adicional:

- e-mail válido;
- senha com no mínimo 6 caracteres.

A validação HTML required/minLength já existia e foi preservada.

Foi adicionado acesso:

Esqueci minha senha

no modo de login.

## FLUXO DE RECUPERAÇÃO IMPLEMENTADO LOCALMENTE

Fluxo preparado:

/minha-assinatura/recuperar-senha
→ resetPasswordForEmail
→ callback server-side
→ exchangeCodeForSession
→ /minha-assinatura/redefinir-senha
→ updateUser({ password })
→ /minha-assinatura.

Foi criada Route Handler:

/minha-assinatura/auth/recuperacao

A nova Redirect URL foi adicionada no Supabase:

http://localhost:3000/minha-assinatura/auth/recuperacao

A Redirect URL anterior de confirmação foi preservada:

http://localhost:3000/minha-assinatura/auth/callback

Site URL permaneceu:

http://localhost:3000

## BUILD DA RECUPERAÇÃO

A primeira versão baseada em useSearchParams revelou exigência do Next.js 16 de Suspense durante build.

A implementação foi posteriormente ajustada para callback server-side e página protegida por sessão.

Build final após o ajuste:

npm.cmd run build

APROVADO.

Rotas reconhecidas:

- /minha-assinatura/auth/recuperacao;
- /minha-assinatura/recuperar-senha;
- /minha-assinatura/redefinir-senha.

git diff --check:

APROVADO.

## RATE LIMIT DE E-MAIL

O teste real da recuperação encontrou:

HTTP 429

code:
over_email_send_rate_limit

message:
email rate limit exceeded

No Supabase Authentication → Rate Limits foi confirmado:

Rate limit for sending emails:
2 emails/h

O limite NÃO foi alterado.

Foi decidido não enfraquecer a configuração apenas para destravar a fixture.

A UI passou a tratar especificamente status 429 com mensagem:

Muitas solicitações foram feitas. Aguarde alguns minutos e tente novamente.

A instrumentação temporária usada para diagnosticar o erro foi REMOVIDA.

## RECUPERAÇÃO DE SENHA — STATUS CORRETO

IMPLEMENTAÇÃO:

PRONTA LOCALMENTE.

BUILD:

APROVADO.

TRATAMENTO DE RATE LIMIT:

VALIDADO.

FLUXO COMPLETO DE E-MAIL → NOVA SENHA:

AINDA NÃO VALIDADO devido exclusivamente ao limite 2 emails/h.

NÃO registrar a recuperação como concluída até executar uma solicitação real depois da liberação do rate limit e validar:

e-mail
→ callback
→ sessão
→ nova senha
→ login.

## ALTERAÇÃO ADMINISTRATIVA EXCLUSIVA DA FIXTURE

Para não bloquear o E2E da renovação, foi autorizada alteração administrativa da senha somente da identidade Auth da fixture.

A senha foi atualizada localmente usando a Admin API e SUPABASE_SERVICE_ROLE_KEY sem imprimir segredo ou senha.

Isso foi exclusivamente para a fixture QA.

Não foi utilizado como substituto da futura validação do fluxo público de recuperação.

## BANCO

Nenhuma migration nova foi criada para a fixture ou recuperação de senha.

Migrations 007–023 permanecem aplicadas.

NÃO reaplicar nenhuma.

A fixture constitui DADO DE QA, não alteração estrutural do schema.

## CAPACIDADE / PIX / RENOVAÇÃO

Permanecem inalterados:

- capacidade: 30 assinantes por barbeiro;
- SELECT ... FOR UPDATE obrigatório;
- hold PIX: 30 minutos;
- Order expiration_time: PT30M;
- janela antecipada: 7 dias;
- carência: 2 dias;
- mesmo barbeiro não consome segunda vaga;
- troca de barbeiro exige capacidade;
- pagamento pendente não libera antecipadamente vaga anterior.

## MERCADO PAGO

Motor financeiro permanece aprovado:

POST /v1/orders
GET /v1/orders/{id}

external_reference = subscription_charge.id

Webhook HMAC preservando data.id ORIGINAL, inclusive maiúsculas.

Browser NÃO confirma pagamento.

Polling apenas observa estado interno.

## COMISSÃO

Percentual/regra continuam NÃO definidos.

NÃO inventar percentual.

Auditoria da renovação fixture:

commissions = 0

## NÃO ALTERAR

Não alterar:

- /agendar;
- create_public_multi_appointment;
- integração existente dos benefícios;
- motor PIX;
- webhook;
- HMAC;
- regras server-side de renovação;
- Admin financeiro;
- Admin de capacidade.

## WORKING TREE ESPERADO NESTE MOMENTO

Além dos arquivos auxiliares, existem alterações locais da recuperação de senha ainda NÃO versionadas.

Esperado:

M app/minha-assinatura/entrar/customer-auth-form.tsx

Novos diretórios/arquivos:

- app/minha-assinatura/auth/recuperacao/
- app/minha-assinatura/recuperar-senha/
- app/minha-assinatura/redefinir-senha/

E continuam untracked:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt.

Não descartar a recuperação de senha.

Não commitar como concluída antes do teste completo.

## PRÓXIMA FRENTE RECOMENDADA — NOVO CHAT

Depois de ler integralmente o contexto:

1. preservar as alterações locais de recuperação de senha;
2. NÃO repetir o E2E de renovação autenticada, que agora está APROVADO;
3. quando o rate limit permitir, concluir uma única validação real da recuperação de senha;
4. não alterar Rate Limits apenas para o teste;
5. não criar novo PIX para repetir teste já aprovado.

Próxima evolução funcional recomendada:

CENTRAL DO CLIENTE / MINHA ASSINATURA

Adicionar uma ação permanente e clara:

AGENDAR HORÁRIO

em:

/minha-assinatura

mesmo fora do fluxo de confirmação de pagamento.

Objetivo:

permitir que o assinante autenticado utilize facilmente seus benefícios e siga para o agendamento existente.

Regras:

- apenas criar ponte para /agendar;
- NÃO reconstruir /agendar;
- NÃO selecionar serviço automaticamente sem decisão específica;
- NÃO alterar benefício/preço;
- NÃO alterar banco;
- preservar identidade e renovação;
- validar desktop/mobile;
- npm.cmd run build;
- git diff --check.

Antes de implementar, inspecionar somente:

app/minha-assinatura/page.tsx

e CSS diretamente necessário.

## GIT / CHECKPOINT

Ainda NÃO fazer commit/push automaticamente.

Commit/push continuam exigindo autorização explícita.

Antes de qualquer checkpoint futuro:

- revisar alterações locais da recuperação;
- manter ASSINATURAS-LOTE.txt fora;
- manter CODIGO-COMPLETO.txt fora;
- manter .env.local fora;
- nunca usar git add ..

# FIM DO CHECKPOINT DE CONTINUIDADE — 2026-09-17
---

# CHECKPOINT DE CONTINUIDADE — CENTRAL DO CLIENTE / AGENDAMENTO E HISTÓRICO — 2026-09-18

## PRIORIDADE

Este é o checkpoint funcional mais recente e deve ser lido em conjunto com:

- CHECKPOINT DE CONTINUIDADE — RENOVAÇÃO AUTENTICADA E2E / RECUPERAÇÃO DE SENHA PENDENTE — 2026-09-17;
- CHECKPOINT FINAL — MINHA ASSINATURA / UX DA RENOVAÇÃO AUTENTICADA E ACESSO PÚBLICO — 2026-09-17;
- CHECKPOINT — MINHA ASSINATURA / IDENTIDADE SEGURA E BASE DA RENOVAÇÃO AUTENTICADA — 2026-09-17;
- CHECKPOINT FINAL — RENOVAÇÃO VOLUNTÁRIA DE ASSINATURA — 2026-09-17;
- CHECKPOINT FINAL — MERCADO PAGO / PIX ORDERS END-TO-END APROVADO E IDEMPOTENTE — 2026-09-15.

Quando houver conflito, os checkpoints mais recentes prevalecem.

## GIT OFICIAL

Branch:

main

HEAD/origin atual:

f02b68a Adiciona historico de atendimentos na Minha Assinatura

Commits recentes desta continuidade:

ba709dd Adiciona agendamento na Minha Assinatura
78845fb Adiciona proximos agendamentos na Minha Assinatura
f02b68a Adiciona historico de atendimentos na Minha Assinatura

HEAD, main e origin/main foram confirmados sincronizados em f02b68a.

## CTA PERMANENTE — AGENDAR HORÁRIO

Foi adicionada à área autenticada:

/minha-assinatura

uma ação permanente:

AGENDAR HORÁRIO

Destino:

/agendar

Objetivo:

permitir que o assinante autenticado acesse diretamente o fluxo existente de agendamento, mesmo fora do fluxo de confirmação de pagamento ou renovação.

Regras preservadas:

- /agendar NÃO foi reconstruído;
- nenhum serviço é selecionado automaticamente;
- preço/benefício NÃO foi alterado;
- banco NÃO foi alterado para este CTA;
- identidade e renovação permaneceram intactas.

Validação:

desktop APROVADO;
mobile aproximadamente 390 x 844 APROVADO;
navegação para /agendar APROVADA;
passo 1 "Escolha seus serviços" aberto corretamente;
nenhum serviço pré-selecionado.

Build:

APROVADO.

git diff --check:

APROVADO.

Commit:

ba709dd Adiciona agendamento na Minha Assinatura

## PRÓXIMOS AGENDAMENTOS

Foi adicionada à Central do Cliente uma seção somente leitura:

PRÓXIMOS AGENDAMENTOS

Objetivo:

mostrar ao cliente autenticado somente os próprios horários futuros efetivos.

Arquivos versionados:

- app/minha-assinatura/page.tsx;
- app/minha-assinatura/page.module.css;
- app/minha-assinatura/upcoming-appointments.tsx;
- lib/customer-auth/appointments.ts;
- supabase/sql/024-my-appointments-read.sql.

## MIGRATION 024

Criada, aplicada e versionada:

supabase/sql/024-my-appointments-read.sql

Resultado da aplicação no Supabase:

Success. No rows returned

NÃO reaplicar.

A migration cria:

public.get_my_appointments()

Características de segurança:

- não recebe customer_id;
- não recebe telefone;
- não recebe e-mail do browser;
- exige auth.uid();
- exige e-mail confirmado;
- deriva customers.id através de customers.auth_user_id = auth.uid();
- retorna somente appointments do próprio customer;
- retorna DTO mínimo;
- não expõe notas;
- não expõe dados financeiros do Mercado Pago;
- não expõe informações de outro cliente;
- EXECUTE concedido somente a authenticated;
- public/anon sem execução.

Dados retornados:

- appointment id;
- start_at;
- end_at;
- price histórico;
- status;
- nome do barbeiro;
- nomes dos serviços.

A RPC é somente leitura.

Nenhuma alteração foi feita em /agendar.

## REGRA DE PRÓXIMOS AGENDAMENTOS

A página considera como próximos:

status:
scheduled
ou
confirmed

e:

end_at >= horário atual.

A leitura segura fica em:

lib/customer-auth/appointments.ts

através de:

getMyAppointments()

A UI fica em:

app/minha-assinatura/upcoming-appointments.tsx

Validação com identidade atual:

nenhum horário futuro existente.

Estado vazio real apresentado:

"Você não possui próximos horários agendados."

Nenhum agendamento artificial foi criado apenas para teste.

Desktop:

APROVADO.

Mobile:

APROVADO.

Build:

APROVADO.

git diff --check:

APROVADO.

Commit:

78845fb Adiciona proximos agendamentos na Minha Assinatura

## HISTÓRICO DE ATENDIMENTOS

A mesma RPC 024 foi reutilizada.

Nenhuma migration nova foi necessária.

Foi adicionada seção:

HISTÓRICO DE ATENDIMENTOS

A UI reutiliza o componente de agendamentos existente com variante de histórico.

Status conhecidos apresentados:

scheduled — Agendado
confirmed — Confirmado
completed — Concluído
cancelled — Cancelado
no_show — Não compareceu

O histórico recebe agendamentos que não são próximos e que:

- já encerraram temporalmente;
- ou possuem status completed;
- ou possuem status cancelled;
- ou possuem status no_show.

Ordenação:

mais recente primeiro.

Um atendimento cancelado/no_show futuro não aparece como próximo atendimento efetivo e pode aparecer imediatamente no histórico.

A apresentação reutiliza:

- data;
- horário;
- profissional;
- serviços;
- status.

Nenhum dado administrativo adicional é exposto.

Validação com identidade atual:

nenhum atendimento passado disponível.

Estado vazio real apresentado:

"Você ainda não possui atendimentos no histórico."

Nenhum dado artificial foi criado para preencher o histórico.

Desktop:

APROVADO.

Mobile aproximadamente 390 x 844:

APROVADO.

Sem overflow observado.

Console do navegador:

sem erro da aplicação durante a validação.

AGENDAR HORÁRIO permaneceu preservado.

Build final:

APROVADO.

git diff --check:

APROVADO.

Commit:

f02b68a Adiciona historico de atendimentos na Minha Assinatura

## RECUPERAÇÃO DE SENHA — CONTINUA PENDENTE

As alterações locais de recuperação de senha foram conscientemente preservadas e NÃO entraram nos commits da Central do Cliente.

Estado local esperado:

M app/minha-assinatura/entrar/customer-auth-form.tsx

Novos diretórios/arquivos:

- app/minha-assinatura/auth/recuperacao/
- app/minha-assinatura/recuperar-senha/
- app/minha-assinatura/redefinir-senha/

Implementação continua pronta localmente e com build aprovado anteriormente.

Fluxo completo continua NÃO validado por causa do rate limit de e-mail do Supabase:

2 emails/h.

Não alterar Rate Limit apenas para o teste.

Não marcar recuperação como concluída.

Quando oportuno, fazer somente UMA tentativa real e validar:

e-mail
→ callback
→ sessão
→ nova senha
→ login.

Nesta continuidade foi decidido conscientemente adiar esse teste.

## WORKING TREE APÓS OS COMMITS FUNCIONAIS

Estado confirmado após f02b68a:

M CONTEXTO-PROJETO.md
M app/minha-assinatura/entrar/customer-auth-form.tsx
?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt
?? app/minha-assinatura/auth/recuperacao/
?? app/minha-assinatura/recuperar-senha/
?? app/minha-assinatura/redefinir-senha/

Não descartar esses arquivos locais de recuperação.

ASSINATURAS-LOTE.txt e CODIGO-COMPLETO.txt devem continuar fora do Git.

.env.local nunca deve ser versionado.

Nunca usar:

git add .

## BANCO

Migrations aplicadas agora:

007–024.

NÃO reaplicar nenhuma.

Migration nova desta continuidade:

024 — leitura segura dos próprios agendamentos.

Nenhuma outra alteração de banco foi realizada nesta continuidade.

## REGRAS FINANCEIRAS PRESERVADAS

Plano Mensal:

pagamento mensal avulso via PIX.

SEM renovação automática Mercado Pago.

Orders API:

POST /v1/orders
GET /v1/orders/{id}

external_reference:

subscription_charge.id

provider_charge_id:

Order ID ORD...

Webhook:

/api/mercado-pago/webhook

HMAC:

preservar data.id ORIGINAL, inclusive maiúsculas.

Browser NÃO confirma pagamento.

Polling apenas observa o estado interno.

E2E PIX e renovação autenticada já foram aprovados anteriormente.

NÃO repetir sem necessidade.

## CAPACIDADE / RENOVAÇÃO

Preservar:

30 assinantes por barbeiro.

SELECT ... FOR UPDATE obrigatório.

Hold PIX:

30 minutos.

Order expiration_time:

PT30M.

Janela antecipada de renovação:

7 dias.

Carência:

2 dias.

Mesmo barbeiro em renovação:

não consome segunda vaga.

Troca de barbeiro:

exige capacidade real.

Pagamento pendente:

não transfere/libera antecipadamente vaga anterior.

## COMISSÃO

Percentual/regra continuam NÃO definidos.

NÃO inventar percentual.

NÃO criar comissão.

## NÃO ALTERAR

Não alterar sem nova necessidade concreta:

- /agendar;
- create_public_multi_appointment;
- integração existente dos benefícios;
- motor PIX;
- Orders API;
- webhook;
- HMAC;
- renovação server-side;
- Admin financeiro;
- Admin de capacidade.

## PRÓXIMA FRENTE — GESTÃO DE AGENDAMENTOS PELO CLIENTE

Próxima evolução escolhida:

GESTÃO PELO CLIENTE

na Central:

/minha-assinatura

Direção desejada:

permitir ao cliente autenticado gerenciar os próprios agendamentos.

Antes de implementar qualquer mutação, definir conscientemente as regras de negócio.

Primeira funcionalidade recomendada:

CANCELAMENTO DE AGENDAMENTO PELO CLIENTE.

Questões que precisam ser definidas antes da escrita:

- quais status podem ser cancelados pelo cliente;
- antecedência mínima para cancelamento;
- se confirmed pode ser cancelado;
- comportamento para agendamento no mesmo dia;
- se existe necessidade de motivo;
- como tratar horário já iniciado/passado;
- se cancelamento deve apenas alterar status para cancelled;
- se haverá futura remarcação como operação separada.

Segurança obrigatória:

- identidade derivada de auth.uid();
- nunca receber customer_id do browser como autoridade;
- nunca permitir alterar appointment de outro customer;
- revalidar sessão server-side;
- mutação protegida no banco;
- preservar regras administrativas existentes;
- não conceder UPDATE público amplo em appointments.

A arquitetura recomendada é criar fronteira server-side/RPC específica para o próprio cliente, em vez de reutilizar a permissão administrativa de UPDATE.

Qualquer nova alteração de banco deve ser versionada no próximo número disponível:

025.

Antes de aplicar migration:

apresentar regra/modelagem e obter autorização explícita.

REMARCAÇÃO:

não implementar automaticamente junto com cancelamento.

Tratar como etapa separada após cancelamento estar definido/testado.

## FORMA DE TRABALHO

No próximo chat:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint e os checkpoints financeiros/identidade recentes;
3. confirmar HEAD f02b68a ou checkpoint documental posterior;
4. preservar recuperação de senha local;
5. não repetir E2E PIX/renovação;
6. não reaplicar migrations 007–024;
7. começar diretamente pela definição objetiva das regras de cancelamento do cliente;
8. evitar auditoria geral;
9. inspecionar somente arquivos/contratos necessários;
10. usar comandos PowerShell completos;
11. usar npm.cmd;
12. não usar comandos com exit $LASTEXITCODE no Terminal integrado, pois isso pode encerrar a sessão PowerShell;
13. preferir comandos sem pager;
14. commit/push somente com autorização explícita.

Interromper para:

- operação destrutiva;
- nova credencial;
- cobrança real;
- decisão financeira indefinida;
- alteração relevante de banco;
- commit/push.

# FIM DO CHECKPOINT — 2026-09-18

---

# CHECKPOINT FINAL — CENTRAL DO CLIENTE / CANCELAMENTO, AGENDAMENTO AUTENTICADO E RECUPERAÇÃO DE SENHA — 2026-09-18

## PRIORIDADE

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver conflito.

Preservar integralmente os checkpoints consolidados de:

- Mercado Pago PIX Orders E2E aprovado/idempotente;
- acompanhamento automático do PIX;
- renovação voluntária;
- identidade segura da Minha Assinatura;
- renovação autenticada E2E;
- Central do Cliente com próximos agendamentos e histórico.

## GIT OFICIAL

Branch:

main

HEAD/origin:

8c01a61 Adiciona gestao de agendamentos e recuperacao de senha

Push realizado com sucesso:

main → origin/main

Working tree após o push:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Esses arquivos permanecem fora do Git.

.env.local nunca deve ser versionado.

Nunca usar:

git add .

## CANCELAMENTO DE AGENDAMENTO PELO CLIENTE

Status:

CONCLUÍDO E VALIDADO END-TO-END.

Rota:

/minha-assinatura

Regra definida:

- scheduled pode ser cancelado;
- confirmed pode ser cancelado;
- completed não pode;
- no_show não pode;
- cancelled é tratado idempotentemente;
- antecedência mínima: 1 hora antes de start_at;
- exatamente 1 hora antes ainda é permitido;
- menos de 1 hora é recusado;
- cancelamento no mesmo dia é permitido quando respeita a antecedência;
- horário iniciado/passado é recusado;
- motivo não é obrigatório nesta primeira versão;
- cancelamento altera somente appointments.status para cancelled;
- appointment e histórico não são apagados;
- remarcação NÃO foi implementada e permanece etapa separada.

## SEGURANÇA DO CANCELAMENTO

Migration criada, aplicada e versionada:

supabase/sql/025-customer-appointment-cancellation.sql

Cria:

public.cancel_my_appointment(p_appointment_id uuid)

A RPC:

- deriva identidade exclusivamente de auth.uid();
- exige e-mail confirmado;
- resolve customers.id por customers.auth_user_id;
- não recebe customer_id do browser;
- garante que appointment pertence ao próprio cliente;
- usa FOR UPDATE no appointment;
- revalida status;
- revalida prazo usando now() no PostgreSQL;
- permite somente scheduled/confirmed;
- altera somente status para cancelled;
- não concede UPDATE amplo em appointments;
- EXECUTE somente para authenticated;
- anon/public sem execução.

NÃO reaplicar migration 025.

## IMPLEMENTAÇÃO DO CANCELAMENTO

Arquivos:

- app/minha-assinatura/appointment-actions.ts
- app/minha-assinatura/cancel-appointment-button.tsx
- app/minha-assinatura/upcoming-appointments.tsx
- app/minha-assinatura/page.module.css

A Server Action:

- revalida sessão com supabase.auth.getUser();
- exige e-mail confirmado;
- chama cancel_my_appointment;
- não recebe customer_id;
- traduz erros conhecidos para mensagens amigáveis;
- revalida /minha-assinatura após sucesso.

A UI:

- mostra CANCELAR AGENDAMENTO somente nos próximos agendamentos scheduled/confirmed;
- informa a regra de 1 hora;
- pede confirmação antes de cancelar;
- desabilita visualmente quando o prazo local já encerrou;
- não considera o browser autoridade sobre o prazo;
- atualiza a Central após cancelamento.

## TESTE E2E DO CANCELAMENTO

Foi criado um agendamento real controlado pelo fluxo normal /agendar para a identidade autenticada da fixture.

Atendimento:

18/09/2026
09:00 às 09:30

Profissional:

Rodrigo Alves Correa

Serviço:

Barba Assinante Mensal

Estado inicial:

Agendado

O cancelamento foi realizado uma única vez pela Central do Cliente.

Resultado:

- saiu de Próximos agendamentos;
- apareceu em Histórico de atendimentos;
- status passou para Cancelado;
- data preservada;
- horário preservado;
- profissional preservado;
- serviço preservado;
- nenhum histórico apagado.

E2E:

APROVADO.

## /AGENDAR — CLIENTE AUTENTICADO

Foi identificada uma necessidade de UX durante o E2E:

o cliente autenticado na Minha Assinatura ainda precisava redigitar Nome e WhatsApp no passo 5 do agendamento.

Foi implementada melhoria sem tornar /agendar privado.

Arquivos:

- app/agendar/page.tsx
- app/agendar/booking-flow.tsx

Comportamento atual:

Cliente anônimo:

- fluxo público permanece;
- informa Nome e WhatsApp normalmente.

Cliente autenticado, com e-mail confirmado e customer vinculado:

- customer é resolvido server-side por auth_user_id = auth.uid();
- Nome é preenchido automaticamente;
- WhatsApp é preenchido automaticamente;
- campos ficam bloqueados para edição no passo 5;
- texto do passo 5 informa que os dados já estão vinculados à conta.

Não é enviado customer_id do browser.

create_public_multi_appointment NÃO foi alterada.

Benefício/preço NÃO foi reconstruído.

Teste confirmou serviço de assinatura com:

R$ 0,00

preservando a regra existente.

## LEITURA PÚBLICA PARA CLIENTE AUTENTICADO

Durante o teste foi identificado que algumas policies públicas antigas permitiam leitura para anon, mas não para cliente authenticated não-admin.

Isso fazia o cliente autenticado perder dados necessários ao mesmo /agendar público.

Foram corrigidas somente as leituras comprovadamente necessárias.

### Migration 026

supabase/sql/026-authenticated-barber-services-read.sql

Permite a authenticated visualizar barber_services de barbeiros ativos, seguindo a mesma necessidade pública do agendamento.

Somente SELECT.

Nenhum INSERT/UPDATE/DELETE adicional.

APLICADA.

NÃO reaplicar.

### Migration 027

supabase/sql/027-authenticated-active-barbers-read.sql

Permite a authenticated visualizar somente barbeiros ativos.

Somente SELECT.

APLICADA.

NÃO reaplicar.

### Migration 028

supabase/sql/028-authenticated-working-hours-read.sql

Permite a authenticated visualizar somente jornadas ativas de barbeiros ativos.

Somente SELECT.

APLICADA.

NÃO reaplicar.

Após 026–028:

- Rodrigo Alves Correa voltou a aparecer no passo Profissional;
- datas de atendimento voltaram a aparecer;
- horários funcionaram;
- passo 5 foi alcançado normalmente;
- cliente autenticado teve Nome/WhatsApp preenchidos;
- agendamento foi concluído normalmente.

Não foi concedida escrita pública adicional.

## RECUPERAÇÃO DE SENHA

Status anterior:

PENDENTE por rate limit.

Status atual:

CONCLUÍDA E VALIDADA END-TO-END.

Arquivos versionados:

- app/minha-assinatura/entrar/customer-auth-form.tsx
- app/minha-assinatura/auth/recuperacao/route.ts
- app/minha-assinatura/recuperar-senha/page.tsx
- app/minha-assinatura/recuperar-senha/recover-password-form.tsx
- app/minha-assinatura/redefinir-senha/page.tsx
- app/minha-assinatura/redefinir-senha/reset-password-form.tsx

Fluxo validado:

/minha-assinatura/entrar
→ Esqueci minha senha
→ /minha-assinatura/recuperar-senha
→ resetPasswordForEmail
→ e-mail real recebido
→ /minha-assinatura/auth/recuperacao
→ exchangeCodeForSession
→ /minha-assinatura/redefinir-senha
→ updateUser({ password })
→ nova senha gravada.

O rate limit do Supabase permaneceu:

2 emails/h

e NÃO foi alterado apenas para teste.

O tratamento amigável de HTTP 429 foi preservado.

## VALIDAÇÃO DA NOVA SENHA

Após redefinição:

- login com a nova senha: APROVADO;
- senha antiga: rejeitada como E-mail ou senha inválidos.

Portanto a recuperação pública está validada funcionalmente.

## PÓS-RESET

Durante o primeiro E2E foi observado que a sessão de recovery mantinha o usuário autenticado e a implementação redirecionava diretamente para /minha-assinatura.

Foi decidido que a UX correta é exigir login consciente após redefinir a senha.

reset-password-form.tsx foi ajustado para:

updateUser({ password })
→ supabase.auth.signOut()
→ /minha-assinatura/entrar

Build após o ajuste:

APROVADO.

Não foi enviado novo e-mail apenas para repetir todo o fluxo depois dessa pequena alteração de navegação.

A nova senha em si foi validada por login real e a antiga foi recusada.

## BUILD FINAL

Executado após as alterações:

npm.cmd run build

Resultado:

APROVADO.

- Next.js 16.3.4;
- compilação concluída;
- TypeScript sem erros;
- rotas de recuperação reconhecidas;
- /agendar reconhecida;
- /minha-assinatura reconhecida.

git diff --check durante a implementação não apresentou erro funcional.

No staging final foi observado somente:

app/agendar/booking-flow.tsx: new blank line at EOF

Detalhe cosmético sem impacto funcional.

## BANCO

Migrations aplicadas agora:

007–028.

NÃO reaplicar nenhuma.

Novas desta sessão:

025 — cancelamento seguro do próprio appointment;
026 — leitura de barber_services para cliente authenticated;
027 — leitura de barbeiros ativos para cliente authenticated;
028 — leitura de jornadas ativas para cliente authenticated.

## NÃO ALTERADO

Permaneceu sem reconstrução:

- create_public_multi_appointment;
- regra de benefício das assinaturas;
- Mercado Pago Orders;
- PIX;
- webhook;
- HMAC;
- polling;
- renovação server-side;
- Admin financeiro;
- Admin de capacidade.

## REGRAS FINANCEIRAS PRESERVADAS

Plano Mensal continua:

pagamento mensal avulso via PIX.

SEM renovação automática Mercado Pago.

Capacidade:

30 assinantes por barbeiro.

SELECT ... FOR UPDATE permanece obrigatório onde já implementado.

Hold PIX:

30 minutos.

Janela de renovação:

7 dias.

Carência:

2 dias.

Comissão continua NÃO definida.

NÃO inventar percentual.

## PRÓXIMA FRENTE

Cancelamento está concluído.

Remarcação continua conscientemente separada.

Próxima evolução natural da gestão de agendamentos pelo cliente:

REMARCAÇÃO.

Antes de implementar, definir conscientemente:

- antecedência mínima;
- status remarcáveis;
- se confirmed pode ser remarcado;
- disponibilidade do novo horário;
- manutenção de serviços;
- manutenção ou troca do barbeiro;
- comportamento transacional para não perder o horário antigo antes de reservar o novo;
- integração com benefícios/preço histórico;
- fronteira segura baseada em auth.uid().

Não implementar remarcação como simples cancelamento + novo agendamento sem definir atomicidade e regras.

Qualquer nova alteração de banco deve usar o próximo número disponível:

029.

Antes de aplicar nova migration, obter autorização explícita.

# FIM DO CHECKPOINT — 2026-09-18

---

# CHECKPOINT FINAL — CENTRAL DO CLIENTE / REMARCAÇÃO DE AGENDAMENTOS — 2026-09-18

## STATUS

Remarcação de agendamento pelo cliente:

CONCLUÍDA E VALIDADA END-TO-END.

Rota:

/minha-assinatura

## REGRAS

- scheduled pode ser remarcado;
- confirmed pode ser remarcado;
- completed, cancelled e no_show não podem;
- antecedência mínima: 1 hora antes do horário original;
- exatamente 1 hora antes é permitido;
- mesmo dia é permitido respeitando a antecedência;
- horário iniciado/passado é bloqueado;
- mesmo barbeiro é mantido;
- mesmos serviços são mantidos;
- mesmo appointment.id é preservado;
- repetir o mesmo start_at é idempotente;
- preço histórico não é recalculado;
- benefícios históricos não são recalculados;
- appointment_services permanece preservado;
- appointment_services.subscription_id permanece preservado.

Remarcação continua separada do cancelamento.

Não foi implementado fluxo cancelar → criar outro appointment.

## ATOMICIDADE E CONCORRÊNCIA

Migration criada e aplicada:

supabase/sql/029-customer-appointment-rescheduling.sql

RPC:

public.reschedule_my_appointment(
  p_appointment_id uuid,
  p_start_at timestamptz
)

Segurança:

- identidade por auth.uid();
- e-mail confirmado;
- customer derivado de customers.auth_user_id;
- customer_id não vem do browser;
- appointment próprio obrigatório;
- FOR UPDATE no appointment;
- somente authenticated possui EXECUTE;
- anon não possui EXECUTE;
- nenhum UPDATE público amplo foi concedido.

A RPC valida:

- status;
- antecedência;
- novo horário futuro;
- duração;
- jornada ativa;
- blocked_times.

A duração autoritativa utilizada pela RPC é a soma histórica de:

appointment_services.duration_minutes.

A escrita altera somente:

appointments.start_at
appointments.end_at.

Proteção concorrente final:

constraint existente prevent_overlapping_appointments

EXCLUDE USING gist por:

barber_id
+
tstzrange(start_at, end_at, '[)')

para status:

scheduled
confirmed.

Caso outro cliente ocupe concorrentemente o novo intervalo, exclusion_violation aborta a remarcação e o horário antigo permanece intacto.

## LEITURA PRIVADA PARA DISPONIBILIDADE

Migration criada e aplicada:

supabase/sql/030-my-appointments-barber-id.sql

Ela atualiza somente:

public.get_my_appointments()

para incluir:

barber_id

no DTO privado do próprio cliente.

Preservado:

- auth.uid();
- e-mail confirmado;
- customers.auth_user_id;
- somente appointments próprios;
- EXECUTE authenticated;
- anon sem EXECUTE.

Nenhuma escrita adicional foi concedida.

## UI

Arquivos alterados/criados:

- app/minha-assinatura/appointment-actions.ts
- app/minha-assinatura/reschedule-appointment.tsx
- app/minha-assinatura/upcoming-appointments.tsx
- app/minha-assinatura/page.module.css
- lib/customer-auth/appointments.ts

A Central apresenta REMARCAR AGENDAMENTO separadamente de CANCELAR AGENDAMENTO.

A remarcação:

- seleciona nova data;
- consulta horários disponíveis;
- mantém barbeiro;
- mantém serviços;
- utiliza grade de 15 minutos;
- remove o próprio intervalo atual somente da sugestão visual;
- revalida tudo no PostgreSQL no momento da escrita.

O browser não é autoridade sobre:

- customer_id;
- barber_id;
- duração;
- preço;
- benefício;
- disponibilidade final.

## E2E

Foi criado um appointment controlado pelo fluxo normal /agendar.

Estado antes da remarcação:

19/09/2026
09:00 às 09:30
Rodrigo Alves Correa
Barba Assinante Mensal
scheduled

A remarcação foi executada pela Central.

Estado depois:

18/09/2026
16:30 às 17:00
Rodrigo Alves Correa
Barba Assinante Mensal
scheduled

Appointment preservado:

5c9a0c8a-8542-4729-aab1-68a59698fea4

Auditoria confirmou preservação de:

- mesmo appointment.id;
- mesmo created_at;
- mesmo customer_id;
- mesmo barber_id;
- status scheduled;
- appointments.price = 0.00;
- mesmo appointment_services;
- mesmo service_id;
- mesmo service_name;
- appointment_services.price = 0;
- mesmo subscription_id.

Portanto não houve cancelamento + recriação.

Após a remarcação para um horário a menos de 1 hora, a própria Central passou corretamente a bloquear nova remarcação e cancelamento conforme a regra vigente.

## BUILD

npm.cmd run build:

APROVADO.

Next.js 16.3.4.

TypeScript sem erros.

git diff --check:

APROVADO.

Somente avisos conhecidos LF/CRLF.

## BANCO

Migrations aplicadas agora:

007–030.

Novas desta frente:

029 — remarcação atômica do próprio appointment.
030 — barber_id no DTO privado get_my_appointments.

NÃO reaplicar nenhuma migration.

## PRESERVADO

Não foi reconstruído ou alterado:

- create_public_multi_appointment;
- regra de benefício/preço;
- Mercado Pago Orders;
- PIX;
- webhook;
- HMAC;
- polling;
- renovação voluntária;
- renovação autenticada;
- recuperação de senha;
- Admin financeiro;
- Admin de capacidade.

## GIT

Base oficial desta frente:

db353d4 Registra conclusao da gestao de agendamentos

Devem continuar fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

# FIM DO CHECKPOINT — 2026-09-18

---

# CHECKPOINT DE CONTINUIDADE — CENTRAL DO CLIENTE / NOVA IDENTIDADE VISUAL — 2026-09-18

## PRIORIDADE

Este é o checkpoint visual mais recente.

Preservar integralmente o checkpoint anterior:

CENTRAL DO CLIENTE / REMARCAÇÃO DE AGENDAMENTOS — 2026-09-18.

A remarcação já está concluída, E2E aprovada e versionada.

Não refazer remarcação.

## GIT OFICIAL

Branch:

main

HEAD/origin antes dos refinamentos visuais atuais:

780b4eb Adiciona remarcacao de agendamentos pelo cliente

Remarcação foi commitada e enviada com sucesso.

Migrations aplicadas:

007–030.

NÃO reaplicar nenhuma.

Devem permanecer fora do Git:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Os refinamentos visuais descritos abaixo ainda NÃO foram commitados.

## DIREÇÃO DE PRODUTO

A área autenticada em:

/minha-assinatura

passa conceitualmente a ser chamada de:

CENTRAL DO CLIENTE.

A URL /minha-assinatura pode permanecer.

Motivo:

a área já não representa somente assinatura.

Ela reúne:

- identidade do cliente;
- plano;
- ciclo;
- barbeiro;
- renovação;
- serviços incluídos;
- próximos agendamentos;
- remarcação;
- cancelamento;
- histórico de atendimentos.

## IDENTIDADE VISUAL APROVADA

Foi definida uma direção visual para esta área que deve servir como referência para os próximos refinamentos públicos.

Características:

- preto dominante;
- dourado #d29d4f para contexto, labels e destaques;
- branco para informação principal;
- tipografia limpa, pesada e espaçada;
- poucos elementos por bloco;
- hierarquia visual forte;
- cards escuros;
- bordas discretas;
- evitar excesso de textos explicativos;
- manter a experiência funcional, mas com aparência premium da Black Navalha.

## MARCA BLACK NAVALHA

Foi adicionada presença institucional forte no topo da Central.

Utilizado o ativo já existente:

public/black-navalha/logo.png

O cabeçalho apresenta:

- emblema/logo;
- BLACK NAVALHA;
- BARBEARIA;
- identificação CENTRAL DO CLIENTE.

A composição visual atual foi APROVADA como direção.

Não substituir por marca genérica.

## IDENTIDADE DO CLIENTE

O formato anterior:

Olá, NOME DO CLIENTE

foi rejeitado visualmente.

Também foi rejeitada a tentativa:

SUA ÁREA BLACK NAVALHA.

Direção final aprovada:

label:

CLIENTE

em dourado.

Abaixo:

NOME DO CLIENTE

em branco, caixa alta, tipografia pesada e espaçada inspirada na escrita textual BLACK NAVALHA da Home.

Não utilizar fonte serif/itálica para o nome.

Não adicionar texto explicativo abaixo do nome neste momento.

Objetivo:

visual limpo e com identidade Black Navalha.

## PLANO

O bloco:

PLANO ATUAL
PLANO MENSAL

permanece como protagonista depois da identidade do cliente.

Apresentação atual:

Plano Mensal
Ativa · R$ 150,00 por mês

foi preservada.

## RESUMO DA ASSINATURA

Os quatro cards anteriores foram refinados semanticamente.

Antes:

- Ciclo;
- Barbeiro;
- Renovação;
- Carência.

Agora:

- VALIDADE DO PLANO;
- SEU BARBEIRO;
- PRÓXIMA RENOVAÇÃO;
- RESERVA DA VAGA.

A apresentação desktop foi alterada de quatro cards estreitos para grade 2x2.

Resultado visual:

APROVADO como direção.

Exemplo atual da fixture:

VALIDADE DO PLANO
22/09/2026 até 21/10/2026

SEU BARBEIRO
Rodrigo Alves Correa

PRÓXIMA RENOVAÇÃO
Abre em 14/10/2026

RESERVA DA VAGA
Até 24/10/2026, 00:00

No mobile a grade utiliza uma coluna.

Nenhuma regra de renovação/capacidade foi alterada.

## SERVIÇOS INCLUÍDOS

O bloco permanece funcional e recebeu refinamento visual.

Utiliza:

- título branco;
- ícone dourado;
- pequenos marcadores dourados;
- separadores discretos.

Ainda pode ser reorganizado na hierarquia da página no próximo chat.

## AGENDA / HISTÓRICO

Foi iniciado refinamento visual de:

Próximos agendamentos
Histórico de atendimentos.

Criada nova hierarquia para próximos horários:

- seção Agenda;
- destaque "Seu próximo horário";
- data mais forte;
- horário;
- profissional;
- serviços;
- status;
- gestão de remarcação/cancelamento preservada.

Histórico passou a ter aparência visualmente secundária em relação ao próximo atendimento.

Estados vazios também foram refinados.

Arquivo principal:

app/minha-assinatura/upcoming-appointments.tsx

A lógica de dados NÃO foi alterada.

## ORDEM DE CONTEÚDO — PRÓXIMA DECISÃO

Foi sugerido mover:

Seu próximo horário

para imediatamente depois do plano/resumo, antes de:

Serviços incluídos.

Motivo:

a agenda possui maior utilidade cotidiana para o cliente.

Essa reorganização ainda deve ser validada conscientemente no próximo chat.

Não assumir automaticamente que o comando de reordenação foi executado.

## CSS

Arquivo:

app/minha-assinatura/page.module.css

Recebeu refinamentos visuais incrementais.

IMPORTANTE:

o arquivo já possuía estilos acumulados de fases anteriores e inclusive blocos duplicados de renewalPanel/renewalBarbers/pixBox.

Nesta fase foram adicionados novos overrides no final.

No próximo chat, antes do checkpoint visual definitivo, é recomendável CONSOLIDAR o CSS conscientemente em vez de continuar adicionando overrides indefinidamente.

Não fazer uma reescrita cega do CSS.

Preservar a aparência atual aprovada.

## ENCODING

Durante uma tentativa de alteração usando Get-Content + Set-Content, textos UTF-8 foram temporariamente corrompidos.

Exemplos observados:

Ativa Â·
RenovaÃ§Ã£o
ServiÃ§os

O problema foi corrigido restaurando page.tsx do Git e passando a utilizar explicitamente:

[System.Text.UTF8Encoding]::new($false)

com:

[System.IO.File]::ReadAllText
[System.IO.File]::WriteAllText

Textos foram novamente confirmados corretamente:

Olá
Você
Disponível
Renovação
Carência
Serviços incluídos
por mês

REGRA PARA PRÓXIMOS CHATS:

Ao editar arquivos com acentuação via PowerShell, preferir leitura/escrita UTF-8 explícita com System.IO.

Evitar Get-Content → Set-Content para arquivos com texto português quando isso puder recodificar conteúdo.

## CHROME

Foi observado que:

Start-Process "http://localhost:3000/..."

abre o navegador padrão, que na máquina atual pode ser Edge.

Para validação visual, o responsável está utilizando Google Chrome.

Padrão preferido daqui para frente:

localizar explicitamente chrome.exe e chamar:

Start-Process $chrome "URL"

Exemplo:

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

Start-Process $chrome "http://localhost:3000/minha-assinatura"

## BUILD

Builds foram executados durante os refinamentos.

Últimos builds:

APROVADOS.

Next.js:

16.3.4.

TypeScript:

sem erros.

git diff --check:

sem erros funcionais.

Somente avisos conhecidos LF/CRLF.

## BANCO

Nenhuma alteração de banco nesta fase visual.

Nenhuma migration criada ou aplicada depois da 030.

Migrations aplicadas permanecem:

007–030.

NÃO reaplicar.

## REGRAS FUNCIONAIS PRESERVADAS

Remarcação:

CONCLUÍDA E E2E APROVADA.

Cancelamento:

CONCLUÍDO E E2E APROVADO.

PIX Orders:

E2E APROVADO E IDEMPOTENTE.

Polling PIX:

PRESERVADO.

Renovação voluntária:

PRESERVADA.

Renovação autenticada:

E2E APROVADA.

Recuperação de senha:

E2E APROVADA.

Agendamento autenticado:

PRESERVADO.

Nenhuma dessas engines deve ser refeita durante o refinamento visual.

## DECISÕES FUTURAS JÁ DISCUTIDAS

### TROCA DE BARBEIRO NA REMARCAÇÃO

Direção aprovada conceitualmente para futura evolução:

Se o appointment utilizou benefício de assinatura através de:

appointment_services.subscription_id

o atendimento deve permanecer preso ao barbeiro vinculado ao ciclo da assinatura.

A troca de barbeiro da assinatura continua ocorrendo somente na renovação, conforme regras existentes.

Se o appointment NÃO utilizou benefício de assinatura:

cliente autenticado poderá futuramente trocar de barbeiro durante remarcação, desde que:

- novo barbeiro realize todos os mesmos serviços;
- exista disponibilidade;
- preço/serviços históricos sejam preservados;
- operação seja atômica;
- PostgreSQL permaneça autoridade final.

Não implementar essa evolução durante refinamento visual sem nova etapa específica.

### HISTÓRICO DE REMARCAÇÕES

DECISÃO:

NÃO implementar.

O responsável não considera útil e não deseja poluir a experiência/dados com histórico adicional de horários anteriores.

O mesmo appointment.id continua representando o atendimento vigente.

### COMISSÃO

Direção de produto discutida:

o Admin deverá controlar a comissão.

Proposta:

percentual configurável de 0% a 100%.

0% representa nenhuma comissão.

Preferência arquitetural discutida:

percentual por barbeiro.

Quando uma mensalidade for confirmada, o percentual e valor utilizados deverão ser congelados historicamente na comissão daquele pagamento, para que mudanças futuras de percentual não alterem histórico.

subscription_commission_entries já existe, mas seu contrato exato deve ser inspecionado SOMENTE quando essa frente for iniciada.

Ainda não implementar comissão durante refinamento visual.

## PRÓXIMA SEQUÊNCIA DE PRODUTO

Ordem escolhida:

1. concluir refinamento visual da Central do Cliente;
2. refinar login/criação de conta/recuperação;
3. refinar /assinaturas e experiência PIX;
4. revisar visualmente /agendar sem alterar engine;
5. padronizar estados de loading, erro, sucesso e vazio;
6. depois evoluir troca de barbeiro na remarcação conforme regra de assinatura;
7. depois comissão configurável pelo Admin;
8. preparação final para produção somente após experiência pública estar visualmente consistente.

## PRÓXIMO PASSO EXATO

No próximo chat:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint;
3. confirmar Git;
4. NÃO alterar banco;
5. NÃO refazer remarcação;
6. abrir /minha-assinatura no Chrome;
7. continuar refinamento visual a partir do estado ATUAL aprovado;
8. avaliar primeiro a hierarquia:
   Plano/resumo → próximo horário → serviços → histórico;
9. validar desktop;
10. validar mobile;
11. consolidar CSS ao final da Central para remover duplicações/overrides obsoletos sem alterar aparência aprovada;
12. npm.cmd run build;
13. git diff --check;
14. checkpoint Git somente com autorização explícita.

## GIT / WORKING TREE ESPERADO

HEAD/origin:

780b4eb Adiciona remarcacao de agendamentos pelo cliente

Alterações visuais locais esperadas:

- app/minha-assinatura/page.tsx;
- app/minha-assinatura/page.module.css;
- app/minha-assinatura/upcoming-appointments.tsx;
- CONTEXTO-PROJETO.md após este checkpoint.

Devem permanecer untracked:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt.

.env.local nunca deve ser exibido/versionado.

Nunca usar:

git add .

Commit/push somente com autorização explícita.

# FIM DO CHECKPOINT — 2026-09-18
---

# CHECKPOINT FINAL — CENTRAL DO CLIENTE / NOVA IDENTIDADE VISUAL — 2026-09-18

## STATUS

Refinamento visual da Central do Cliente em:

/minha-assinatura

CONCLUÍDO, VALIDADO E APROVADO.

Esta frente foi exclusivamente de apresentação/hierarquia visual.

Nenhuma regra funcional, financeira ou de banco foi alterada.

## IDENTIDADE APROVADA

A área /minha-assinatura passa a ser apresentada conceitualmente como:

CENTRAL DO CLIENTE

A URL permanece inalterada.

Direção visual consolidada:

- preto dominante;
- branco para informação principal;
- dourado #d29d4f para contexto, labels e destaques;
- logo real Black Navalha;
- tipografia limpa, pesada e espaçada;
- cards escuros;
- bordas discretas;
- baixa poluição visual;
- hierarquia forte;
- experiência premium coerente com a Home Black Navalha.

## TOPO

Preservado e aprovado:

- logo Black Navalha;
- BLACK NAVALHA;
- BARBEARIA;
- CENTRAL DO CLIENTE.

Identidade do cliente:

- label CLIENTE em dourado;
- nome em branco;
- caixa alta;
- peso forte;
- espaçamento inspirado na identidade textual BLACK NAVALHA.

Continuam rejeitados e não devem retornar:

- "Olá, nome";
- "Sua área Black Navalha";
- nome serif/itálico;
- textos explicativos desnecessários.

## SAIR

A ação SAIR deixou de ocupar um botão administrativo grande ao lado da identidade do cliente.

Foi integrada de forma discreta ao cabeçalho institucional, junto ao contexto CENTRAL DO CLIENTE.

Resultado:

- desktop aprovado;
- mobile aprovado;
- nome do cliente permanece protagonista;
- ação continua disponível sem competir visualmente com o conteúdo principal.

## PLANO E SERVIÇOS

O Plano Mensal permanece protagonista.

Foi aproveitado o espaço disponível no card principal para integrar:

SERVIÇOS INCLUÍDOS

diretamente ao bloco do plano.

Desktop:

- plano na coluna esquerda;
- serviços incluídos na coluna direita.

Mobile:

- plano e serviços empilham dentro do mesmo card.

Isso substitui o antigo painel independente de Serviços incluídos e associa visualmente os benefícios ao próprio plano.

Composição aprovada.

## RESUMO DO PLANO

Mantido imediatamente após o card principal:

- VALIDADE DO PLANO;
- SEU BARBEIRO;
- PRÓXIMA RENOVAÇÃO;
- RESERVA DA VAGA.

Desktop:

grade 2 x 2.

Mobile:

cards empilhados.

Nenhuma regra ou dado foi alterado.

## AGENDA

A hierarquia foi reorganizada para colocar:

SEU PRÓXIMO HORÁRIO

imediatamente depois do plano/resumo.

A Agenda possui mais importância visual que o Histórico.

Estado vazio foi simplificado para:

Nenhum horário marcado

O texto explicativo redundante foi removido.

O CTA:

AGENDAR HORÁRIO

permanece ligado a /agendar e foi reduzido visualmente para não competir com o card do Plano Mensal.

No mobile o CTA utiliza a largura disponível.

Nenhuma regra de /agendar foi alterada.

## HISTÓRICO

HISTÓRICO DE ATENDIMENTOS permanece por último na hierarquia principal.

Foi deliberadamente reduzido visualmente:

- fundo mais discreto;
- títulos menos fortes;
- cards mais compactos;
- status menos destacado;
- ícones e textos secundários menos contrastantes.

O histórico continua totalmente legível, mas não compete com plano ou agenda.

Nenhum dado/histórico foi removido.

## ORDEM VISUAL FINAL

Hierarquia aprovada:

identidade Black Navalha
→ cliente
→ plano + serviços incluídos
→ resumo operacional
→ seu próximo horário
→ agendar horário
→ histórico de atendimentos.

Renovação autenticada continua aparecendo somente quando funcionalmente aplicável pelas regras já existentes.

## ARQUIVOS ALTERADOS

- app/minha-assinatura/page.tsx
- app/minha-assinatura/page.module.css
- app/minha-assinatura/upcoming-appointments.tsx
- CONTEXTO-PROJETO.md

## CSS

Foi confirmado que app/minha-assinatura/page.module.css possui estilos históricos/overrides acumulados.

Foi conscientemente decidido NÃO executar uma grande refatoração destrutiva do CSS nesta etapa porque:

- o resultado visual atual está aprovado;
- desktop e mobile estão aprovados;
- o build está aprovado;
- uma limpeza ampla possui risco desnecessário de regressão visual.

A consolidação profunda poderá ser feita futuramente como refatoração isolada, com comparação visual antes/depois.

Não reintroduzir estilos rejeitados apenas porque ainda existam regras históricas sem uso no CSS.

## VALIDAÇÃO VISUAL

Desktop:

APROVADO.

Mobile aproximadamente 385–390 px:

APROVADO.

Confirmados visualmente:

- marca;
- Central do Cliente;
- cliente;
- logout discreto;
- Plano Mensal;
- Serviços incluídos integrados;
- resumo operacional;
- Agenda;
- CTA Agendar horário;
- Histórico.

Nenhum overflow problemático foi identificado na validação final.

## BUILD

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Next.js 16.3.4;
- Compiled successfully;
- TypeScript sem erros;
- páginas geradas normalmente;
- /minha-assinatura reconhecida como rota dinâmica.

## DIFF CHECK

Executado:

git diff --check

Resultado:

APROVADO.

Foram apresentados apenas avisos conhecidos de futura conversão LF para CRLF.

Nenhum erro de whitespace foi reportado.

## BANCO

Nenhuma alteração.

Migrations 007–030 permanecem aplicadas.

NÃO reaplicar nenhuma.

Nenhuma migration foi criada nesta frente.

## FUNCIONALIDADES PRESERVADAS

Não foi reconstruído ou alterado:

- /agendar;
- create_public_multi_appointment;
- benefício/preço de assinatura;
- cancelamento;
- remarcação;
- próximos agendamentos;
- recuperação de senha;
- identidade segura;
- renovação voluntária;
- renovação autenticada;
- Mercado Pago Orders;
- PIX;
- webhook/HMAC;
- polling;
- Admin financeiro;
- Admin de capacidade.

## PRÓXIMA DIREÇÃO VISUAL

Após o checkpoint da Central do Cliente, a sequência planejada permanece:

1. refinamento visual de login/criação/recuperação do cliente;
2. refinamento de /assinaturas e experiência PIX;
3. /agendar somente visual;
4. padronização de loading/erro/sucesso/estados vazios;
5. troca de barbeiro na remarcação conforme regra já definida;
6. comissão administrativa;
7. preparação para produção.

Não iniciar automaticamente nova frente antes de confirmar o checkpoint Git.

# FIM DO CHECKPOINT — 2026-09-18
---

# CHECKPOINT FINAL — AUTENTICAÇÃO DO CLIENTE / NOVA IDENTIDADE VISUAL — 2026-09-18

## PRIORIDADE

Este é o checkpoint mais recente da frente visual da experiência autenticada do cliente.

Preservar integralmente o checkpoint anterior:

CENTRAL DO CLIENTE / NOVA IDENTIDADE VISUAL — 2026-09-18.

A Central do Cliente em `/minha-assinatura` continua concluída e não foi reconstruída nesta frente.

## OBJETIVO

Foi concluído o refinamento visual das telas de autenticação do cliente para integrá-las à identidade aprovada da Central do Cliente / Black Navalha.

Rotas trabalhadas:

- `/minha-assinatura/entrar`;
- `/minha-assinatura/recuperar-senha`;
- `/minha-assinatura/redefinir-senha`.

Nenhuma lógica de autenticação foi reconstruída.

## IDENTIDADE VISUAL APROVADA

A autenticação agora utiliza a mesma linguagem visual da Central do Cliente:

- preto dominante;
- dourado `#d29d4f`;
- branco para informação principal;
- logo real Black Navalha;
- tipografia limpa e forte;
- cards escuros;
- bordas discretas;
- poucos elementos;
- hierarquia visual controlada;
- aparência premium.

O cabeçalho das telas utiliza:

- logo Black Navalha;
- `BLACK NAVALHA`;
- `BARBEARIA`;
- identificação `CENTRAL DO CLIENTE`;
- ação utilitária `VOLTAR` no canto superior direito.

A decisão visual aprovada é manter ações secundárias/utilitárias no cabeçalho, seguindo o padrão do `SAIR` existente na Central, evitando poluição no corpo da página.

## LOGIN / CRIAÇÃO DE ACESSO

Rota:

`/minha-assinatura/entrar`

Direção final aprovada:

- label `ACESSO DO CLIENTE`;
- título `SEU ESPAÇO BLACK NAVALHA.`;
- apoio `Assinatura, horários e benefícios em um só lugar.`;
- abas `JÁ TENHO ACESSO` e `CRIAR ACESSO`;
- campos escuros;
- labels dourados;
- CTA dourado;
- recuperação de senha discreta;
- nota de segurança subordinada;
- `VOLTAR` no cabeçalho.

O título foi deliberadamente reduzido em peso/tamanho em relação às primeiras propostas para evitar aparência agressiva.

Desktop:

APROVADO.

Mobile aproximadamente 385–390 px:

APROVADO.

Sem overflow observado.

## RECUPERAÇÃO DE SENHA

Rota:

`/minha-assinatura/recuperar-senha`

Foi aplicada a mesma identidade visual aprovada.

Estrutura:

- cabeçalho Black Navalha;
- `CENTRAL DO CLIENTE`;
- `VOLTAR`;
- `ACESSO DO CLIENTE`;
- título `RECUPERAR SENHA`;
- texto curto;
- card escuro;
- campo de e-mail;
- CTA dourado.

Desktop:

APROVADO.

Mobile aproximadamente 385 x 823:

APROVADO.

Sem overflow observado.

O rate limit e a lógica real de recuperação permaneceram inalterados.

## REDEFINIÇÃO DE SENHA

Rota:

`/minha-assinatura/redefinir-senha`

Foi aplicada a mesma linguagem visual.

Estrutura:

- cabeçalho Black Navalha;
- `CENTRAL DO CLIENTE`;
- `VOLTAR`;
- `ACESSO DO CLIENTE`;
- título `DEFINA SUA NOVA SENHA`;
- formulário no mesmo sistema visual.

A proteção server-side por sessão de recovery foi preservada.

Não foi burlada a proteção apenas para abrir a página visualmente.

Também foram corrigidos dois textos que estavam com caracteres corrompidos no arquivo:

- `As senhas informadas não coincidem.`
- `Não foi possível atualizar sua senha.`

Nenhuma regra funcional foi alterada nessa correção textual.

## FUNCIONAMENTO PRESERVADO

Permaneceu integralmente preservado:

- Supabase Auth;
- login por e-mail/senha;
- criação de acesso;
- confirmação de e-mail;
- callback;
- claim seguro do customer;
- identidade via `auth.uid()`;
- recuperação de senha;
- rate limit;
- redefinição de senha;
- logout após redefinição;
- fluxo pós-reset.

Não houve alteração de banco.

## NÃO ALTERADO

Não foi alterado:

- `/minha-assinatura` funcional;
- `/agendar`;
- `create_public_multi_appointment`;
- benefícios/preços das assinaturas;
- cancelamento;
- remarcação;
- Mercado Pago Orders;
- PIX;
- webhook/HMAC;
- polling;
- renovação voluntária;
- renovação autenticada;
- identidade segura;
- regras financeiras;
- Admin.

## BANCO

Nenhuma alteração.

Migrations `007–030` permanecem aplicadas.

NÃO reaplicar nenhuma.

## BUILD

Executado:

`npm.cmd run build`

Resultado:

APROVADO.

- Next.js 16.3.4;
- compilação concluída;
- TypeScript sem erros;
- rotas de autenticação reconhecidas normalmente.

## DIFF CHECK

Executado:

`git diff --check`

Resultado:

APROVADO.

Somente avisos conhecidos de futura conversão LF → CRLF no Windows.

Nenhum erro de whitespace foi apresentado.

## ARQUIVOS FUNCIONAIS ALTERADOS

- `app/minha-assinatura/entrar/page.tsx`;
- `app/minha-assinatura/page.module.css`;
- `app/minha-assinatura/recuperar-senha/page.tsx`;
- `app/minha-assinatura/redefinir-senha/page.tsx`;
- `app/minha-assinatura/redefinir-senha/reset-password-form.tsx`.

## REGRAS DE GIT

Continuam proibidos de versionamento:

- `ASSINATURAS-LOTE.txt`;
- `CODIGO-COMPLETO.txt`;
- `.env.local`.

Nunca usar `git add .`.

## PRÓXIMA SEQUÊNCIA PLANEJADA

Com a frente de autenticação concluída, a sequência planejada permanece:

1. `/assinaturas` e experiência PIX;
2. `/agendar` somente visual;
3. padronização de loading/erro/sucesso/vazios;
4. troca de barbeiro na remarcação conforme regra já definida;
5. comissão Admin;
6. preparação para produção.

Na próxima frente, preservar todas as regras financeiras e funcionais já aprovadas.

# FIM DO CHECKPOINT — 2026-09-18

---

# CHECKPOINT DE CONTINUIDADE — /ASSINATURAS + EXPERIÊNCIA PIX / REFINAMENTO VISUAL — 2026-09-19

## PRIORIDADE

Este é o checkpoint mais recente desta frente visual.

Deve ser lido em conjunto com:

- AUTENTICAÇÃO DO CLIENTE / NOVA IDENTIDADE VISUAL — 2026-09-18;
- os checkpoints recentes de Mercado Pago PIX Orders;
- os checkpoints de acompanhamento automático do PIX;
- renovação voluntária/autenticada;
- Central do Cliente.

A frente atual permanece:

REFINAMENTO VISUAL DE /ASSINATURAS E EXPERIÊNCIA PIX.

NÃO iniciar /agendar visual antes de concluir esta frente.

## GIT OFICIAL NO INÍCIO

Branch confirmada:

main

HEAD:

81b813293c973af08f2f1a00c97aa2c757866d9b

origin/main:

81b813293c973af08f2f1a00c97aa2c757866d9b

Commit:

81b8132 Refina autenticacao visual da Central do Cliente

Working tree inicial confirmado:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Nunca versionar:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar git add .

Commit/push somente com autorização explícita.

## ARQUIVOS INSPECIONADOS

Foram inspecionados somente os arquivos necessários para a frente:

- AGENTS.md;
- app/assinaturas/page.tsx;
- app/assinaturas/page.module.css;
- app/assinaturas/subscription-checkout-form.tsx;
- app/minha-assinatura/page.tsx;
- app/minha-assinatura/page.module.css.

Minha Assinatura foi consultada somente como referência da identidade visual já aprovada.

Nenhuma API/convenção nova do Next.js 16 surgiu nesta frente e não foi necessário repetir documentação local.

## ESTADO VISUAL ANTERIOR DE /ASSINATURAS

A página foi observada no Chrome antes das alterações.

Problemas identificados:

- título ASSINATURAS excessivamente dominante;
- plano, benefícios e contratação formavam um único bloco muito grande;
- estrutura não escalava visualmente bem para futuros múltiplos planos;
- formulário parecia parte interna do card do plano;
- hierarquia entre plano, benefícios, contratação e pagamento era fraca;
- identidade ainda não estava no mesmo nível visual da Central do Cliente;
- estados PIX utilizavam bastante estilo inline;
- mesmo container/moldura tentava representar formulário e pagamento.

## DIREÇÃO VISUAL APROVADA

Foi aprovada a direção:

- preto dominante;
- dourado #d29d4f;
- branco para informação principal;
- logo real Black Navalha;
- tipografia forte e limpa;
- cards escuros;
- bordas discretas;
- menos dourado estrutural;
- forte separação entre produto, contratação e pagamento;
- cabeçalho inspirado na Central do Cliente;
- ações utilitárias discretas no topo;
- preparação visual para múltiplos planos reais sem inventar novos planos.

## CABEÇALHO

Foi adicionada identidade Black Navalha no topo de /assinaturas usando:

public/black-navalha/logo.png

O cabeçalho atual inclui:

- logo real;
- BLACK NAVALHA;
- BARBEARIA;
- identificação ASSINATURAS;
- MINHA ASSINATURA;
- VOLTAR PARA A HOME.

Foi decidido que VOLTAR PARA A HOME deve permanecer como ação utilitária no canto superior direito e não como linha isolada no conteúdo.

Acesso à Minha Assinatura também ficou como ação discreta no cabeçalho.

## TOPO COMERCIAL

O label foi evoluído para:

ASSINATURAS BLACK NAVALHA

Título:

ASSINATURAS

Texto atual:

Escolha o plano ideal para sua rotina e aproveite os serviços incluídos durante todo o ciclo.

A linguagem deixou de descrever etapas técnicas da interface.

## PLANOS

A página foi preparada visualmente para múltiplos planos reais.

Nenhum plano fictício foi criado.

Plano real preservado:

Plano Mensal
R$ 150,00

Pagamento continua:

mensal AVULSO.

SEM renovação automática Mercado Pago.

A grade usa os planos reais carregados de subscription_plans.

Foi adicionada seleção por query string:

?plano=<id>

somente entre IDs de planos efetivamente carregados do banco.

Plano solicitado que não corresponde a um plano real disponível não se torna autoridade.

Fallback:

primeiro plano real disponível.

O backend continua sendo autoridade sobre preço e checkout.

Com apenas um plano real, Plano Mensal aparece como selecionado.

## IMPORTANTE — SERVIÇOS E FUTUROS PLANOS

Os serviços atualmente apresentados continuam baseados em:

services.active = true
services.subscriber_service = true

Eles não estão modelados nesta tela como benefícios específicos por subscription_plan.

Portanto NÃO assumir futuramente que diferentes planos possuem listas diferentes de serviços sem evolução explícita do modelo.

Nenhum banco foi alterado para isso nesta frente.

## CARD DO PLANO

O card foi refinado com:

- PLANO SELECIONADO;
- nome do plano;
- preço;
- informação de pagamento mensal avulso;
- serviços incluídos;
- pagamento: Pix mensal avulso;
- profissional: cliente escolhe o barbeiro;
- ativação: após confirmação segura.

A apresentação foi separada da área de checkout.

## CONTRATAÇÃO

O formulário deixou de ficar visualmente incorporado ao card do plano.

Existe área própria de contratação abaixo da grade.

Foi identificada durante o refinamento uma confusão estrutural importante:

o mesmo componente Client Component controla:

- dados;
- barbeiro;
- preparação;
- cronômetro;
- geração PIX;
- espera;
- confirmação;
- expiração.

Por isso uma moldura estática no Server Component ficava incorreta após mudar de estado.

A direção atual é permitir que SubscriptionCheckoutForm controle a linguagem visual da etapa atual utilizando os estados já existentes.

Nenhum novo motor de checkout foi criado.

## CENTRAL DO CLIENTE

Foi testada uma faixa grande "Já tem assinatura?".

Posteriormente foi decidido não manter esse card permanentemente no topo comercial.

Minha Assinatura permanece como ação utilitária no cabeçalho.

Na reorganização mais recente também foi preparada uma apresentação "Já é assinante?" dentro da jornada inicial do checkout para desaparecer naturalmente quando prepared existir.

ESTE PONTO VISUAL AINDA DEVE SER REVISTO NO PRÓXIMO CHAT.

O responsável indicou que a composição ainda não estava exatamente como desejada e optou por não perder mais tempo naquele momento.

Não considerar essa microdecisão visual encerrada definitivamente sem observar o estado atual real.

## FORMULÁRIO

A estrutura visual foi refinada para:

01 · SEUS DADOS

- Nome;
- WhatsApp;
- E-mail.

02 · ESCOLHA SEU BARBEIRO

Disponibilidade pública continua mostrando apenas:

Vagas disponíveis

ou:

Indisponível.

Quantidade numérica não é exibida.

Botão atual:

RESERVAR VAGA E CONTINUAR

Nota:

A vaga fica reservada por 30 minutos para você concluir o Pix.

Nenhuma regra de capacidade foi alterada.

## ESTADO PREPARADO / PAGAMENTO

Foi validado visualmente um estado preparado sem gerar nova Order PIX.

Uma preparação controlada criou somente o fluxo interno já existente:

hold
+
subscription_charge pending

Não foi clicado GERAR PIX nessa validação.

Nenhuma cobrança Mercado Pago foi criada apenas para validar aparência.

O estado preparado exibiu:

PAGAMENTO

Finalize seu Plano Mensal

Resumo:

Você está contratando
Plano Mensal
R$ 150,00

Cronômetro baseado exclusivamente em:

reservation_expires_at

Exemplo visual observado:

29:44

O cronômetro não foi reconstruído.

## LINGUAGEM DO CRONÔMETRO

A linguagem técnica foi reduzida.

Atual:

PRAZO DA RESERVA

Tempo restante da sua reserva

Nota operacional:

Sua vaga está garantida durante este prazo.

Foi criada a classe visual:

reservationNote

para manter essa mensagem subordinada e evitar aparência de novo título.

## ETAPA PIX ANTES DA GERAÇÃO

Foi preparada visualmente:

PIX

Pague com Pix

Ação:

GERAR PIX

A ativação continua sendo apresentada como automática após a confirmação do Pix.

A geração PIX real NÃO foi repetida para validar aparência.

## PIX GERADO — IMPLEMENTAÇÃO VISUAL PREPARADA

O JSX/CSS foi preparado para:

- título Pague com Pix;
- QR Code em painel branco;
- Pix Copia e Cola;
- botão COPIAR CÓDIGO PIX;
- feedback de cópia;
- layout em duas colunas no desktop;
- empilhamento no mobile;
- estado AGUARDANDO CONFIRMAÇÃO;
- mensagem de atualização automática;
- ticket_url preservado quando existente.

Os estilos inline anteriores do:

- cronômetro;
- QR Code;
- textarea;

foram migrados para CSS Module.

IMPORTANTE:

Não foi criada nova Order PIX apenas para rever visualmente esse estado.

O motor PIX já possui E2E financeiro aprovado em checkpoints anteriores.

## PAGAMENTO CONFIRMADO

A lógica existente foi preservada.

Estado continua baseado exclusivamente em:

paid = true
e
activated = true

retornados pelo backend observacional.

A interface mantém:

Pagamento confirmado.

Plano ativo.

AGENDAR HORÁRIO.

Nenhuma condição financeira foi alterada.

## EXPIRAÇÃO

Preservado:

00:00
→ consulta final ao backend
→ somente depois expiração visual se não houver paid + activated.

Estado existente:

Esta reserva expirou.

Ação:

PREPARAR NOVA CONTRATAÇÃO.

Nenhum timer financeiro independente foi criado.

## POLLING

INTEGRALMENTE PRESERVADO.

O polling continua somente observacional.

Não confirma pagamento.

Não chama RPC financeira.

Não altera charge.

Não altera assinatura.

Não altera ciclo.

Não altera hold.

## MERCADO PAGO — INALTERADO

Preservado integralmente:

Orders API.

POST /v1/orders.

GET /v1/orders/{id}.

PIX.

external_reference = subscription_charge.id.

provider_charge_id = Order ID.

Webhook HMAC.

data.id ORIGINAL preservando maiúsculas.

Consulta server-side da Order.

Processamento transacional/idempotente.

Nenhuma alteração em:

- webhook;
- HMAC;
- confirmação financeira;
- polling;
- RPCs financeiras.

Nenhuma cobrança real foi realizada.

## CAPACIDADE — INALTERADA

Permanece:

30 assinantes por barbeiro.

SELECT ... FOR UPDATE obrigatório.

Hold PIX:

30 minutos.

Order expiration_time:

PT30M.

Carência pós-ciclo:

2 dias.

Nenhuma dessas regras foi modificada.

## RENOVAÇÃO — INALTERADA

Permanece:

- voluntária;
- janela antecipada de 7 dias;
- mesmo barbeiro não consome segunda vaga;
- troca de barbeiro exige capacidade;
- pagamento pendente não libera/transfere antecipadamente a vaga.

Nenhuma lógica de renovação foi alterada.

## COMISSÃO

Continua NÃO definida.

NÃO inventar percentual.

Nenhuma comissão foi implementada nesta frente.

## NÃO ALTERADO

Não foi alterado:

- /agendar;
- create_public_multi_appointment;
- benefício/preço das assinaturas;
- cancelamento;
- remarcação;
- identidade segura;
- recuperação de senha;
- renovação voluntária;
- renovação autenticada;
- Admin;
- banco.

Migrations 007–030 permanecem aplicadas.

NÃO reaplicar nenhuma.

## ARQUIVOS FUNCIONAIS ALTERADOS

Atualmente modificados:

- app/assinaturas/page.tsx;
- app/assinaturas/page.module.css;
- app/assinaturas/subscription-checkout-form.tsx.

Nenhum outro arquivo funcional desta frente deve ser incluído automaticamente.

## BUILD

Build final executado após os refinamentos:

npm.cmd run build

Resultado:

APROVADO.

Next.js:

16.3.4

Compiled successfully.

TypeScript:

sem erros.

Rota /assinaturas reconhecida como dinâmica.

## DIFF CHECK

Executado:

git diff --check

Resultado:

APROVADO.

Somente avisos conhecidos:

LF será convertido para CRLF futuramente pelo Git no Windows.

Nenhum erro de whitespace.

## WORKING TREE ATUAL ESPERADO

M app/assinaturas/page.module.css
M app/assinaturas/page.tsx
M app/assinaturas/subscription-checkout-form.tsx
?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

ASSINATURAS-LOTE.txt e CODIGO-COMPLETO.txt não podem ser versionados.

.env.local também não pode ser versionado.

## IMPORTANTE — FRENTE AINDA NÃO ENCERRADA

NÃO considerar /assinaturas + experiência PIX totalmente concluída ainda.

Antes do checkpoint funcional final falta:

1. ler este checkpoint;
2. confirmar Git real;
3. observar o estado visual atual após as últimas mudanças;
4. revisar o diff real de:
   - app/assinaturas/page.tsx;
   - app/assinaturas/subscription-checkout-form.tsx;
   - app/assinaturas/page.module.css;
5. garantir que as várias substituições visuais não introduziram alteração acidental de lógica;
6. revisar visualmente desktop e mobile do estado inicial atual;
7. decidir se a posição/apresentação de "Já é assinante?" será mantida, simplificada ou removida;
8. revisar os estados PIX pelo código/estados existentes sem criar novo PIX apenas por aparência;
9. se surgir problema visual real, corrigir somente ele;
10. npm.cmd run build novamente somente se houver nova alteração;
11. git diff --check;
12. revisar Git;
13. commit/push somente com autorização explícita.

## PRÓXIMO CHAT — PRIMEIRO PASSO

NÃO iniciar /agendar visual.

NÃO repetir E2E financeiro.

NÃO criar nova Order PIX só para aparência.

Primeiro:

- confirmar Git;
- abrir /assinaturas no estado atual;
- revisar a composição atual após a última reorganização;
- revisar o diff dos três arquivos funcionais;
- fazer somente os ajustes visuais finais necessários.

Depois concluir esta frente e somente então seguir para:

1. /agendar somente visual;
2. padronização loading/erro/sucesso/vazios;
3. troca de barbeiro na remarcação conforme regra já definida;
4. comissão Admin;
5. preparação para produção.

# FIM DO CHECKPOINT — 2026-09-19

---

# CHECKPOINT FINAL — AGENDAR / NOVA IDENTIDADE VISUAL — 2026-09-19

## PRIORIDADE

Este é o checkpoint mais recente da frente visual de `/agendar`.

Preservar integralmente os checkpoints funcionais anteriores de:

- agendamento público;
- benefício/preço das assinaturas;
- `create_public_multi_appointment`;
- cancelamento;
- remarcação;
- Mercado Pago Orders/PIX;
- identidade segura;
- Central do Cliente.

Esta frente foi SOMENTE VISUAL.

## STATUS

Refinamento visual de `/agendar`:

CONCLUÍDO E APROVADO.

As etapas visuais trabalhadas anteriormente nesta mesma frente e o refinamento final do cabeçalho são consideradas aprovadas.

Nenhuma regra funcional do agendamento foi reconstruída.

## IDENTIDADE VISUAL

`/agendar` foi alinhado à identidade aprovada Black Navalha / Central do Cliente:

- preto dominante;
- dourado `#d29d4f`;
- branco para informação principal;
- logo real Black Navalha;
- tipografia limpa, forte e espaçada;
- cards escuros;
- bordas discretas;
- hierarquia visual forte;
- poucos elementos;
- linguagem visual consistente com `/minha-assinatura`.

## CABEÇALHO

O topo de `/agendar` foi alinhado ao padrão institucional da Central do Cliente.

Composição final:

- logo real Black Navalha;
- `BLACK NAVALHA`;
- `BARBEARIA`;
- badge `AGENDAMENTO`;
- ação utilitária `← VOLTAR`;
- divisor institucional discreto.

A ação anterior:

`VOLTAR PARA A HOME`

foi reduzida para:

`VOLTAR`

seguindo a mesma disciplina visual utilizada para ações utilitárias no cabeçalho da Central.

No mobile, o contexto `AGENDAMENTO` permanece preservado no cabeçalho junto da ação `VOLTAR`.

## GEOMETRIA

O cabeçalho, progresso e conteúdo principal foram visualmente alinhados ao eixo de aproximadamente 760px utilizado como referência na experiência autenticada.

A barra de progresso do agendamento permanece própria do fluxo e não foi removida.

## PASSOS

O fluxo funcional existente foi preservado.

Continuam existindo:

1. Serviços;
2. Profissional;
3. Data;
4. Horário;
5. Confirmar.

A identidade premium foi aplicada sem reconstruir a lógica dessas etapas.

## SERVIÇOS

A apresentação visual dos serviços foi refinada mantendo:

- serviços reais;
- categorias;
- seleção múltipla;
- identificação de serviços de plano;
- preços existentes;
- duração;
- resumo da seleção;
- CTA de continuidade.

Nenhuma regra de benefício foi alterada.

## RESPONSIVIDADE

Desktop:

APROVADO.

Mobile:

APROVADO.

O refinamento final do cabeçalho foi validado nos dois formatos no mesmo checkpoint visual.

## FUNCIONAMENTO PRESERVADO

Não foi alterado:

- `create_public_multi_appointment`;
- seleção de múltiplos serviços;
- filtro de barbeiros;
- duração;
- disponibilidade;
- jornadas;
- bloqueios;
- benefícios das assinaturas;
- preços;
- serviço de plano a R$ 0,00 quando elegível;
- cliente autenticado;
- preenchimento seguro de identidade;
- criação do agendamento;
- cancelamento;
- remarcação.

## BANCO

Nenhuma alteração de banco nesta frente.

Migrations `007–030` permanecem aplicadas.

NÃO reaplicar nenhuma.

## ARQUIVOS FUNCIONAIS

Alterados nesta frente visual:

- `app/agendar/booking-flow.tsx`;
- `app/globals.css`.

As alterações acumuladas nesses arquivos pertencem à frente visual já aprovada de `/agendar`.

## VALIDAÇÃO FINAL

Obrigatório e realizado antes do checkpoint:

- validação visual desktop;
- validação visual mobile;
- `npm.cmd run build`;
- `git diff --check`.

## GIT / SEGURANÇA

Nunca versionar:

- `ASSINATURAS-LOTE.txt`;
- `CODIGO-COMPLETO.txt`;
- `.env.local`.

Nunca usar:

`git add .`

## PRÓXIMA SEQUÊNCIA

Com a frente visual de `/agendar` concluída, a sequência planejada segue para:

1. padronização de loading/erro/sucesso/vazios;
2. troca de barbeiro na remarcação conforme regra já definida;
3. comissão Admin;
4. preparação para produção.

Não refazer `/agendar` visual sem nova necessidade concreta.

# FIM DO CHECKPOINT — 2026-09-19
---

# CHECKPOINT DE CONTINUIDADE — ESTADOS VISUAIS + TROCA DE BARBEIRO NA REMARCAÇÃO + PRÓXIMA FRENTE COMISSÃO — 2026-09-19

## PRIORIDADE

Este é o checkpoint mais recente e deve ter prioridade sobre checkpoints anteriores quando houver divergência.

Preservar integralmente os checkpoints funcionais já aprovados de:

- Central do Cliente / Minha Assinatura;
- autenticação e recuperação de senha;
- assinaturas e renovação voluntária/autenticada;
- Mercado Pago Orders + PIX;
- webhook/HMAC;
- polling observacional;
- cancelamento;
- remarcação;
- agendamento público;
- Admin financeiro/capacidade.

## GIT OFICIAL

Branch:

main

HEAD/origin:

c8a77ef Permite troca segura de barbeiro na remarcacao

Push realizado com sucesso:

main → origin/main

Commit imediatamente anterior desta continuidade:

d23fd54 Padroniza estados visuais da interface

Working tree após o último push:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Esses arquivos devem continuar fora do Git.

.env.local nunca deve ser versionado.

Nunca usar:

git add .

Staging somente com caminhos explícitos.

Commit/push somente com autorização explícita.

## PADRONIZAÇÃO VISUAL DOS ESTADOS

Status:

CONCLUÍDA, VALIDADA E VERSIONADA.

Commit:

d23fd54 Padroniza estados visuais da interface

Foram trabalhadas somente as experiências públicas/do cliente prioritárias:

- /minha-assinatura;
- autenticação do cliente;
- recuperação/redefinição de senha;
- /assinaturas e experiência PIX;
- /agendar.

Admin não foi incluído nessa frente.

## LINGUAGEM VISUAL DOS ESTADOS

Direção consolidada:

- preto dominante;
- dourado #d29d4f para contexto/progresso/sucesso coerente com a marca;
- branco para informação principal;
- cinza para informação secundária;
- vermelho queimado discreto para erro;
- cards escuros;
- bordas discretas;
- loading sem poluição;
- vazio discreto;
- indisponível/expirado neutro;
- sucesso claro sem caixa verde genérica.

## CENTRAL DO CLIENTE

Foram padronizados:

- erro;
- sucesso;
- loading;
- indisponibilidade;
- renovação preparada;
- verificação final de pagamento;
- renovação confirmada;
- reserva expirada.

Estados vazios de agenda/histórico que já estavam coerentes foram preservados.

A lógica financeira não foi alterada.

Polling continua apenas observacional.

Confirmação continua exigindo estado interno server-side:

paid = true
e
activated = true.

Cronômetros continuam baseados em:

reservation_expires_at.

## AUTENTICAÇÃO / RECUPERAÇÃO

Erro e sucesso passaram a seguir a nova linguagem visual.

Botões em processamento receberam tratamento visual coerente.

Foi corrigida uma mojibake REAL existente em:

app/minha-assinatura/redefinir-senha/reset-password-form.tsx

Antes:

NÃ£o foi possÃvel atualizar sua senha.

Depois:

Não foi possível atualizar sua senha.

A lógica Supabase Auth, recuperação, rate limit e proteção anti-enumeração foram preservadas.

Validações desktop/mobile realizadas.

## ASSINATURAS / PIX

Estados financeiros receberam diferenciação visual sem alterar autoridade financeira.

Separado visualmente:

- pagamento confirmado;
- verificando pagamento;
- reserva expirada;
- erro;
- aguardando confirmação.

IMPORTANTE:

"Verificando pagamento..." não usa mais aparência de sucesso confirmado.

Pagamento confirmado continua sendo apresentado somente após confirmação server-side já existente.

Nenhum PIX foi criado apenas para fabricar estado visual.

Nenhuma cobrança real foi realizada.

## AGENDAR

Foram ajustados somente:

- booking-loading;
- booking-form-error.

Sucesso e vazios existentes já estavam alinhados e foram preservados.

Não foi alterado:

- /agendar funcional;
- create_public_multi_appointment;
- preço;
- benefício de assinatura;
- disponibilidade;
- criação de appointment.

## VALIDAÇÃO DA FRENTE VISUAL

npm.cmd run build:

APROVADO.

TypeScript:

APROVADO.

git diff --check:

APROVADO.

Desktop/mobile:

APROVADOS nos estados disponíveis sem fabricação desnecessária de dados.

Banco:

INALTERADO nessa frente.

## TROCA DE BARBEIRO NA REMARCAÇÃO

Status:

IMPLEMENTADA, VALIDADA PARA REGRA DE ASSINATURA E VERSIONADA.

Commit:

c8a77ef Permite troca segura de barbeiro na remarcacao

Migration:

supabase/sql/031-customer-appointment-rescheduling-barber.sql

Aplicada no Supabase em 2026-09-19.

Resultado:

Success. No rows returned

NÃO reaplicar.

Migrations aplicadas agora:

007–031.

NÃO reaplicar nenhuma migration já aplicada.

## REGRA DE PRODUTO — TROCA DE BARBEIRO NA REMARCAÇÃO

Se qualquer serviço do appointment utilizou benefício de assinatura através de:

appointment_services.subscription_id

o atendimento permanece preso ao barbeiro atual.

A troca de barbeiro da assinatura continua ocorrendo somente na renovação.

Se o appointment NÃO utilizou benefício de assinatura:

o cliente autenticado pode trocar de barbeiro durante a remarcação somente quando o novo profissional:

- está ativo;
- realiza TODOS os mesmos serviços históricos do appointment;
- possui jornada compatível;
- não possui bloqueio no período;
- possui disponibilidade real no novo horário.

PostgreSQL continua sendo autoridade final.

## PRESERVAÇÃO HISTÓRICA

A troca de barbeiro NÃO utiliza cancelamento + novo agendamento.

Permanece o mesmo:

appointments.id.

São preservados:

- customer_id;
- appointment_services;
- service_id;
- service_name;
- appointment_services.price;
- appointment_services.subscription_id;
- appointments.price;
- created_at;
- status, exceto regras já existentes externas a esta frente.

A remarcação altera atomicamente somente quando necessário:

- appointments.barber_id;
- appointments.start_at;
- appointments.end_at.

Não foi criado histórico adicional de remarcações, conforme decisão anterior.

## SEGURANÇA DA REMARCAÇÃO

A RPC:

reschedule_my_appointment

agora recebe:

- p_appointment_id;
- p_barber_id;
- p_start_at.

Continua:

- derivando cliente por auth.uid();
- exigindo e-mail confirmado;
- bloqueando appointment com FOR UPDATE;
- validando propriedade do appointment;
- validando status;
- validando antecedência de 1 hora;
- usando duração histórica de appointment_services;
- validando jornada;
- validando blocked_times;
- preservando atomicidade.

A constraint existente:

prevent_overlapping_appointments

continua sendo a proteção concorrente final contra overlap de scheduled/confirmed.

Em conflito concorrente, a operação aborta e o appointment anterior permanece intacto.

## BARBEIROS CANDIDATOS

A migration 031 criou:

get_my_appointment_reschedule_barbers(p_appointment_id uuid)

RPC privada somente para authenticated.

Ela:

- deriva identidade por auth.uid();
- exige e-mail confirmado;
- garante appointment próprio;
- não recebe customer_id;
- não expõe subscription_id;
- não expõe service IDs;
- para appointment com benefício retorna somente o barbeiro atual;
- para appointment comum retorna somente barbeiros ativos capazes de executar todos os serviços históricos.

A Server Action também revalida se o barberId recebido pertence aos candidatos autorizados antes de consultar disponibilidade.

A escrita final revalida novamente tudo no PostgreSQL.

## DTO PRIVADO

get_my_appointments() passou a retornar também:

barber_change_allowed

como booleano semântico.

subscription_id continua privado.

Esse booleano serve apenas para UX.

Não é autoridade de autorização.

## VALIDAÇÃO REAL — APPOINTMENT COM ASSINATURA

Foi validado appointment real com:

Barba Assinante Mensal

e benefício de assinatura.

Resultado:

- remarcação abre normalmente;
- nenhum seletor de troca de profissional é apresentado;
- interface informa que o atendimento usa benefício da assinatura;
- Rodrigo Alves Correa permanece como profissional;
- datas/horários continuam disponíveis;
- regra de assinatura preservada.

Desktop:

APROVADO.

Mobile aproximadamente 385 px:

APROVADO.

## CENÁRIO POSITIVO DE TROCA

A implementação está pronta para appointment comum.

No estado atual conhecido do projeto, existe apenas um barbeiro ativo/elegível observado na experiência.

Não foi criado barbeiro artificial nem appointment artificial apenas para forçar uma troca positiva.

A troca efetiva depende naturalmente da existência de outro barbeiro ativo que execute todos os mesmos serviços.

Não confundir ausência de segundo candidato real com falha da implementação.

## UX DOS CONTROLES

Foi refinado o card de próximo horário.

Desktop:

- REMARCAR AGENDAMENTO e CANCELAR AGENDAMENTO ficam lado a lado;
- quando remarcação é aberta, formulário ocupa largura total abaixo das ações.

Mobile:

- ações ficam empilhadas;
- formulário permanece contido;
- sem overflow observado.

Foi removido texto redundante que aparecia junto ao botão cancelar.

Foi adicionado aviso único e discreto:

Cancelamentos e remarcações online estão disponíveis até 1 hora antes do atendimento.

A regra server-side de 1 hora continua sendo autoridade.

## BUILD FINAL DA REMARCAÇÃO

npm.cmd run build:

APROVADO.

TypeScript:

APROVADO.

git diff --check:

APROVADO.

## REGRAS FINANCEIRAS PRESERVADAS

Plano Mensal:

R$ 150 por pagamento mensal AVULSO via PIX.

SEM recorrência automática Mercado Pago.

Mercado Pago:

Orders API.

Browser NÃO confirma pagamento.

Webhook/HMAC permanece autoridade de entrada de evento.

GET Order server-side permanece obrigatório.

Polling permanece apenas observacional.

Hold PIX:

30 minutos.

Order expiration_time:

PT30M.

Capacidade:

30 assinantes por barbeiro.

SELECT ... FOR UPDATE permanece preservado onde já implementado.

Janela de renovação:

7 dias antes do fim do ciclo.

Carência:

2 dias.

## NÃO ALTERADO

Não foi reconstruído ou alterado nesta continuidade:

- create_public_multi_appointment;
- benefício/preço das assinaturas;
- Mercado Pago Orders;
- PIX;
- webhook;
- HMAC;
- renovação voluntária;
- renovação autenticada;
- identidade segura;
- recuperação de senha;
- Admin financeiro;
- capacidade de assinatura;
- comissão.

## PRÓXIMA FRENTE — COMISSÃO ADMINISTRATIVA

Direção de produto APROVADA em 2026-09-19.

A comissão de assinatura será controlada pelo Admin individualmente por barbeiro.

Regra aprovada:

- cada barbeiro possui percentual próprio de comissão de assinatura;
- Admin escolhe/altera o percentual;
- novos barbeiros começam com 0% como padrão seguro;
- comissão incide SOMENTE sobre mensalidade de assinatura efetivamente paga;
- não incide sobre agendamentos/cortes comuns;
- pending não gera comissão;
- failed não gera comissão;
- cancelled não gera comissão;
- expired não gera comissão;
- cada renovação voluntária paga pode gerar nova comissão;
- a comissão pertence ao barbeiro vinculado ao ciclo pago correspondente;
- se a renovação trocar de barbeiro, a nova comissão pertence ao novo profissional;
- percentual aplicado deve ficar CONGELADO historicamente no lançamento;
- mudança futura do percentual afeta somente pagamentos futuros;
- lançamentos financeiros antigos não são recalculados;
- futuro refund/estorno não deve apagar histórico;
- estorno deverá gerar reversão/ajuste auditável;
- não inventar nem fixar percentual global no código.

Estrutura existente:

subscription_commission_entries

deve ser reaproveitada quando compatível.

Não criar estrutura paralela antes de inspecionar seu contrato atual.

## PRÓXIMO PASSO EXATO — NOVO CHAT

Antes de qualquer ação:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint;
3. confirmar Git real;
4. HEAD/origin esperado:
   c8a77ef Permite troca segura de barbeiro na remarcacao
5. working tree esperado:
   ?? ASSINATURAS-LOTE.txt
   ?? CODIGO-COMPLETO.txt
6. migrations 007–031 já aplicadas;
7. NÃO reaplicar nenhuma;
8. iniciar diretamente a frente:
   COMISSÃO ADMINISTRATIVA.

Primeiro inspecionar somente os contratos necessários já versionados de:

- barbers;
- subscription_commission_entries;
- RPC confirm_mercado_pago_subscription_payment;
- cadastro/edição administrativa de barbeiros.

Objetivo:

desenhar a menor migration 032 necessária para:

- percentual configurável por barbeiro;
- padrão 0%;
- lançamento auditável da comissão após pagamento confirmado;
- percentual e valor congelados historicamente;
- idempotência;
- preparação para futura reversão de estorno.

Antes de aplicar a migration 032:

- apresentar modelagem;
- obter autorização explícita.

Não realizar cobrança real.

Não criar PIX apenas para testar comissão sem necessidade.

Não alterar /agendar ou remarcação nesta frente sem defeito concreto.

Depois da comissão:

preparação final para produção.

# FIM DO CHECKPOINT — 2026-09-19

---

# CHECKPOINT FINAL — COMISSÃO ADMINISTRATIVA DAS ASSINATURAS — 2026-09-19

## PRIORIDADE

Este é o checkpoint mais recente e deve prevalecer sobre checkpoints anteriores quando houver conflito.

A frente:

COMISSÃO ADMINISTRATIVA DAS ASSINATURAS

está CONCLUÍDA, TESTADA E VERSIONADA no escopo seguro disponível sem fabricar nova cobrança.

## GIT

Commit funcional:

3f7da02 Implementa comissoes administrativas de assinaturas

Push realizado com sucesso:

main → origin/main

Após o checkpoint funcional, HEAD/origin estavam sincronizados em:

3f7da02

Working tree:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Esses arquivos devem continuar fora do Git.

Nunca versionar:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Staging somente com caminhos explícitos.

## MIGRATION 032

Criada, aplicada e versionada:

supabase/sql/032-subscription-barber-commission.sql

Aplicação no Supabase:

Success. No rows returned

NÃO reaplicar.

Migrations 007–032 estão aplicadas.

NÃO reaplicar nenhuma.

## REGRA DE COMISSÃO IMPLEMENTADA

Cada barbeiro possui percentual próprio de comissão de assinatura.

Campo:

barbers.subscription_commission_rate

Contrato:

numeric(5,2)
NOT NULL
DEFAULT 0

Validação:

0% até 100%.

Novos barbeiros começam em:

0%.

Não existe percentual global fixo no código.

## ADMIN DE BARBEIROS

Cadastro:

/admin/barbeiros/novo

passou a permitir configurar:

COMISSÃO DE ASSINATURA (%)

com default visual:

0.

Edição:

/admin/barbeiros/[id]

também permite alterar o percentual.

A edição informa explicitamente que:

- comissão incide somente sobre mensalidades efetivamente pagas;
- alterações afetam somente pagamentos futuros.

Validação existe na interface/Server Action e novamente no banco.

## TESTE ADMINISTRATIVO DO PERCENTUAL

Barbeiro utilizado:

Rodrigo Alves Correa

Estado inicial após migration:

0%.

Teste controlado:

- percentual alterado para 10%;
- salvamento realizado;
- persistência confirmada após recarregar;
- percentual restaurado para 0%;
- novo salvamento realizado;
- restauração para 0% confirmada após recarregar.

Estado final:

0%.

Nenhum percentual temporário permaneceu configurado.

Alterar percentual não cria comissão retroativa.

## LEDGER EXISTENTE REAPROVEITADO

Foi preservada e reutilizada:

public.subscription_commission_entries

Nenhuma tabela paralela de comissão foi criada.

Estrutura histórica utilizada:

- charge_id;
- cycle_id;
- barber_id;
- entry_type;
- amount;
- rate;
- reverses_entry_id;
- created_at.

rate representa o percentual histórico congelado.

amount representa o valor histórico congelado.

A constraint de rate foi fortalecida para aceitar apenas:

NULL
ou
0 até 100.

A compatibilidade histórica com rate NULL foi preservada.

## LANÇAMENTO DA COMISSÃO

A versão atual de:

confirm_mercado_pago_subscription_payment

foi evoluída preservando sua responsabilidade como fronteira transacional/idempotente de confirmação financeira.

Toda a lógica anterior foi preservada, incluindo:

- charge com FOR UPDATE;
- barbeiro com FOR UPDATE;
- capacidade;
- SELECT ... FOR UPDATE;
- hold;
- customer;
- assinatura;
- renovação;
- troca de barbeiro;
- ciclos;
- benefícios;
- charge paid;
- idempotência.

Somente após uma charge pending ser efetivamente processada como paga, a RPC consulta o percentual atual do barbeiro historicamente vinculado ao novo ciclo.

Comissão é criada somente quando:

subscription_commission_rate > 0.

Cálculo:

round(charge.amount * rate / 100, 2)

O lançamento grava:

- charge_id da mensalidade;
- cycle_id pago;
- barber_id do ciclo;
- entry_type = commission;
- amount congelado;
- rate congelado.

Portanto mudança posterior no percentual do barbeiro não recalcula lançamentos antigos.

## BARBEIRO CORRETO POR CICLO

A comissão pertence ao barbeiro de:

subscription_cycles.barber_id

do ciclo pago correspondente.

Assim:

- contratação paga pertence ao profissional daquele ciclo;
- renovação paga no mesmo profissional pertence ao mesmo barbeiro;
- renovação paga com troca de barbeiro pertence ao novo profissional.

Nenhuma comissão é vinculada a agendamentos/cortes comuns.

## ESTADOS FINANCEIROS

A comissão nasce somente dentro da confirmação financeira server-side válida.

Não geram comissão:

- pending;
- failed;
- cancelled;
- expired.

O navegador continua sem autoridade para confirmar pagamento.

A arquitetura permanece:

Mercado Pago Order
→ webhook HMAC
→ GET Order server-side
→ validações financeiras
→ confirm_mercado_pago_subscription_payment
→ charge/ciclo pagos
→ comissão quando percentual > 0.

Polling continua somente observacional.

## IDEMPOTÊNCIA

subscription_commission_entries já possuía índice único de comissão positiva por charge.

A RPC também preserva:

- lock da charge;
- transição pending → paid;
- retorno idempotente quando a charge já foi processada.

O INSERT da comissão não silencia conflito inesperado.

Se existir inconsistência de duplicidade, a transação deve falhar em vez de aparentar sucesso.

## ESTORNOS / REVERSÕES FUTURAS

Nenhuma lógica de refund/estorno foi criada nesta frente.

O histórico positivo não deverá ser apagado futuramente.

A estrutura já existente foi preservada para reversão auditável:

entry_type = reversal
reverses_entry_id = lançamento original.

Existe proteção de uma reversão por lançamento original.

Uma futura frente de estorno deve registrar reversão em vez de apagar/recalcular comissão histórica.

## ADMIN DE COMISSÕES

Nova rota:

/admin/comissoes

Novo item:

Comissões

no menu administrativo.

A página é somente leitura e apresenta:

- total de comissões;
- total de reversões;
- saldo líquido;
- quantidade de lançamentos;
- histórico do ledger quando existir;
- profissional;
- valor histórico;
- percentual histórico;
- data/hora;
- Charge ID;
- Cycle ID;
- referência do lançamento revertido quando aplicável.

Nenhuma nova migration foi necessária para a leitura administrativa.

Foi reutilizado o SELECT server-side já existente para:

subscription_commission_entries.

## ESTADO VAZIO VALIDADO

Como:

- pagamentos anteriores à migration 032 não são recalculados;
- Rodrigo foi restaurado para 0%;
- nenhuma nova cobrança foi criada somente para fabricar teste;

a página /admin/comissoes foi validada corretamente com:

COMISSÕES:
R$ 0,00
0 lançamentos

REVERSÕES:
R$ 0,00
0 reversões

SALDO LÍQUIDO:
R$ 0,00

Estado:

Nenhuma comissão lançada.

Isso é o comportamento esperado.

## LIMITAÇÃO CONSCIENTE DE TESTE

Não foi criado novo PIX nem nova cobrança apenas para produzir uma comissão positiva.

Portanto o lançamento positivo real com percentual > 0 ainda não foi exercitado end-to-end com uma nova mensalidade paga após a migration 032.

A lógica está integrada na mesma fronteira transacional de confirmação financeira já validada anteriormente.

Quando ocorrer naturalmente uma nova mensalidade paga com percentual maior que 0, deve-se validar:

- exatamente um lançamento;
- charge correta;
- ciclo correto;
- barbeiro correto;
- rate congelado;
- amount congelado.

Não fabricar cobrança apenas para esse teste se houver alternativa segura.

## BUILD / VALIDAÇÃO

Executado:

npm.cmd run build

Resultado:

APROVADO.

- Next.js 16.3.4;
- compilação concluída;
- TypeScript sem erros;
- /admin/comissoes reconhecida como rota dinâmica.

git diff --check:

APROVADO.

Somente avisos conhecidos de LF/CRLF, sem erro de whitespace.

Validação visual:

- edição de comissão do barbeiro: APROVADA;
- persistência/restauração: APROVADA;
- /admin/comissoes: APROVADA;
- menu administrativo: APROVADO.

## ARQUITETURA FINANCEIRA PRESERVADA

Plano Mensal:

R$ 150 por pagamento mensal AVULSO via PIX.

SEM recorrência automática Mercado Pago.

Mercado Pago:

Orders API.

Browser NÃO confirma pagamento.

Webhook HMAC + GET Order server-side continuam sendo autoridade.

Capacidade:

30 assinantes por barbeiro.

Preservar SELECT ... FOR UPDATE.

Hold PIX:

30 minutos.

Janela de renovação:

7 dias antes do fim do ciclo.

Carência:

2 dias.

## NÃO RECONSTRUIR

Permanecem concluídos e não devem ser refeitos sem necessidade concreta:

- /agendar;
- create_public_multi_appointment;
- benefício/preço das assinaturas;
- cancelamento;
- remarcação;
- troca de barbeiro;
- Mercado Pago Orders;
- PIX;
- webhook/HMAC;
- polling;
- renovação voluntária;
- renovação autenticada;
- identidade segura;
- recuperação de senha;
- capacidade;
- comissão administrativa.

## PRÓXIMA FRENTE

Próxima frente planejada:

PREPARAÇÃO FINAL PARA PRODUÇÃO.

Antes de iniciar:

- confirmar Git;
- não fazer auditoria geral sem escopo;
- tratar credenciais/URLs de produção sem expor segredos;
- preservar separação entre ambiente de teste e produção;
- revisar somente os contratos necessários em blocos seguros;
- nenhuma cobrança real sem autorização explícita.

# FIM DO CHECKPOINT — 2026-09-19
---

# CHECKPOINT DE CONTINUIDADE — VERCEL ONLINE / AMBIENTE DE DEMONSTRAÇÃO / PREPARAÇÃO PARA PRODUÇÃO — 2026-09-19

## PRIORIDADE

Este é o checkpoint mais recente e deve prevalecer sobre checkpoints anteriores quando houver conflito.

A frente atual é:

PREPARAÇÃO FINAL PARA PRODUÇÃO.

O projeto já possui agora um ambiente HTTPS público e permanente de demonstração na Vercel.

Ainda NÃO é go-live financeiro real.

Mercado Pago permanece em TESTE/SANDBOX.

Nenhuma cobrança real foi realizada.

## GIT

Branch:

main

HEAD/origin no fechamento desta continuidade:

2f33232 Corrige cliente e profissional no dashboard

O push funcional mais recente foi concluído antes deste checkpoint.

Working tree esperado antes desta atualização documental:

?? ASSINATURAS-LOTE.txt
?? CODIGO-COMPLETO.txt

Nunca versionar:

- ASSINATURAS-LOTE.txt;
- CODIGO-COMPLETO.txt;
- .env.local.

Nunca usar:

git add .

Staging somente com caminhos explícitos.

Commit/push continuam exigindo autorização explícita.

## COMISSÕES ADMINISTRATIVAS

A frente anterior permanece concluída.

Commit funcional:

3f7da02 Implementa comissoes administrativas de assinaturas

Commit documental:

92565b7 Registra conclusao das comissoes administrativas

Migration 032:

supabase/sql/032-subscription-barber-commission.sql

APLICADA.

Migrations 007–032 estão aplicadas.

NÃO reaplicar nenhuma.

## HOSPEDAGEM ESCOLHIDA PARA DEMONSTRAÇÃO

Plataforma:

Vercel.

Projeto:

black-navalha

Repositório conectado:

rodrigopopsox-cmd/black-navalha

Branch:

main

Framework detectado:

Next.js.

URL pública estável atual:

https://black-navalha.vercel.app

O deploy é integrado ao GitHub.

Pushes em main geram novo deploy automaticamente.

A conta Vercel recebeu configuração de 2FA durante a preparação.

## ESCOPO DO AMBIENTE VERCEL ATUAL

Objetivo:

- deixar o projeto online;
- permitir demonstração ao cliente;
- substituir túneis temporários onde possível;
- validar comportamento real em HTTPS;
- continuar usando infraestrutura financeira de TESTE.

Este ambiente NÃO deve ser confundido com produção financeira definitiva.

Antes do go-live real ainda será necessário:

- conta/credenciais Mercado Pago pertencentes à Black Navalha;
- MERCADO_PAGO_TEST_MODE desligado/ausente;
- revisão final de dados QA;
- definição de domínio próprio, se desejado;
- checklist final de produção.

## VARIÁVEIS CONFIGURADAS NA VERCEL

Foram configuradas sem expor valores:

- NEXT_PUBLIC_SUPABASE_URL;
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
- SUPABASE_SERVICE_ROLE_KEY;
- MERCADO_PAGO_ACCESS_TOKEN;
- MERCADO_PAGO_WEBHOOK_SECRET;
- MERCADO_PAGO_TEST_MODE.

Os valores secretos NÃO foram enviados ao chat.

O ambiente de demonstração mantém:

MERCADO_PAGO_TEST_MODE=true

para preservar o sandbox.

Não usar APRO em produção real.

## AUDITORIA DE SEGREDOS VERSIONADOS

Foi realizada busca segura nos arquivos versionados e no histórico Git.

Resultado:

- nenhum SUPABASE_SERVICE_ROLE_KEY real encontrado no contexto;
- referências de Access Token/Webhook Secret no contexto são placeholders/curtas;
- nenhum prefixo APP_USR real encontrado;
- nenhum token TEST real encontrado;
- nenhum sb_secret real encontrado;
- histórico Git sem prefixo de credencial real detectado.

Portanto não foi encontrada evidência de segredo ativo versionado que justificasse reescrita do histórico.

.env.local permanece ignorado.

## SUPABASE AUTH — URLS HTTPS

Supabase Authentication → URL Configuration foi atualizado.

Site URL atual para demonstração:

https://black-navalha.vercel.app

Redirect URLs preservadas para desenvolvimento local:

http://localhost:3000/minha-assinatura/auth/callback

http://localhost:3000/minha-assinatura/auth/recuperacao

Redirect URLs adicionadas para Vercel:

https://black-navalha.vercel.app/minha-assinatura/auth/callback

https://black-navalha.vercel.app/minha-assinatura/auth/recuperacao

Não foi alterado Rate Limit, provider, SMTP ou outra configuração de Auth nesta etapa.

## VALIDAÇÃO PÚBLICA NA VERCEL

Foram validadas diretamente em HTTPS:

https://black-navalha.vercel.app/

https://black-navalha.vercel.app/agendar

https://black-navalha.vercel.app/assinaturas

Resultado:

APROVADO.

Confirmado:

- Home;
- imagens;
- identidade visual;
- serviços reais;
- serviços PLANO;
- agendamento público;
- Plano Mensal;
- R$ 150,00;
- serviços incluídos;
- formulário de assinatura.

Nenhum PIX foi criado apenas para essa validação.

## MINHA ASSINATURA NA VERCEL

Validado:

https://black-navalha.vercel.app/minha-assinatura

Login de identidade existente:

APROVADO.

Sessão/cookies em HTTPS:

APROVADOS.

Central do Cliente:

APROVADA.

Dados privados da identidade correta foram apresentados.

Foram observados corretamente:

- plano;
- ciclo;
- barbeiro;
- renovação;
- carência;
- serviços;
- próximo horário;
- histórico de atendimentos.

Nenhuma credencial foi enviada ao chat.

## WEBHOOK MERCADO PAGO PERMANENTE DE TESTE

O antigo Cloudflare Quick Tunnel deixou de ser necessário para demonstrações normais do webhook.

No Mercado Pago, ambiente MODO DE TESTE, a URL foi atualizada para:

https://black-navalha.vercel.app/api/mercado-pago/webhook

Evento mantido:

Order (Mercado Pago)

Não foram habilitados:

- Planos e assinaturas;
- Pagamentos legacy.

O segredo HMAC não foi regenerado.

## SIMULAÇÃO OFICIAL DO WEBHOOK NA VERCEL

Foi reutilizada uma Order sandbox já processada anteriormente:

ORDTST01M2HZ39TZ187852ED7YM3BD4G

Não foi criada nova Order.

Não foi criado novo PIX.

Não houve pagamento real.

A ferramenta oficial:

Simular notificações

foi executada com:

Order (Mercado Pago)

Resultado:

HTTP 200 OK.

Isso validou em ambiente Vercel:

Mercado Pago TESTE
→ HTTPS permanente Vercel
→ webhook
→ HMAC
→ GET Order server-side
→ processamento idempotente
→ HTTP 200.

O body fictício do simulador continua não sendo autoridade financeira.

A arquitetura financeira permanece preservada.

## ADMIN NA VERCEL

/admin foi validado com autenticação administrativa real.

Dashboard carregou dados reais.

Durante a validação foi identificado overflow horizontal na linha:

Agenda de hoje.

A causa era uma grade fixa com largura mínima superior ao espaço disponível ao lado da sidebar.

## CORREÇÃO DE RESPONSIVIDADE DO DASHBOARD

Commit:

5b87e60 Corrige responsividade da agenda no dashboard

Alterado somente:

app/admin/page.tsx

A grade fixa foi substituída por layout responsivo usando:

repeat(auto-fit, minmax(140px, 1fr))

Também foi removido alinhamento fixo do valor que prejudicava a reorganização.

Build:

APROVADO.

Push:

APROVADO.

Redeploy automático Vercel:

APROVADO.

Validação na mesma largura onde ocorria overflow:

APROVADA.

## CORREÇÃO DE CLIENTE E PROFISSIONAL NO DASHBOARD

Após corrigir o layout, foi observado que a Agenda de hoje apresentava:

CLIENTE:
Cliente

PROFISSIONAL:
-

O appointment possuía customer_id/barber_id válidos.

A causa era a dependência dos relacionamentos aninhados:

customers(...)
barbers(...)

no dashboard.

Foi reutilizado exatamente o padrão já validado anteriormente em:

/admin/agenda

O dashboard passou a:

- selecionar customer_id;
- selecionar barber_id;
- carregar somente customers referenciados;
- carregar somente barbers referenciados;
- resolver nomes por Map usando os IDs autoritativos do appointment.

Nenhuma alteração de banco foi necessária.

Nenhuma regra de agendamento foi alterada.

Build:

APROVADO.

Validação final na Vercel:

APROVADA.

A captura final confirmou:

CLIENTE:
Fixture Renovacao Autenticada

PROFISSIONAL:
Rodrigo Alves Correa

SERVIÇO:
Barba Assinante Mensal

VALOR:
R$ 0,00

O card permaneceu responsivo e sem overflow.

## DADOS QA VISÍVEIS

O ambiente atual ainda utiliza o mesmo Supabase de desenvolvimento/testes.

Existem dados explicitamente de QA, incluindo:

Fixture Renovacao Autenticada

Esses dados foram úteis para validar:

- identidade;
- renovação;
- PIX sandbox;
- webhook;
- agendamentos;
- cancelamento/remarcação.

NÃO apagar automaticamente.

Antes da apresentação final ao proprietário deve ser feita limpeza controlada dos dados de QA, após mapear vínculos e distinguir dados reais de dados de teste.

Não realizar DELETE em cascata ou limpeza genérica.

## ARQUITETURA FINANCEIRA PRESERVADA

Plano Mensal:

R$ 150 por pagamento mensal AVULSO via PIX.

SEM recorrência automática Mercado Pago.

Mercado Pago:

Orders API.

Browser NÃO confirma pagamento.

Webhook HMAC + GET Order server-side continuam sendo autoridade.

Polling continua apenas observacional.

Capacidade:

30 assinantes por barbeiro.

SELECT ... FOR UPDATE permanece obrigatório.

Hold PIX:

30 minutos.

Janela de renovação:

7 dias antes do fim do ciclo.

Carência:

2 dias.

Comissões administrativas:

concluídas.

## NÃO RECONSTRUIR

Permanecem concluídos:

- /agendar;
- create_public_multi_appointment;
- benefício/preço das assinaturas;
- cancelamento;
- remarcação;
- troca de barbeiro;
- Mercado Pago Orders;
- PIX;
- webhook/HMAC;
- polling;
- renovação voluntária;
- renovação autenticada;
- identidade segura;
- recuperação de senha;
- capacidade;
- comissão administrativa;
- deploy Vercel de demonstração.

## PRÓXIMO CHAT — PRIORIDADE

Continuar:

PREPARAÇÃO FINAL PARA PRODUÇÃO / APRESENTAÇÃO AO CLIENTE.

Primeiro:

1. ler integralmente CONTEXTO-PROJETO.md;
2. priorizar este checkpoint;
3. confirmar Git;
4. NÃO reaplicar migrations 007–032;
5. NÃO criar novo PIX para repetir testes já aprovados;
6. NÃO repetir webhook E2E já aprovado na Vercel;
7. NÃO alterar Supabase Auth já configurado para Vercel sem necessidade.

Próximo bloco recomendado:

LIMPEZA CONTROLADA DOS DADOS DE QA PARA APRESENTAÇÃO.

Antes de qualquer DELETE:

- mapear somente registros explicitamente QA/teste;
- mapear vínculos;
- separar dados institucionais/reais;
- apresentar plano de limpeza;
- obter autorização explícita para operação destrutiva.

Também pendente para go-live real futuro:

- domínio próprio;
- conta Mercado Pago da Black Navalha;
- credenciais reais em ambiente Production;
- MERCADO_PAGO_TEST_MODE=false/ausente;
- webhook real de produção;
- smoke test final sem cobrança real indevida;
- decisão de plano comercial da Vercel após demonstração.

# FIM DO CHECKPOINT — 2026-09-19