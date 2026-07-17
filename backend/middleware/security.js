const crypto = require("node:crypto");

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 20;
const sessions = new Map();

const tokenHash = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

const cleanupSessions = () => {
  const now = Date.now();
  for (const [hash, session] of sessions.entries()) {
    if (session.expiresAt <= now) sessions.delete(hash);
  }
  while (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value);
  }
};

const createAdminSession = () => {
  cleanupSessions();
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(tokenHash(token), { expiresAt });
  return { token, expiresAt };
};

const readBearerToken = (req) => {
  const authorization = String(req.get("authorization") || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
};

const getAdminSession = (req, { refresh = true } = {}) => {
  cleanupSessions();
  const token = readBearerToken(req);
  if (!token) return null;
  const hash = tokenHash(token);
  const session = sessions.get(hash);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(hash);
    return null;
  }
  if (refresh) {
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(hash, session);
  }
  return { hash, expiresAt: session.expiresAt };
};

const requireAdmin = (req, res, next) => {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ success: false, message: "Admin login required" });
  }
  req.adminSession = session;
  next();
};

const optionalAdmin = (req) => Boolean(getAdminSession(req, { refresh: false }));

const destroyAdminSession = (req) => {
  const token = readBearerToken(req);
  if (token) sessions.delete(tokenHash(token));
};

const safePasswordEqual = (candidate, expected) => {
  const candidateHash = crypto.createHash("sha256").update(String(candidate || "")).digest();
  const expectedHash = crypto.createHash("sha256").update(String(expected || "")).digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
};

const createRateLimiter = ({ windowMs, max, message }) => {
  const attempts = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const entry = attempts.get(key);
    const current = !entry || entry.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : entry;
    current.count += 1;
    attempts.set(key, current);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - current.count)));
    res.set("RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));
    if (current.count > max) {
      res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        message: message || "Too many requests. Please try again later.",
      });
    }
    if (attempts.size > 5000) {
      for (const [attemptKey, value] of attempts.entries()) {
        if (value.resetAt <= now) attempts.delete(attemptKey);
      }
    }
    next();
  };
};

module.exports = {
  createAdminSession,
  createRateLimiter,
  destroyAdminSession,
  optionalAdmin,
  requireAdmin,
  safePasswordEqual,
};
