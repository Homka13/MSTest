import { AccountInfo } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';

export type UserRole = 'admin' | 'trainer';

export interface UserRoleInfo {
  role: UserRole;
  isAdmin: boolean;
  isTrainer: boolean;
  rolesFromToken: string[];
  roleSource: 'entra_token' | 'admin_whitelist' | 'default_trainer';
}

/**
 * Визначення ролі користувача за корпоративним стандартом Microsoft Entra ID (App Roles)
 */
export function getUserRole(account: AccountInfo | null): UserRoleInfo {
  if (!account) {
    return {
      role: 'trainer',
      isAdmin: false,
      isTrainer: true,
      rolesFromToken: [],
      roleSource: 'default_trainer',
    };
  }

  // 1. Офіційний клейм App Roles із токена Entra ID ("roles": ["Admin", ...])
  const claims = account.idTokenClaims as Record<string, any> | undefined;
  const rawRoles = claims?.roles;
  const rolesFromToken: string[] = Array.isArray(rawRoles) ? rawRoles : [];

  const hasAdminAppRole = rolesFromToken.some(
    r => typeof r === 'string' && ['admin', 'lms.admin', 'administrator'].includes(r.toLowerCase().trim())
  );

  if (hasAdminAppRole) {
    return {
      role: 'admin',
      isAdmin: true,
      isTrainer: false,
      rolesFromToken,
      roleSource: 'entra_token',
    };
  }

  // 2. Резервна перевірка за списком адмін-пошт із VITE_ADMIN_EMAILS (для локальної розробки та перехідного періоду)
  const adminEmailsEnv = (import.meta.env.VITE_ADMIN_EMAILS || '').toLowerCase();
  const adminEmailsList = adminEmailsEnv.split(',').map((e: string) => e.trim()).filter(Boolean);

  const userEmail = (account.username || claims?.preferred_username || claims?.email || '').toLowerCase().trim();

  if (userEmail && adminEmailsList.includes(userEmail)) {
    return {
      role: 'admin',
      isAdmin: true,
      isTrainer: false,
      rolesFromToken,
      roleSource: 'admin_whitelist',
    };
  }

  // 3. За замовчуванням будь-який зареєстрований через Email OTP користувач є Тренером
  return {
    role: 'trainer',
    isAdmin: false,
    isTrainer: true,
    rolesFromToken,
    roleSource: 'default_trainer',
  };
}

/**
 * React-хук для отримання ролі поточного користувача
 */
export function useUserRole(): UserRoleInfo {
  const { instance, accounts } = useMsal();
  const activeAccount = instance.getActiveAccount() || accounts[0] || null;
  return getUserRole(activeAccount);
}
