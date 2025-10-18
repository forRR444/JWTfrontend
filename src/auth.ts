export const getToken = () => localStorage.getItem("access_token");
export const setAuth = (
  token: string,
  expires?: string | number,
  user?: unknown
) => {
  localStorage.setItem("access_token", token);
  if (expires != null)
    localStorage.setItem("access_token_expires", String(expires));
  if (user != null) localStorage.setItem("current_user", JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("access_token_expires");
  localStorage.removeItem("current_user");
};
