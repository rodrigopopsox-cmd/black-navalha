const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");

const filename = path.resolve(
  "app/admin/notificacoes/actions.ts"
);

const source = fs.readFileSync(filename, "utf8");

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const OPERATION_ID = "11111111-1111-4111-8111-111111111111";
const DELIVERY_ID = "22222222-2222-4222-8222-222222222222";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

let authorized = true;
let recordingCalls = [];
let recordingError = null;
let recordingResult = null;

function validInput(overrides = {}) {
  return {
    operationId: OPERATION_ID,
    deliveryId: DELIVERY_ID,
    evidenceReference: "consulta-manual-inconclusiva",
    reason: "Resultado externo permanece desconhecido.",
    confirmation: true,
    ...overrides,
  };
}

const mocks = {
  "@/lib/notifications/reconciliation-authorization": {
    async getAuthorizedNotificationReconciliationOperator() {
      return authorized
        ? { kind: "admin", userId: OPERATION_ID }
        : null;
    },
  },
  "@/lib/notifications/reconciliation-unknown-recording": {
    async recordUnknownNotificationReconciliation(input) {
      recordingCalls.push(input);

      if (recordingError) {
        throw recordingError;
      }

      return recordingResult ?? {
        auditId: AUDIT_ID,
        resultingStatus: "reconciliation_required",
        evidenceVerified: false,
        conclusiveTransitionAllowed: false,
      };
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

const {
  recordUnknownReconciliationAction,
} = loaded.exports;

let passed = 0;

async function test(name, fn) {
  authorized = true;
  recordingCalls = [];
  recordingError = null;
  recordingResult = null;

  await fn();

  passed++;
  console.log(`OK ${passed}: ${name}`);
}

async function main() {
  await test("Administrador autorizado registra proposta", async () => {
    const result = await recordUnknownReconciliationAction(
      validInput()
    );

    assert.equal(result.success, true);
    assert.equal(result.auditId, AUDIT_ID);
    assert.equal(result.resultingStatus, "reconciliation_required");
    assert.equal(recordingCalls.length, 1);
  });

  await test("Nao-admin bloqueado antes do registro", async () => {
    authorized = false;

    const result = await recordUnknownReconciliationAction(
      validInput()
    );

    assert.equal(result.success, false);
    assert.equal(recordingCalls.length, 0);
  });

  await test("Entrada nula rejeitada", async () => {
    const result = await recordUnknownReconciliationAction(null);

    assert.equal(result.success, false);
    assert.equal(recordingCalls.length, 0);
  });

  await test("UUID da operacao obrigatorio", async () => {
    const result = await recordUnknownReconciliationAction(
      validInput({ operationId: "invalid" })
    );

    assert.equal(result.success, false);
    assert.equal(recordingCalls.length, 0);
  });

  await test("UUID da entrega obrigatorio", async () => {
    const result = await recordUnknownReconciliationAction(
      validInput({ deliveryId: "invalid" })
    );

    assert.equal(result.success, false);
    assert.equal(recordingCalls.length, 0);
  });

  await test("Referencia valida exigida", async () => {
    for (const value of ["", " referencia", "a".repeat(201)]) {
      const result = await recordUnknownReconciliationAction(
        validInput({ evidenceReference: value })
      );

      assert.equal(result.success, false);
    }

    assert.equal(recordingCalls.length, 0);
  });

  await test("Justificativa valida exigida", async () => {
    for (const value of ["", " justificativa", "a".repeat(501)]) {
      const result = await recordUnknownReconciliationAction(
        validInput({ reason: value })
      );

      assert.equal(result.success, false);
    }

    assert.equal(recordingCalls.length, 0);
  });

  await test("Confirmacao explicita obrigatoria", async () => {
    for (const confirmation of [false, null, "true", 1]) {
      const result = await recordUnknownReconciliationAction(
        validInput({ confirmation })
      );

      assert.equal(result.success, false);
    }

    assert.equal(recordingCalls.length, 0);
  });

  await test("Identificador de operacao preservado", async () => {
    await recordUnknownReconciliationAction(
      validInput({
        operationId: OPERATION_ID.toUpperCase(),
      })
    );

    assert.equal(recordingCalls[0].operationId, OPERATION_ID);
  });

  await test("Repeticao preserva idempotencia da intencao", async () => {
    const input = validInput();

    await recordUnknownReconciliationAction(input);
    await recordUnknownReconciliationAction(input);

    assert.equal(recordingCalls.length, 2);
    assert.equal(recordingCalls[0].operationId, OPERATION_ID);
    assert.equal(recordingCalls[1].operationId, OPERATION_ID);
  });

  await test("Falha interna nao exposta", async () => {
    recordingError = new Error("SUPABASE_SECRET_INTERNAL");

    const result = await recordUnknownReconciliationAction(
      validInput()
    );

    assert.equal(result.success, false);
    assert.equal(
      JSON.stringify(result).includes("SUPABASE_SECRET_INTERNAL"),
      false
    );
  });

  await test("Resultado conclusivo inesperado rejeitado", async () => {
    recordingResult = {
      auditId: AUDIT_ID,
      resultingStatus: "sent",
      evidenceVerified: true,
      conclusiveTransitionAllowed: true,
    };

    const result = await recordUnknownReconciliationAction(
      validInput()
    );

    assert.equal(result.success, false);
  });

  console.log(`\nRESULTADO: ${passed}/${passed} TESTES APROVADOS`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});