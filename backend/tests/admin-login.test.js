const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { randomBytes } = require("node:crypto");

test("frontend rejects the old backend response instead of redirecting with an invalid session", async () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../../src/adminApi.js"), "utf8");
  const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  const values = new Map();
  const previous = global.localStorage;
  global.localStorage = {
    setItem: (key, value) => values.set(key, String(value)),
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  };
  try {
    assert.throws(() => api.saveAdminSession({ success: true, token: "satvapusti-admin-login" }), /backend deployment/);
    assert.equal(api.getAdminToken(), "");
    const token = randomBytes(32).toString("base64url");
    api.saveAdminSession({ token, expiresAt: Date.now() + 60000 });
    assert.equal(api.getAdminToken(), token);
    // A fresh module, like a page reload, can recover the stored session.
    const reloaded = await import(`data:text/javascript;base64,${Buffer.from(source + "\n// reload").toString("base64")}`);
    assert.equal(reloaded.getAdminToken(), token);
    values.set(api.ADMIN_EXPIRY_KEY, String(Date.now() - 1));
    assert.equal(api.getAdminToken(), "");
    assert.equal(values.size, 0);
  } finally {
    if (previous === undefined) delete global.localStorage;
    else global.localStorage = previous;
  }
});

test("real admin HTTP handlers enforce login, session validation, CORS and logout without a database", async (t) => {
  const filename = path.resolve(__dirname, "../server.js");
  const localRequire = createRequire(filename);
  const express = localRequire("express");
  const password = randomBytes(32).toString("hex");
  let server;
  // Run the actual server handlers with database startup and unrelated order
  // integrations isolated. No .env is loaded and no customer data is accessed.
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
    require(name) {
      if (name === "dotenv") return { config() {} };
      if (name === "mongoose") return { connect: () => new Promise(() => {}) };
      if (name === "express") return Object.assign(() => {
        const app = express();
        app.listen = () => { server = require("node:http").createServer(app).listen(0, "127.0.0.1"); };
        return app;
      }, express);
      return localRequire(name);
    },
    process: { env: { ADMIN_PASSWORD: password } },
    console,
  }, { filename });
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  if (!server.listening) await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = (value) => fetch(`${base}/api/admin/login`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://satvapusti.com" },
    body: JSON.stringify({ password: value }),
  });
  assert.equal((await fetch(`${base}/api/admin/session`)).status, 401);
  const wrong = await login("incorrect");
  assert.equal(wrong.status, 401);
  assert.equal((await wrong.json()).success, false);
  const success = await login(password);
  assert.equal(success.status, 200);
  assert.equal(success.headers.get("access-control-allow-origin"), "https://satvapusti.com");
  const session = await success.json();
  assert.match(session.token, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(session.expiresAt > Date.now());
  const headers = { Authorization: `Bearer ${session.token}` };
  for (let refresh = 0; refresh < 2; refresh++) {
    assert.equal((await fetch(`${base}/api/admin/session`, { headers })).status, 200);
  }
  const preflight = await fetch(`${base}/api/admin/session`, {
    method: "OPTIONS", headers: { Origin: "https://satvapusti.com", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" },
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get("access-control-allow-headers"), /Authorization/i);
  assert.equal((await fetch(`${base}/api/admin/logout`, { method: "POST", headers })).status, 200);
  assert.equal((await fetch(`${base}/api/admin/session`, { headers })).status, 401);
  assert.equal((await fetch(`${base}/api/products?includeInactive=true`)).status, 401);
  assert.equal((await fetch(`${base}/api/orders/all`)).status, 401);
  assert.equal((await fetch(`${base}/api/inventory/family/1KG`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 401);
});
