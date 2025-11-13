import axios from "./axios";

/**
 * Check if JWT token is valid
 * @param token - JWT token string
 * @returns boolean indicating if token is valid
 */
export function isTokenValid(token: string): boolean {
  if (!token) return false;

  try {
    // Decode JWT token (simple base64 decode of payload)
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Check if token has expired
    if (payload.exp) {
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    }

    return true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

/**
 * Set session token in localStorage and axios headers
 * @param token - JWT token string or null to remove
 */
export function setSession(token: string | null): void {
  if (token) {
    localStorage.setItem("authToken", token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("authToken");
    delete axios.defaults.headers.common.Authorization;
  }
}
