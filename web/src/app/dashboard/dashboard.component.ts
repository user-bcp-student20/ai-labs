import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticatedUser } from '../models/auth.models';
import { Task } from '../models/task.model';
import { AuthService } from '../services/auth.service';
import { TasksService } from '../services/tasks.service';
import { getHttpErrorMessage } from '../utils/http-error-message';
import { formatTaskLabel } from '../utils/legacy-format';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado',
  RESUELTO: 'Resuelto',
  COMPLETED: 'Completado'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  visibleTasks: Task[] = [];
  user: AuthenticatedUser | null = null;
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private tasksService: TasksService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  statusLabel(status?: string): string {
    return STATUS_LABELS[(status || '').toUpperCase()] || status || '';
  }

  async ngOnInit(): Promise<void> {
    const token = this.authService.getToken();
    this.user = this.authService.getUser();
    if (!token) {
      await this.router.navigate(['/login']);
      return;
    }
    try {
      const tasks = await this.tasksService.listTasks(this.user?.username || '', token);
      const visibleTasks = tasks.filter((task) => task.status !== 'ARCHIVED');
      visibleTasks.forEach((task) => {
        task.label = formatTaskLabel(task);
      });
      visibleTasks.sort((first, second) => (first.priority || '') > (second.priority || '') ? -1 : 1);
      // axios resuelve a veces fuera de la zona de Angular (más aún llegando
      // por navegación desde el login): forzamos volver a entrar a la zona
      // y disparamos detectChanges a mano para no depender de que Angular
      // lo detecte solo.
      this.zone.run(() => {
        this.tasks = tasks;
        this.visibleTasks = visibleTasks;
        this.loading = false;
        this.cdr.detectChanges();
      });
    } catch (error: unknown) {
      this.zone.run(() => {
        this.error = getHttpErrorMessage(error, 'detail', 'No se pudo cargar el dashboard');
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async logout(): Promise<void> {
    this.authService.clearSession();
    await this.router.navigate(['/login']);
  }
}
