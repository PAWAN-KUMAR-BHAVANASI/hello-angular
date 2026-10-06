import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  loginMessage = '';
  loginError = false;
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
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    try {
      const user = await this.authService.login(email, password);
      this.loginMessage = `Welcome ${user.name}! You are logged in.`;
      this.loginError = false;
      this.router.navigateByUrl('/');
    } catch (error) {
      this.loginMessage = error instanceof Error ? error.message : 'Login failed.';
      this.loginError = true;
    }
  }
}
