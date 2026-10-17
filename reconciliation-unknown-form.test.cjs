const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");

const filename = path.resolve(
  "app/admin/notificacoes/reconciliation-unknown-form.tsx"
);

const source = fs.readFileSync(filename, "utf8");

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;

const DELIVERY_A = "11111111-1111-4111-8111-111111111111";
const DELIVERY_B = "22222222-2222-4222-8222-222222222222";
const AUDIT_ID = "33333333-3333-4333-8333-333333333333";

let states = [];
let refs = [];
let stateIndex = 0;
let refIndex = 0;
let calls = [];
let actionImpl;

function useState(initial) {
  const index = stateIndex++;

  if (!(index in states)) {
    states[index] = initial;
  }

  return [
    states[index],
    (value) => {
      states[index] =
        typeof value === "function"
          ? value(states[index])
          : value;
    },
  ];
}

function useRef(initial) {
  const index = refIndex++;

  if (!(index in refs)) {
    refs[index] = { current: initial };
  }

  return refs[index];
}

const mocks = {
  react: { useState, useRef },
  "react/jsx-runtime": {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
  "./actions": {
    async recordUnknownReconciliationAction(input) {
      calls.push(input);
      return actionImpl(input);
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

const Form = loaded.exports.default;

function render(deliveryId = DELIVERY_A) {
  stateIndex = 0;
  refIndex = 0;
  return Form({ deliveryId });
}

function children(node) {
  const value = node?.props?.children;
  return Array.isArray(value) ? value : [value];
}

function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;

  for (const child of children(node)) {
    const result = find(child, predicate);
    if (result) return result;
  }

  return null;
}

function controls(deliveryId = DELIVERY_A) {
  const tree = render(deliveryId);

  return {
    tree,
    form: find(tree, (node) => node.type === "form"),
    reference: find(
      tree,
      (node) => node.type === "input" &&
        node.props.type === "text"
    ),
    reason: find(tree, (node) => node.type === "textarea"),
    confirmation: find(
      tree,
      (node) => node.type === "input" &&
        node.props.type === "checkbox"
    ),
    button: find(tree, (node) => node.type === "button"),
  };
}

async function submit(form) {
  return form.props.onSubmit({
    preventDefault() {},
  });
}

function populate() {
  let c = controls();

  c.reference.props.onChange({
    target: { value: "consulta-manual-inconclusiva" },
  });

  c = controls();

  c.reason.props.onChange({
    target: { value: "Resultado externo desconhecido." },
  });

  c = controls();

  c.confirmation.props.onChange({
    target: { checked: true },
  });

  return controls();
}

function reset() {
  states = [];
  refs = [];
  calls = [];

  actionImpl = async () => ({
    success: true,
    auditId: AUDIT_ID,
    resultingStatus: "reconciliation_required",
  });
}

let passed = 0;

async function test(name, fn) {
  reset();
  await fn();
  passed++;
  console.log(`OK ${passed}: ${name}`);
}

async function main() {
  await test("Confirmacao obrigatoria", async () => {
    const c = controls();

    await submit(c.form);

    assert.equal(calls.length, 0);
  });

  await test("Identificador criado na primeira tentativa", async () => {
    const c = populate();

    await submit(c.form);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].deliveryId, DELIVERY_A);
    assert.match(
      calls[0].operationId,
      /^[0-9a-f]{8}-[0-9a-f-]{27,}$/
    );
  });

  await test("Falha preserva identificador", async () => {
    actionImpl = async () => ({
      success: false,
    });

    let c = populate();

    await submit(c.form);

    const firstId = calls[0].operationId;

    c = controls();
    await submit(c.form);

    assert.equal(calls.length, 2);
    assert.equal(calls[1].operationId, firstId);
  });

  await test("Envios simultaneos bloqueados", async () => {
    let resolveAction;

    actionImpl = () => new Promise((resolve) => {
      resolveAction = resolve;
    });

    const c = populate();

    const first = submit(c.form);
    const second = submit(c.form);

    assert.equal(calls.length, 1);

    resolveAction({
      success: true,
      auditId: AUDIT_ID,
      resultingStatus: "reconciliation_required",
    });

    await Promise.all([first, second]);
  });

  await test("Entrega alterada bloqueada", async () => {
    actionImpl = async () => ({ success: false });

    let c = populate();
    await submit(c.form);

    c = controls(DELIVERY_B);
    await submit(c.form);

    assert.equal(calls.length, 1);
  });

  await test("Dados alterados bloqueados", async () => {
    actionImpl = async () => ({ success: false });

    let c = populate();
    await submit(c.form);

    states[0] = "referencia-diferente";

    c = controls();
    await submit(c.form);

    assert.equal(calls.length, 1);
  });

  await test("Novo envio bloqueado apos sucesso", async () => {
    const c = populate();

    await submit(c.form);
    await submit(controls().form);

    assert.equal(calls.length, 1);
  });

  await test("Identificador apresentado na interface", async () => {
    actionImpl = async () => ({ success: false });

    const c = populate();
    await submit(c.form);

    const tree = render();

    function allText(node) {
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(allText).join("");
      if (!node || typeof node !== "object") return "";
      return allText(node.props?.children);
    }

    assert.equal(
      allText(tree).includes(calls[0].operationId),
      true
    );
  });

  await test("Resposta positiva com status conclusivo rejeitada", async () => {
    actionImpl = async () => ({
      success: true,
      auditId: AUDIT_ID,
      resultingStatus: "sent",
    });

    await submit(populate().form);

    const original = { ...calls[0] };

    assert.equal(states[5], false);

    await submit(controls().form);

    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], original);
  });

  await test("Resposta positiva sem auditoria rejeitada", async () => {
    actionImpl = async () => ({
      success: true,
      resultingStatus: "reconciliation_required",
    });

    await submit(populate().form);

    const original = { ...calls[0] };

    assert.equal(states[5], false);

    await submit(controls().form);

    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], original);
  });

  await test("Resposta positiva com UUID de auditoria invalido rejeitada", async () => {
    actionImpl = async () => ({
      success: true,
      auditId: "identificador-invalido",
      resultingStatus: "reconciliation_required",
    });

    await submit(populate().form);

    const original = { ...calls[0] };

    assert.equal(states[5], false);

    await submit(controls().form);

    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], original);
  });
  await test("Excecao de rede preserva intencao original", async () => {
    actionImpl = async () => {
      throw new Error("Falha simulada de comunicacao");
    };

    await submit(populate().form);

    assert.equal(calls.length, 1);
    assert.equal(states[5], false);

    const original = { ...calls[0] };
    const firstTree = render();

    function allText(node) {
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(allText).join("");
      if (!node || typeof node !== "object") return "";
      return allText(node.props?.children);
    }

    assert.equal(
      allText(firstTree).includes("O registro pode ter sido gravado"),
      true
    );

    assert.equal(
      allText(firstTree).includes(original.operationId),
      true
    );

    await submit(controls().form);

    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], original);
    assert.equal(states[5], false);
  });
  console.log(`\nRESULTADO: ${passed}/${passed} TESTES APROVADOS`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});