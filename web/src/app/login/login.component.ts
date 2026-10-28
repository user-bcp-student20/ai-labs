import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserPreferences } from '../models/auth.models';
import { getHttpErrorMessage } from '../utils/http-error-message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  busy = false;
  messageTitle = '';
  messageDetail = '';
  preferences: UserPreferences;

  constructor(private authService: AuthService, private router: Router) {
    this.preferences = this.authService.getPreferences();
  }

  async login(): Promise<void> {
    this.messageTitle = '';
    this.messageDetail = '';
    if (!this.username.trim()) {
      this.messageTitle = 'Ingrese un usuario.';
      return;
    }
    if (!this.password.trim()) {
      this.messageTitle = 'Ingrese una contraseña.';
      return;
    }

    this.busy = true;
    try {
      const response = await this.authService.login({
        username: this.username,
        password: this.password,
        client: 'angular-workshop'
      });
      if (!response?.token) {
        this.messageTitle = 'El backend respondió sin token.';
        return;
      }

      this.authService.saveSession(response);
      this.authService.savePreferences(this.preferences);
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.messageTitle = 'No se pudo autenticar a ' + this.username + '.';
      this.messageDetail = getHttpErrorMessage(error, 'message', 'Error desconocido');
    } finally {
      this.busy = false;
    }
  }
}
