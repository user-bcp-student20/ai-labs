import { readFileSync } from 'node:fs';
import '@angular/compiler';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';

describe('LoginComponent characterization', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    router = { navigate: vi.fn().mockResolvedValue(true) } as unknown as Router;
    authService = {
      login: vi.fn(),
      getPreferences: vi.fn().mockReturnValue({ theme: 'light', showTips: true, compact: false }),
      saveSession: vi.fn(),
      savePreferences: vi.fn()
    } as unknown as AuthService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads preferences from the auth service', () => {
    vi.mocked(authService.getPreferences).mockReturnValue({ theme: 'light', showTips: true, compact: true });
    const component = new LoginComponent(authService, router);
    expect(component.preferences).toEqual({ theme: 'light', showTips: true, compact: true });
    expect(authService.getPreferences).toHaveBeenCalledOnce();
  });

  it('rejects blank username and password without calling the backend', async () => {
    const component = new LoginComponent(authService, router);
    await component.login();
    expect(component.messageTitle).toBe('Ingrese un usuario.');
    expect(component.messageDetail).toBe('');

    component.username = 'student';
    component.password = ' ';
    await component.login();
    expect(component.messageTitle).toBe('Ingrese una contraseña.');
    expect(component.messageDetail).toBe('');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('posts credentials and stores the returned session before navigating', async () => {
    const user = { username: 'student', displayName: 'Workshop Student', role: 'STUDENT' };
    const response = { token: 'test-token', user };
    vi.mocked(authService.login).mockResolvedValueOnce(response);
    const component = new LoginComponent(authService, router);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(authService.login).toHaveBeenCalledWith(
      { username: 'student', password: 'Workshop123!', client: 'angular-workshop' }
    );
    expect(authService.saveSession).toHaveBeenCalledWith(response);
    expect(authService.savePreferences).toHaveBeenCalledWith(component.preferences);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.busy).toBe(false);
  });

  it('reports a response without a token', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({ token: '', user: { username: '', displayName: '', role: '' } });
    const component = new LoginComponent(authService, router);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.messageTitle).toBe('El backend respondió sin token.');
    expect(component.messageDetail).toBe('');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.busy).toBe(false);
  });

  it('shows the backend error and always clears the busy state', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({ response: { data: { message: 'Acceso denegado' } } });
    const component = new LoginComponent(authService, router);
    component.username = 'student';
    component.password = 'wrong';

    await component.login();

    expect(component.messageTitle).toBe('No se pudo autenticar a student.');
    expect(component.messageDetail).toBe('Acceso denegado');
    expect(component.busy).toBe(false);
  });

  it('shows a network error when the authentication service is unavailable', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('Network Error'));
    const component = new LoginComponent(authService, router);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.messageTitle).toBe('No se pudo autenticar a student.');
    expect(component.messageDetail).toBe('Network Error');
    expect(component.busy).toBe(false);
    expect(authService.saveSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows the timeout message and clears the busy state', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));
    const component = new LoginComponent(authService, router);
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.messageTitle).toBe('No se pudo autenticar a student.');
    expect(component.messageDetail).toBe('timeout of 5000ms exceeded');
    expect(component.busy).toBe(false);
    expect(authService.saveSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('renders dynamic messages as text instead of binding them as HTML', () => {
    const template = readFileSync(new URL('./login.component.html', import.meta.url), 'utf8');
    expect(template).not.toContain('[innerHTML]');
    expect(template).toContain('{{ messageTitle }}');
    expect(template).toContain('{{ messageDetail }}');
  });

  it('keeps session storage access inside AuthService', () => {
    const source = readFileSync(new URL('./login.component.ts', import.meta.url), 'utf8');
    expect(source).not.toContain('localStorage');
  });
});