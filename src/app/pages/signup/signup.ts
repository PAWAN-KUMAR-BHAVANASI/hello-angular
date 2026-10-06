import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = (control.value ?? '') as string;
    const validLength = value.length >= 8 && value.length <= 15;
    const hasUppercase = /[A-Z]/.test(value);
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(value);

    return validLength && hasUppercase && hasSpecialCharacter ? null : { passwordStrength: true };
  };
}

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupPage {
  signupMessage = '';
  signupError = false;
  signupForm!: ReturnType<SignupPage['createSignupForm']>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.signupForm = this.createSignupForm();
  }

  private createSignupForm() {
    return this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrengthValidator()]],
    });
  }

  async submitSignup(): Promise<void> {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.signupForm.getRawValue();

    try {
      const user = await this.authService.register(name, email, password);
      this.signupMessage = `Account created. Welcome ${user.name}!`;
      this.signupError = false;
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.signupMessage = error instanceof Error ? error.message : 'Account creation failed.';
      this.signupError = true;
    }
  }
}