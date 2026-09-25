import { Routes } from '@angular/router';

import { CartPage } from './pages/cart/cart';
import { LoginPage } from './pages/login/login';
import { ProductFormPage } from './pages/product-form/product-form';
import { ProductListPage } from './pages/product-list/product-list';

export const routes: Routes = [
  { path: '', component: ProductListPage },
  { path: 'products/new', component: ProductFormPage },
  { path: 'products/edit/:id', component: ProductFormPage },
  { path: 'login', component: LoginPage },
  { path: 'cart', component: CartPage },
  { path: '**', redirectTo: '' },
];
