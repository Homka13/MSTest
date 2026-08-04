import { Configuration, PublicClientApplication, PopupRequest } from "@azure/msal-browser";

// 1. Конфігурація App Registration з Microsoft Entra ID
export const msalConfig: Configuration = {
  auth: {
    // ID твого додатка з App Registration
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "ТВІЙ-CLIENT-ID-З-APP-REGISTRATION",
    
    // Для гостьового B2B-домену (або мультитенантного входу)
    // Замість "common" можна вказати конкретний Tenant ID: "https://login.microsoftonline.com/ТВІЙ-TENANT-ID"
    authority: import.meta.env.VITE_AZURE_TENANT_ID 
      ? `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`
      : "https://login.microsoftonline.com/ТВІЙ-TENANT-ID",
    
    // Куди повертати юзера після входу (адреса твоєї Static Web Page)
    redirectUri: typeof window !== "undefined" ? window.location.origin : "",
  },
  cache: {
    cacheLocation: "sessionStorage", // або "localStorage"
  },
};

// 2. Ініціалізація MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// 3. Права доступу (Scopes), які запитуємо при логіні
export const loginRequest: PopupRequest = {
  scopes: ["User.Read", "openid", "profile"],
};
