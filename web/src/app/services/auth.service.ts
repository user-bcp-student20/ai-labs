import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { AuthenticatedUser, LoginRequest, LoginResponse, UserPreferences } from '../models/auth.models';

const TOKEN_KEY = 'workshop_token';
const USER_KEY = 'workshop_user';
const PREFERENCES_KEY = 'workshop_preferences';
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  showTips: true,
  compact: false
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(environment.authUrl, credentials, { timeout: 5000 });
    return response.data;
  }

  saveSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): AuthenticatedUser | null {
    const serializedUser = localStorage.getItem(USER_KEY);
    return serializedUser ? JSON.parse(serializedUser) as AuthenticatedUser : null;
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getPreferences(): UserPreferences {
    const serializedPreferences = localStorage.getItem(PREFERENCES_KEY);
    if (!serializedPreferences) {
      return { ...DEFAULT_PREFERENCES };
    }

    try {
      const savedPreferences: unknown = JSON.parse(serializedPreferences);
      if (typeof savedPreferences !== 'object' || savedPreferences === null || Array.isArray(savedPreferences)) {
        return { ...DEFAULT_PREFERENCES };
      }
      return { ...DEFAULT_PREFERENCES, ...savedPreferences } as UserPreferences;
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  savePreferences(preferences: UserPreferences): void {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }
}