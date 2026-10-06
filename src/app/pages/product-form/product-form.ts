import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductInput, ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductFormPage implements OnInit {
  isEditMode = false;
  productId: number | string | null = null;
  productForm!: ReturnType<ProductFormPage['createProductForm']>;
  readonly laptopBrands = ['Acer', 'Apple', 'ASUS', 'Dell', 'HP', 'Lenovo', 'MSI'];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly toastService: ToastService,
  ) {
    this.productForm = this.createProductForm();
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      await this.productService.ensureProductsLoaded();
      this.productId = id;
      this.isEditMode = true;
      let product = this.productService.getProductById(this.productId);

      if (!product) {
        try {
          await this.productService.reloadProducts();
          product = this.productService.getProductById(this.productId);
        } catch {
          this.toastService.showError('Could not load the selected product. Please try again.');
          await this.router.navigateByUrl('/');
          return;
        }
      }

      if (!product || !this.productService.canManageProduct(product)) {
        this.toastService.showError('You can only edit products owned by your account.');
        await this.router.navigateByUrl('/');
        return;
      }

      this.productForm.patchValue({
        name: product.name,
        brand: product.brand ?? '',
        model: product.model ?? '',
        price: String(product.price),
        quantity: String(product.quantity),
        processor: product.specifications?.processor ?? '',
        ram: product.specifications?.ram ?? '',
        storage: product.specifications?.storage ?? '',
        graphics: product.specifications?.graphics ?? '',
        display: product.specifications?.display ?? '',
        operatingSystem: product.specifications?.operatingSystem ?? '',
        createdAt: this.toDateInputValue(product.createdAt),
      });
    }
  }

  async saveProduct(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.toastService.showError('Product not added. Please fill all required fields.');
      return;
    }

    const productInput: ProductInput = {
      name: this.productForm.value.name ?? '',
      brand: this.productForm.value.brand ?? '',
      model: this.productForm.value.model ?? '',
      price: Number(this.productForm.value.price ?? 0),
      quantity: Number(this.productForm.value.quantity ?? 1),
      specifications: {
        processor: this.productForm.value.processor ?? '',
        ram: this.productForm.value.ram ?? '',
        storage: this.productForm.value.storage ?? '',
        graphics: this.productForm.value.graphics ?? '',
        display: this.productForm.value.display ?? '',
        operatingSystem: this.productForm.value.operatingSystem ?? '',
      },
      createdAt: this.productForm.value.createdAt ?? new Date(),
    };

    if (this.isEditMode && this.productId !== null) {
      await this.productService.updateProduct(this.productId, productInput);
      this.toastService.showSuccess('Product updated successfully.');
    } else {
      await this.productService.addProduct(productInput);
      this.toastService.showSuccess('Product saved successfully.');
    }

    this.router.navigateByUrl('/');
  }

  private createProductForm() {
    return this.formBuilder.nonNullable.group({
      name: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      quantity: ['1', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      processor: ['', Validators.required],
      ram: ['', Validators.required],
      storage: ['', Validators.required],
      graphics: ['', Validators.required],
      display: ['', Validators.required],
      operatingSystem: ['', Validators.required],
      createdAt: [this.toDateInputValue(new Date()), Validators.required],
    });
  }

  adjustStock(change: number): void {
    const control = this.productForm.get('quantity');
    const current = Number(control?.value || 1);
    control?.setValue(String(Math.max(1, Math.min(9999, current + change))));
  }

  private static toDateInputValue(date: Date | string): string {
    const actualDate = typeof date === 'string' ? new Date(date) : date;
    const year = actualDate.getFullYear();
    const month = String(actualDate.getMonth() + 1).padStart(2, '0');
    const day = String(actualDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateInputValue(date: Date | string): string {
    return ProductFormPage.toDateInputValue(date);
  }
}
