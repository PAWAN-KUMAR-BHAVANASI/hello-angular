import { Routes } from '@angular/router';

import { customerGuard } from './guards/customer.guard';
import { adminProductGuard } from './guards/admin-product.guard';
import { CartPage } from './pages/cart/cart';
import { LoginPage } from './pages/login/login';
import { OrdersPage } from './pages/orders/orders';
import { WishlistPage } from './pages/wishlist/wishlist';
import { ProductFormPage } from './pages/product-form/product-form';
import { ProductDetailsPage } from './pages/product-details/product-details';
import { ProductListPage } from './pages/product-list/product-list';
import { ProductComparisonPage } from './pages/product-comparision/product-comparision';
import { SignupPage } from './pages/signup/signup';

export const routes: Routes = [
  { path: '', component: ProductListPage },
  { path: 'products/new', component: ProductFormPage, canActivate: [adminProductGuard] },
  { path: 'products/edit/:id', component: ProductFormPage, canActivate: [adminProductGuard] },
  { path: 'products/:id', component: ProductDetailsPage },
  { path: 'product-comparison', component: ProductComparisonPage },
  { path: 'login', component: LoginPage },
  { path: 'signup', component: SignupPage },
  { path: 'cart', component: CartPage, canActivate: [customerGuard] },
  { path: 'orders', component: OrdersPage, canActivate: [customerGuard] },
  { path: 'wishlist', component: WishlistPage, canActivate: [customerGuard] },
  { path: '**', redirectTo: '' },
];