import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  loginMessage = '';
  loginForm!: ReturnType<LoginPage['createLoginForm']>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.loginForm = this.createLoginForm();
  }

  private createLoginForm() {
    return this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.value.email ?? '';
    const password = this.loginForm.value.password ?? '';

    try {
      const user = this.authService.login(email, password);
      this.loginMessage = `Welcome ${user.name}! You are logged in as ${user.role}.`;
      this.router.navigateByUrl('/');
    } catch (error) {
      this.loginMessage = error instanceof Error ? error.message : 'Login failed.';
    }
  }
}
