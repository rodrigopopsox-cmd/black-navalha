const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");

const filename = path.resolve(
  "lib/notifications/reconciliation-admin-read.ts"
);

const source = fs.readFileSync(filename, "utf8");

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

function validRow(overrides = {}) {
  return {
    id: UUID_A,
    event_id: UUID_B,
    channel: "whatsapp",
    provider: null,
    status: "reconciliation_required",
    attempt_count: 1,
    max_attempts: 3,
    last_attempt_at: null,
    created_at: "2026-10-16T12:00:00Z",
    ...overrides,
  };
}

let authorized = true;
let response = { data: [validRow()], error: null };
let calls = [];
let adminClientCreated = false;

const expectedColumns = [
  "id",
  "event_id",
  "channel",
  "provider",
  "status",
  "attempt_count",
  "max_attempts",
  "last_attempt_at",
  "created_at",
].join(",");

function queryMock() {
  const query = {
    select(columns) {
      calls.push(["select", columns]);
      return query;
    },
    eq(column, value) {
      calls.push(["eq", column, value]);
      return query;
    },
    order(column, options) {
      calls.push(["order", column, options]);
      return query;
    },
    limit(value) {
      calls.push(["limit", value]);
      return Promise.resolve(response);
    },
  };

  return {
    from(table) {
      calls.push(["from", table]);
      return query;
    },
  };
}

const mocks = {
  "server-only": {},
  "@/lib/supabase/admin": {
    createAdminClient() {
      adminClientCreated = true;
      return queryMock();
    },
  },
  "@/lib/notifications/reconciliation-authorization": {
    async getAuthorizedNotificationReconciliationOperator() {
      return authorized
        ? { kind: "admin", userId: UUID_A }
        : null;
    },
  },
};

const loaded = new Module(filename, module);

loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));

loaded.require = function (request) {
  if (!Object.hasOwn(mocks, request)) {
    throw new Error(`Importacao inesperada: ${request}`);
  }

  return mocks[request];
};

loaded._compile(compiled, filename);

const { getNotificationReconciliationAdminItems } = loaded.exports;

let passed = 0;

async function test(name, fn) {
  authorized = true;
  response = { data: [validRow()], error: null };
  calls = [];
  adminClientCreated = false;

  await fn();

  passed++;
  console.log(`OK ${passed}: ${name}`);
}

async function main() {
  await test("Administrador autorizado", async () => {
    const items = await getNotificationReconciliationAdminItems();

    assert.equal(items.length, 1);
    assert.equal(items[0].id, UUID_A);
    assert.equal(adminClientCreated, true);
  });

  await test("Acesso nao autorizado bloqueado antes do banco", async () => {
    authorized = false;

    await assert.rejects(
      getNotificationReconciliationAdminItems(),
      /nao autorizado/
    );

    assert.equal(adminClientCreated, false);
  });

  await test("Limites invalidos rejeitados", async () => {
    for (const limit of [0, -1, 21, 1.5, NaN, Infinity]) {
      await assert.rejects(
        getNotificationReconciliationAdminItems(limit),
        /Limite/
      );
    }

    assert.equal(adminClientCreated, false);
  });

  await test("Consulta limitada e ordenada", async () => {
    await getNotificationReconciliationAdminItems(7);

    assert.deepEqual(calls, [
      ["from", "notification_deliveries"],
      ["select", expectedColumns],
      ["eq", "status", "reconciliation_required"],
      ["order", "created_at", { ascending: true }],
      ["order", "id", { ascending: true }],
      ["limit", 7],
    ]);
  });

  await test("Somente campos permitidos retornados", async () => {
    response.data = [
      validRow({
        recipient_id: "PRIVATE",
        phone: "PRIVATE",
        payload: { secret: "PRIVATE" },
        last_error: "PRIVATE",
      }),
    ];

    const items = await getNotificationReconciliationAdminItems();

    assert.deepEqual(Object.keys(items[0]), [
      "id",
      "eventId",
      "channel",
      "provider",
      "status",
      "attemptCount",
      "maxAttempts",
      "lastAttemptAt",
      "createdAt",
    ]);

    assert.equal(JSON.stringify(items).includes("PRIVATE"), false);
  });

  await test("Erro de consulta propagado", async () => {
    response = {
      data: null,
      error: { code: "42501" },
    };

    await assert.rejects(
      getNotificationReconciliationAdminItems(),
      /42501/
    );
  });

  await test("Resposta nula nao vira lista vazia", async () => {
    response = { data: null, error: null };

    await assert.rejects(
      getNotificationReconciliationAdminItems(),
      /Resposta invalida/
    );
  });

  await test("Status inesperado rejeitado", async () => {
    response.data = [validRow({ status: "sent" })];

    await assert.rejects(
      getNotificationReconciliationAdminItems(),
      /inconsistente/
    );
  });

  await test("Registros malformados rejeitados", async () => {
    for (const row of [
      null,
      {},
      validRow({ id: "invalid" }),
      validRow({ attempt_count: -1 }),
      validRow({ max_attempts: 0 }),
      validRow({ created_at: "invalid" }),
      validRow({ channel: "" }),
    ]) {
      response.data = [row];

      await assert.rejects(
        getNotificationReconciliationAdminItems(),
        /inconsistente/
      );
    }
  });

  await test("Excesso de registros rejeitado", async () => {
    response.data = Array.from(
      { length: 21 },
      () => validRow()
    );

    await assert.rejects(
      getNotificationReconciliationAdminItems(),
      /acima do limite/
    );
  });

  await test("Resultados e itens congelados", async () => {
    const items = await getNotificationReconciliationAdminItems();

    assert.equal(Object.isFrozen(items), true);
    assert.equal(Object.isFrozen(items[0]), true);
  });

  await test("Consulta vazia valida", async () => {
    response.data = [];

    const items = await getNotificationReconciliationAdminItems();

    assert.deepEqual(items, []);
    assert.equal(Object.isFrozen(items), true);
  });

  console.log(`\nRESULTADO: ${passed}/${passed} TESTES APROVADOS`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});