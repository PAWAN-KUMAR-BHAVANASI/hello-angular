import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => httpMock.verify());

  it('should login an admin user', async () => {
    const login = service.login('admin@shop.com', 'Admin@123');
    httpMock.expectOne('http://localhost:3002/users').flush([
      { email: 'admin@shop.com', password: 'Admin@123', name: 'Admin User', role: 'Admin' },
    ]);
    const user = await login;

    expect(user.role).toBe('Admin');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    const login = service.login('wrong@test.com', 'badpass');
    httpMock.expectOne('http://localhost:3002/users').flush([]);
    await expect(login).rejects.toThrow('Invalid email or password.');
  });
});
