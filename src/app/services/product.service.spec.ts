import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService],
    });

    service = TestBed.inject(ProductService);
  });

  it('should have products by default', () => {
    expect(service.products.length).toBeGreaterThan(0);
  });

  it('should delete a product by id', () => {
    const initialLength = service.products.length;
    const firstId = service.products[0].id;

    service.deleteProduct(firstId);

    expect(service.products.some((product) => product.id === firstId)).toBeFalse();
    expect(service.products.length).toBe(initialLength - 1);
  });
});
