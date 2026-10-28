import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { TasksService } from './tasks.service';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('TasksService characterization', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests tasks with the existing owner query and bearer header', async () => {
    const tasks = [{ id: 1, title: 'Requirement', status: 'TODO', priority: 'HIGH', owner: 'student' }];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: tasks } as never);
    const service = new TasksService();

    const result = await service.listTasks('student', 'test-token');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/tasks?owner=student',
      { headers: { Authorization: 'Bearer test-token' } }
    );
    expect(result).toEqual(tasks);
  });
});