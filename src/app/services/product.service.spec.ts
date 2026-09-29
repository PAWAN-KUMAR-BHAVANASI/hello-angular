import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
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
    const request = httpMock.expectOne('http://localhost:3001/products');
    request.flush([
      { id: 1, name: 'Laptop', category: 'electronics', price: 55000, createdAt: '2024-01-10T00:00:00.000Z' },
      { id: 2, name: 'Headphones', category: 'accessories', price: 7000, createdAt: '2024-02-12T00:00:00.000Z' },
    ]);

    await Promise.resolve();

    expect(service.products.length).toBe(2);
    expect(service.getAllProducts()[0].name).toBe('Laptop');
  });

  it('should delete a product by id', async () => {
    service.products = [
      { id: 1, name: 'Laptop', category: 'electronics', price: 55000, createdAt: '2024-01-10T00:00:00.000Z' },
      { id: 2, name: 'Headphones', category: 'accessories', price: 7000, createdAt: '2024-02-12T00:00:00.000Z' },
    ];

    const deleteRequest = httpMock.expectOne('http://localhost:3001/products/1');
    deleteRequest.flush(null);

    await service.deleteProduct(1);

    expect(service.products.some((product) => product.id === 1)).toBeFalse();
  });
});
