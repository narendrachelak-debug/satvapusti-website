const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
  safePasswordEqual,
} = require("../middleware/security");

const root = path.resolve(__dirname, "../..");

const requestWithToken = (token) => ({
  get: (name) => name.toLowerCase() === "authorization" ? `Bearer ${token}` : "",
});

const responseRecorder = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.payload = payload; return this; },
});

test("admin sessions reject missing and invented browser tokens", () => {
  for (const token of ["", "admin_logged_in", "satvapusti-admin-login"]) {
    const res = responseRecorder();
    let nextCalled = false;
    requireAdmin(requestWithToken(token), res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  }
});

test("random admin session is accepted and logout invalidates it", () => {
  const session = createAdminSession();
  const req = requestWithToken(session.token);
  const res = responseRecorder();
  let nextCalled = false;
  requireAdmin(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  destroyAdminSession(req);
  const afterLogout = responseRecorder();
  requireAdmin(req, afterLogout, () => assert.fail("logged-out token was accepted"));
  assert.equal(afterLogout.statusCode, 401);
});

test("password comparison is exact", () => {
  assert.equal(safePasswordEqual("long-password", "long-password"), true);
  assert.equal(safePasswordEqual("wrong-password", "long-password"), false);
});

test("sensitive order and mutation routes require admin middleware", () => {
  const orderRoutes = fs.readFileSync(path.join(root, "backend/routes/orderRoutes.js"), "utf8");
  const server = fs.readFileSync(path.join(root, "backend/server.js"), "utf8");
  for (const route of ["/all", "/reports/sales", "/customer/:mobile", "/status/:id", "/admin/update/:id", "/whatsapp-template/:id/:template", "/admin/test-email"]) {
    assert.match(orderRoutes, new RegExp(`router\\.(?:get|post|put)\\(\\"${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\", requireAdmin`));
  }
  assert.match(server, /app\.put\("\/api\/inventory\/:productId\/:weight", requireAdmin/);
  assert.match(server, /app\.post\("\/api\/products", requireAdmin/);
  assert.match(server, /app\.put\("\/api\/products\/:id", requireAdmin/);
});
