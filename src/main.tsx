import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { EventType, AuthenticationResult } from '@azure/msal-browser';
import { msalInstance } from './authConfig';
import App from './App';
import './index.css';

// 1. Реєструємо слухач подій входу до ініціалізації
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    if (payload.account) {
      msalInstance.setActiveAccount(payload.account);
    }
  }
});

async function initAndRender() {
  // 1. Ініціалізуємо MSAL
  await msalInstance.initialize();

  // 2. Обробляємо токен авторизації від Microsoft після повернення з редіректу.
  // Нічого з відповіді не логуємо: AuthenticationResult містить idToken і
  // accessToken у відкритому вигляді, а account — ідентифікатори користувача.
  try {
    const redirectResponse = await msalInstance.handleRedirectPromise();

    if (redirectResponse?.account) {
      msalInstance.setActiveAccount(redirectResponse.account);
    } else if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
      msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
    }
  } catch (error) {
    // Друкуємо лише повідомлення, без об'єкта помилки з деталями запиту
    console.warn(
      'Помилка обробки токена авторизації MSAL:',
      error instanceof Error ? error.message : 'невідома помилка',
    );
  }

  // 3. Рендеримо React
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>,
  );
}

initAndRender();
