import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Product } from './product.service';
import { ProductComparisonService } from './product-comparision.service';

describe('ProductComparisonService', () => {
  let service: ProductComparisonService;

  const product = (id: string, ownerEmail: string): Product => ({
    id,
    name: `Product ${id}`,
    category: 'electronics',
    price: 100,
    quantity: 1,
    createdAt: '2026-10-01T00:00:00.000Z',
    ownerEmail,
  });

  const setUser = (email: string, role = 'Customer'): void => {
    localStorage.setItem('app-user', JSON.stringify({ email, name: email, role }));
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductComparisonService],
    });
    service = TestBed.inject(ProductComparisonService);
  });

  it('keeps each account comparison selection and two-product limit separate', () => {
    setUser('one@example.com');
    expect(service.addProduct(product('one-a', 'one@example.com'))).toBe(true);
    expect(service.addProduct(product('one-b', 'one@example.com'))).toBe(true);
    expect(service.addProduct(product('one-c', 'one@example.com'))).toBe(false);

    setUser('two@example.com');
    expect(service.getProducts()).toEqual([]);
    expect(service.addProduct(product('two-a', 'two@example.com'))).toBe(true);
    expect(service.getSelectedCount()).toBe(1);

    setUser('one@example.com');
    expect(service.getProducts().map((item) => item.id)).toEqual(['one-a', 'one-b']);
  });

  it('allows admin to compare products from different customer accounts with an independent limit', () => {
    setUser('admin@shop.com', 'Admin');
    expect(service.addProduct(product('one-a', 'one@example.com'))).toBe(true);
    expect(service.addProduct(product('two-a', 'two@example.com'))).toBe(true);
    expect(service.addProduct(product('two-b', 'two@example.com'))).toBe(false);

    setUser('one@example.com');
    expect(service.getProducts()).toEqual([]);
    expect(service.addProduct(product('one-a', 'one@example.com'))).toBe(true);
  });
});
