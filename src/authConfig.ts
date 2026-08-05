import { Configuration, PublicClientApplication, PopupRequest } from "@azure/msal-browser";

// Тенант KnowlageUploadPortal — це тенант Microsoft Entra External ID (CIAM).
// Такі тенанти обслуговуються ЛИШЕ на домені <tenant>.ciamlogin.com.
// Спроба входу через login.microsoftonline.com дає AADSTS500208
// ("The domain is not a valid login domain for the account type")
// саме на етапі після введення Email OTP.
const TENANT_ID =
  import.meta.env.VITE_AZURE_TENANT_ID || "819577b9-6a41-43a1-af35-c48622760ad9";
const CIAM_DOMAIN =
  import.meta.env.VITE_AZURE_CIAM_DOMAIN || "KnowlageUploadPortal.ciamlogin.com";

// 1. Конфігурація App Registration з Microsoft Entra ID
export const msalConfig: Configuration = {
  auth: {
    // ID додатка з App Registration
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "483ad8a5-ad99-460c-8a4e-de7cf724b494",

    authority: `https://${CIAM_DOMAIN}/${TENANT_ID}`,

    // Домен CIAM не входить у список довірених за замовчуванням,
    // тому MSAL вимагає явно його дозволити
    knownAuthorities: [CIAM_DOMAIN],

    // Exact redirect URI
    redirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
  },
  cache: {
    // sessionStorage, а не localStorage: токени живуть лише поки відкрита
    // вкладка і не залишаються на диску після закриття браузера.
    // Редірект-флоу це не ламає — повернення відбувається в ту саму вкладку.
    cacheLocation: "sessionStorage",
  },
};

// 2. Ініціалізація MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// 3. Права доступу (Scopes), які запитуємо при логіні.
// User.Read (Microsoft Graph) для користувачів External ID недоступний —
// застосунок бере ім'я та email з ID-токена.
export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "offline_access"],
};
