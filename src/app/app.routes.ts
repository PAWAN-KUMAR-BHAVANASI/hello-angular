import { Routes } from '@angular/router';

import { CartPage } from './pages/cart/cart';
import { LoginPage } from './pages/login/login';
import { ProductFormPage } from './pages/product-form/product-form';
import { ProductListPage } from './pages/product-list/product-list';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: ProductListPage },
  { path: 'products/new', component: ProductFormPage, canActivate: [adminGuard] },
  { path: 'products/edit/:id', component: ProductFormPage, canActivate: [adminGuard] },
  { path: 'login', component: LoginPage },
  { path: 'cart', component: CartPage },
  { path: '**', redirectTo: '' },
];
