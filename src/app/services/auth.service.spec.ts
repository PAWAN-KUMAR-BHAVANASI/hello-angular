import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  it('should login an admin user', () => {
    const user = service.login('admin@shop.com', 'admin123');

    expect(user.role).toBe('Admin');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should reject invalid credentials', () => {
    expect(() => service.login('wrong@test.com', 'badpass')).toThrow();
  });
});
