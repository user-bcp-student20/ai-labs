import { readFileSync } from 'node:fs';
import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import type { AuthService } from '../services/auth.service';
import type { TasksService } from '../services/tasks.service';
import { DashboardComponent } from './dashboard.component';

function createComponent(authService: AuthService, tasksService: TasksService) {
  const router = { navigate: vi.fn().mockResolvedValue(true) } as unknown as Router;
  const changeDetector = { detectChanges: vi.fn() } as unknown as ChangeDetectorRef;
  const zone = { run: (callback: () => void) => callback() } as unknown as NgZone;
  return {
    component: new DashboardComponent(authService, tasksService, router, changeDetector, zone),
    router,
    changeDetector
  };
}

describe('DashboardComponent characterization', () => {
  let authService: AuthService;
  let tasksService: TasksService;

  beforeEach(() => {
    authService = {
      getToken: vi.fn().mockReturnValue('test-token'),
      getUser: vi.fn().mockReturnValue({ username: 'student', displayName: 'Student', role: 'STUDENT' }),
      clearSession: vi.fn()
    } as unknown as AuthService;
    tasksService = { listTasks: vi.fn() } as unknown as TasksService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to login and skips the request when there is no token', async () => {
    vi.mocked(authService.getToken).mockReturnValue(null);
    const { component, router } = createComponent(authService, tasksService);

    await component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(tasksService.listTasks).not.toHaveBeenCalled();
  });

  it('loads tasks with the owner query and bearer token, then filters and sorts them', async () => {
    const tasks = [
      { id: 1, title: 'High', description: 'High priority', status: 'TODO', priority: 'HIGH', owner: 'student' },
      { id: 2, title: 'Low', description: 'Low priority', status: 'DONE', priority: 'LOW', owner: 'student' },
      { id: 3, title: 'Archived', description: 'Hidden', status: 'ARCHIVED', priority: 'MEDIUM', owner: 'student' }
    ];
    vi.mocked(tasksService.listTasks).mockResolvedValueOnce(tasks);
    const { component, changeDetector } = createComponent(authService, tasksService);

    await component.ngOnInit();

    expect(tasksService.listTasks).toHaveBeenCalledWith('student', 'test-token');
    expect(component.visibleTasks.map((task) => task.title)).toEqual(['Low', 'High']);
    expect(component.visibleTasks.map((task) => task.label)).toEqual(['LOW · STUDENT', 'HIGH · STUDENT']);
    expect(component.tasks).toHaveLength(3);
    expect(component.loading).toBe(false);
    expect(changeDetector.detectChanges).toHaveBeenCalled();
  });

  it('shows the backend detail when loading tasks fails', async () => {
    vi.mocked(tasksService.listTasks).mockRejectedValueOnce({ response: { data: { detail: 'No autorizado' } } });
    const { component, changeDetector } = createComponent(authService, tasksService);

    await component.ngOnInit();

    expect(component.error).toBe('No autorizado');
    expect(component.loading).toBe(false);
    expect(changeDetector.detectChanges).toHaveBeenCalled();
  });

  it('shows the invalid-token error without retrying or clearing the session', async () => {
    vi.mocked(tasksService.listTasks).mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Token invalido' } }
    });
    const { component, router } = createComponent(authService, tasksService);

    await component.ngOnInit();

    expect(component.error).toBe('Token invalido');
    expect(component.loading).toBe(false);
    expect(authService.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows a request timeout and stops loading tasks', async () => {
    vi.mocked(tasksService.listTasks).mockRejectedValueOnce(new Error('timeout waiting for tasks'));
    const { component, changeDetector } = createComponent(authService, tasksService);

    await component.ngOnInit();

    expect(component.error).toBe('timeout waiting for tasks');
    expect(component.loading).toBe(false);
    expect(changeDetector.detectChanges).toHaveBeenCalled();
  });

  it('shows the thrown error when a successful response is not an array', async () => {
    vi.mocked(tasksService.listTasks).mockResolvedValueOnce({ tasks: [] } as never);
    const { component } = createComponent(authService, tasksService);

    await component.ngOnInit();

    expect(component.error.toLowerCase()).toContain('filter');
    expect(component.loading).toBe(false);
  });

  it('requests tasks with an empty owner when no user is stored', async () => {
    vi.mocked(authService.getUser).mockReturnValue(null);
    vi.mocked(tasksService.listTasks).mockResolvedValueOnce([]);
    const { component } = createComponent(authService, tasksService);

    await component.ngOnInit();

    expect(tasksService.listTasks).toHaveBeenCalledWith('', 'test-token');
    expect(component.user).toBeNull();
  });

  it('clears token and user and navigates to login on logout', async () => {
    const { component, router } = createComponent(authService, tasksService);

    await component.logout();

    expect(authService.clearSession).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('keeps session storage access inside AuthService', () => {
    const source = readFileSync(new URL('./dashboard.component.ts', import.meta.url), 'utf8');
    expect(source).not.toContain('localStorage');
  });
});