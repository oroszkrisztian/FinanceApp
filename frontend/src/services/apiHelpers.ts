import { buildApiUrl, API_CONFIG } from "../config/apiConfig";

export const getAuthHeaders = (): HeadersInit => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const refreshToken = async (): Promise<boolean> => {
  try {
    const storedToken =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!storedToken) return false;

    const response = await fetch(buildApiUrl("api/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: storedToken }),
    });

    if (!response.ok) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      return false;
    }

    const data = await response.json();
    const storage = localStorage.getItem("token")
      ? localStorage
      : sessionStorage;
    storage.setItem("token", data.token);
    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    return false;
  }
};

export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Authentication failed");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
};

export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  let headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  // Build full URL if it's a relative path
  const fullUrl = url.startsWith("http") ? url : buildApiUrl(url);

  let response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers = {
        ...getAuthHeaders(),
        ...options.headers,
      };
      response = await fetch(fullUrl, {
        ...options,
        headers,
      });
    }
  }

  return handleApiResponse(response);
};

export const api = {
  get: (url: string, options?: RequestInit) =>
    apiRequest(url, { ...options, method: "GET" }),

  post: (url: string, data?: any, options?: RequestInit) =>
    apiRequest(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: RequestInit) =>
    apiRequest(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestInit) =>
    apiRequest(url, { ...options, method: "DELETE" }),

  patch: (url: string, data?: any, options?: RequestInit) =>
    apiRequest(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
};
