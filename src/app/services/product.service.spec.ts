import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load products from the backend', async () => {
    const request = httpMock.expectOne('http://localhost:3002/products');
    request.flush([
      { id: 1, name: 'Laptop', category: 'electronics', price: 55000, createdAt: '2024-01-10T00:00:00.000Z' },
      { id: 2, name: 'Headphones', category: 'accessories', price: 7000, createdAt: '2024-02-12T00:00:00.000Z' },
    ]);

    await Promise.resolve();

    expect(service.products.length).toBe(2);
    expect(service.getAllProducts()[0].name).toBe('Laptop');
  });

  it('should show the shared catalog to customers and admins', async () => {
    const request = httpMock.expectOne('http://localhost:3002/products');
    request.flush([
      { id: 'a', name: 'Account A item', category: 'books', price: 20, createdAt: '2024-01-10', ownerEmail: 'a@example.com' },
      { id: 'b', name: 'Account B item', category: 'books', price: 25, createdAt: '2024-01-11', ownerEmail: 'b@example.com' },
      { id: 'legacy', name: 'Legacy item', category: 'books', price: 30, createdAt: '2024-01-12' },
    ]);
    await service.ensureProductsLoaded();

    localStorage.setItem('app-user', JSON.stringify({ email: 'a@example.com', name: 'A', role: 'Customer' }));
    expect(service.getProductsForCurrentUser().map((product) => product.name)).toEqual([
      'Account A item',
      'Account B item',
      'Legacy item',
    ]);

    localStorage.setItem('app-user', JSON.stringify({ email: 'admin@shop.com', name: 'Admin', role: 'Admin' }));
    expect(service.getProductsForCurrentUser().map((product) => product.name)).toEqual([
      'Account A item',
      'Account B item',
      'Legacy item',
    ]);
  });

  it('should save a new laptop with its company and specifications', async () => {
    const initialRequest = httpMock.expectOne('http://localhost:3002/products');
    initialRequest.flush([]);
    await service.ensureProductsLoaded();
    localStorage.setItem('app-user', JSON.stringify({ email: 'admin@shop.com', name: 'Admin', role: 'Admin' }));

    const adding = service.addProduct({
      name: 'Lenovo ThinkPad E14',
      brand: 'Lenovo',
      model: 'ThinkPad E14',
      price: 20,
      quantity: 4,
      specifications: {
        processor: 'Intel Core 5',
        ram: '16 GB',
        storage: '512 GB SSD',
        graphics: 'Integrated',
        display: '14-inch IPS',
        operatingSystem: 'Windows 11',
      },
      createdAt: '2024-01-10',
    });
    const request = httpMock.expectOne('http://localhost:3002/products');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.ownerEmail).toBe('admin@shop.com');
    expect(request.request.body.quantity).toBe(4);
    request.flush({
      id: 'owned',
      name: 'Lenovo ThinkPad E14',
      brand: 'Lenovo',
      model: 'ThinkPad E14',
      price: 20,
      createdAt: '2024-01-10T00:00:00.000Z',
      ownerEmail: 'admin@shop.com',
      quantity: 4,
      specifications: {
        processor: 'Intel Core 5',
        ram: '16 GB',
        storage: '512 GB SSD',
        graphics: 'Integrated',
        display: '14-inch IPS',
        operatingSystem: 'Windows 11',
      },
    });
    await adding;

    expect(service.getProductsForCurrentUser().map((product) => product.id)).toEqual(['owned']);
  });

  it('should delete a product by id', async () => {
    const initialRequest = httpMock.expectOne('http://localhost:3002/products');
    initialRequest.flush([]);
    await service.ensureProductsLoaded();
    localStorage.setItem('app-user', JSON.stringify({ email: 'admin@shop.com', name: 'Admin', role: 'Admin' }));
    service.products = [
      { id: 1, name: 'Laptop', category: 'electronics', price: 55000, quantity: 3, createdAt: '2024-01-10T00:00:00.000Z', ownerEmail: 'a@example.com' },
      { id: 2, name: 'Headphones', category: 'accessories', price: 7000, quantity: 2, createdAt: '2024-02-12T00:00:00.000Z', ownerEmail: 'b@example.com' },
    ];

    const deleting = service.deleteProduct(1);
    const deleteRequest = httpMock.expectOne('http://localhost:3002/products/1');
    deleteRequest.flush(null);
    await deleting;

    expect(service.products.some((product) => product.id === 1)).toBe(false);
  });

  it('should block customers from deleting another account product', async () => {
    const initialRequest = httpMock.expectOne('http://localhost:3002/products');
    initialRequest.flush([]);
    await service.ensureProductsLoaded();
    localStorage.setItem('app-user', JSON.stringify({ email: 'a@example.com', name: 'A', role: 'Customer' }));
    service.products = [
      { id: 'b', name: 'Other account item', category: 'books', price: 20, quantity: 1, createdAt: '2024-01-10', ownerEmail: 'b@example.com' },
    ];

    await expect(service.deleteProduct('b')).rejects.toThrow('Only admin accounts can manage catalog products.');
    httpMock.expectNone('http://localhost:3002/products/b');
  });
});
