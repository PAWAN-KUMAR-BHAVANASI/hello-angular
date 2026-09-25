import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  loginMessage = '';
  loginForm!: ReturnType<LoginPage['createLoginForm']>;

  constructor(private readonly formBuilder: FormBuilder) {
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
    this.loginMessage = `Welcome back, ${email}!`;
  }
}
