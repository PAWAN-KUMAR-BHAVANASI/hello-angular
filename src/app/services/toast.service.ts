import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  readonly toastState$ = this.toastSubject.asObservable();

  showSuccess(message: string): void {
    this.toastSubject.next({ message, type: 'success' });
    setTimeout(() => this.toastSubject.next(null), 2600);
  }

  showInfo(message: string): void {
    this.toastSubject.next({ message, type: 'info' });
    setTimeout(() => this.toastSubject.next(null), 2600);
  }
}
