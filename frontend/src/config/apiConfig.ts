export const API_CONFIG = {
  BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "https://financeapp-bg0k.onrender.com",

  API_VERSION: "v1",

  TIMEOUT: 10000,

  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, 
} as const;

export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

export const getApiConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  return {
    ...API_CONFIG,
    isDevelopment,
    isProduction,
    baseUrl: isDevelopment
      ? import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
      : API_CONFIG.BASE_URL,
  };
};
