import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly toastState$;

  constructor(private readonly toastService: ToastService) {
    this.toastState$ = this.toastService.toastState$;
  }
}