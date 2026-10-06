import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CartService } from './cart.service';
import { Product } from './product.service';

const product: Product = {
  id: 'product-1',
  name: 'Lenovo Laptop',
  brand: 'Lenovo',
  model: 'ThinkPad',
  price: 100,
  quantity: 5,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const secondProduct: Product = {
  id: 'product-2',
  name: 'Dell Laptop',
  brand: 'Dell',
  model: 'Inspiron',
  price: 200,
  quantity: 4,
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [CartService] });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('http://localhost:3002/products').flush([product, secondProduct]);
    localStorage.setItem('app-user', JSON.stringify({
      id: 'customer-1', email: 'customer@example.com', name: 'Customer', role: 'Customer', cartItems: [],
    }));
  });

  afterEach(() => httpMock.verify());

  it('loads compact cart IDs and joins current catalog details', async () => {
    const loading = service.loadCart();
    httpMock.expectOne('http://localhost:3002/users/customer-1').flush({
      id: 'customer-1', email: 'customer@example.com', cartItems: [{ productId: product.id, quantity: 2 }],
    });

    const items = await loading;
    expect(items[0].productName).toBe('Lenovo Laptop');
    expect(items[0].quantity).toBe(2);
    expect(JSON.parse(localStorage.getItem('cart-items:customer@example.com') ?? '[]')).toEqual([
      { productId: product.id, quantity: 2 },
    ]);
  });

  it('adds a product using one PATCH containing only IDs and quantities', async () => {
    const adding = service.addProduct(product, 2);
    const request = httpMock.expectOne('http://localhost:3002/users/customer-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ cartItems: [{ productId: product.id, quantity: 2 }] });
    request.flush({ id: 'customer-1', email: 'customer@example.com', cartItems: request.request.body.cartItems });

    expect((await adding)[0].productName).toBe(product.name);
    expect(httpMock.match((request) => request.url.includes('/carts'))).toHaveLength(0);
  });

  it('edits several quantities with one PATCH', async () => {
    localStorage.setItem('cart-items:customer@example.com', JSON.stringify([
      { productId: product.id, quantity: 1 },
      { productId: secondProduct.id, quantity: 1 },
    ]));
    const saving = service.updateCartQuantities([
      { productId: product.id, quantity: 4 },
      { productId: secondProduct.id, quantity: 2 },
    ]);

    const request = httpMock.expectOne('http://localhost:3002/users/customer-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body.cartItems).toEqual([
      { productId: product.id, quantity: 4 },
      { productId: secondProduct.id, quantity: 2 },
    ]);
    request.flush({ id: 'customer-1', email: 'customer@example.com', cartItems: request.request.body.cartItems });
    expect((await saving)[0].quantity).toBe(4);
  });

  it('removes an item using one PATCH rather than DELETE', async () => {
    localStorage.setItem('cart-items:customer@example.com', JSON.stringify([
      { productId: product.id, quantity: 1 },
    ]));
    const removing = service.removeItem(product.id);
    const request = httpMock.expectOne('http://localhost:3002/users/customer-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ cartItems: [] });
    request.flush({ id: 'customer-1', email: 'customer@example.com', cartItems: [] });
    expect(await removing).toEqual([]);
  });

  it('saves an order and clears compact account cart data', async () => {
    localStorage.setItem('cart-items:customer@example.com', JSON.stringify([{ productId: product.id, quantity: 2 }]));
    const placing = service.placeOrder('Customer Buyer', '10 Laptop Lane');
    httpMock.expectOne('http://localhost:3002/users/customer-1').flush({
      id: 'customer-1', email: 'customer@example.com', cartItems: [{ productId: product.id, quantity: 2 }],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    httpMock.expectOne('http://localhost:3002/products').flush([product]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const inventoryPatch = httpMock.expectOne('http://localhost:3002/products/product-1');
    expect(inventoryPatch.request.body).toEqual({ quantity: 3 });
    inventoryPatch.flush({ ...product, quantity: 3 });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const orderRequest = httpMock.expectOne('http://localhost:3002/orders');
    expect(orderRequest.request.body.ownerEmail).toBe('customer@example.com');
    expect(orderRequest.request.body.total).toBe(200);
    orderRequest.flush({ ...orderRequest.request.body, id: 'order-1' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const clearPatch = httpMock.expectOne('http://localhost:3002/users/customer-1');
    expect(clearPatch.request.method).toBe('PATCH');
    expect(clearPatch.request.body).toEqual({ cartItems: [] });
    clearPatch.flush({ id: 'customer-1', email: 'customer@example.com', cartItems: [] });
    expect((await placing).id).toBe('order-1');
  });

  it('loads only the signed-in customer orders', async () => {
    const loading = service.loadOrders();
    httpMock.expectOne('http://localhost:3002/orders?ownerEmail=customer%40example.com').flush([]);
    expect(await loading).toEqual([]);
  });
});