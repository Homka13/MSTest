import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserRole } from '../authRoles';
import { AccountInfo } from '@azure/msal-browser';

describe('authRoles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('identifies admin via Entra ID App Roles token claim', () => {
    const account: Partial<AccountInfo> = {
      username: 'moderator@company.com',
      idTokenClaims: {
        roles: ['Admin'],
      },
    };

    const roleInfo = getUserRole(account as AccountInfo);
    expect(roleInfo.isAdmin).toBe(true);
    expect(roleInfo.role).toBe('admin');
    expect(roleInfo.roleSource).toBe('entra_token');
  });

  it('assigns trainer role by default if no admin role exists in token', () => {
    const account: Partial<AccountInfo> = {
      username: 'external.trainer@brand.com',
      idTokenClaims: {
        roles: ['Trainer'],
      },
    };

    const roleInfo = getUserRole(account as AccountInfo);
    expect(roleInfo.isAdmin).toBe(false);
    expect(roleInfo.isTrainer).toBe(true);
    expect(roleInfo.role).toBe('trainer');
    expect(roleInfo.roleSource).toBe('default_trainer');
  });

  it('assigns trainer role if roles array is missing or empty', () => {
    const account: Partial<AccountInfo> = {
      username: 'guest.user@vendor.com',
      idTokenClaims: {},
    };

    const roleInfo = getUserRole(account as AccountInfo);
    expect(roleInfo.isAdmin).toBe(false);
    expect(roleInfo.isTrainer).toBe(true);
    expect(roleInfo.role).toBe('trainer');
  });

  it('supports admin email fallback via VITE_ADMIN_EMAILS', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@lms.local,lead@company.com');

    const account: Partial<AccountInfo> = {
      username: 'lead@company.com',
      idTokenClaims: {},
    };

    const roleInfo = getUserRole(account as AccountInfo);
    expect(roleInfo.isAdmin).toBe(true);
    expect(roleInfo.roleSource).toBe('admin_whitelist');

    vi.unstubAllEnvs();
  });
});
