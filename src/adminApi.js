export const ADMIN_TOKEN_KEY = "satvapustiAdminToken";
export const ADMIN_EXPIRY_KEY = "satvapustiAdminExpiry";

export const saveAdminSession = ({ token, expiresAt }) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_EXPIRY_KEY, String(expiresAt || 0));
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_EXPIRY_KEY);
  localStorage.removeItem("satvapustiLoginTime");
};

export const getAdminToken = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  const expiresAt = Number(localStorage.getItem(ADMIN_EXPIRY_KEY) || 0);
  if (!token || !expiresAt || expiresAt <= Date.now()) {
    clearAdminSession();
    return "";
  }
  return token;
};

export const adminFetch = async (url, options = {}) => {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAdminSession();
    if (window.location.pathname !== "/admin-login") {
      window.location.href = "/?page=admin-login";
    }
  }
  return response;
};

export const logoutAdmin = async (apiUrl) => {
  try {
    await adminFetch(`${apiUrl}/api/admin/logout`, { method: "POST" });
  } finally {
    clearAdminSession();
    window.location.href = "/?page=admin-login";
  }
};
