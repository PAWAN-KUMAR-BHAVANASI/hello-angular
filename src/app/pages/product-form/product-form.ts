import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
  productId: number | null = null;
  productForm!: ReturnType<ProductFormPage['createProductForm']>;
  categoryDrawerOpen = false;

  readonly availableCategories = ['electronics', 'accessories', 'clothing', 'books'];

  private readonly categoryLimits: Record<string, number> = {
    electronics: 100000,
    accessories: 15000,
    clothing: 5000,
    books: 2000,
  };

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly toastService: ToastService,
  ) {
    this.productForm = this.createProductForm();
    this.productForm.get('category')?.valueChanges.subscribe(() => {
      this.productForm.get('price')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.productId = Number(id);
      this.isEditMode = true;
      const product = this.productService.getProductById(this.productId);

      if (product) {
        this.productForm.patchValue({
          name: product.name,
          category: product.category,
          price: product.price,
          createdAt: this.toDateInputValue(product.createdAt),
        });
      }
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
      category: this.productForm.value.category ?? '',
      price: Number(this.productForm.value.price ?? 0),
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
      category: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1), this.priceLimitValidator()]],
      createdAt: [this.toDateInputValue(new Date()), Validators.required],
    });
  }

  openCategoryDrawer(): void {
    this.categoryDrawerOpen = true;
  }

  closeCategoryDrawer(): void {
    this.categoryDrawerOpen = false;
  }

  selectCategory(category: string): void {
    this.productForm.get('category')?.setValue(category);
    this.productForm.get('price')?.updateValueAndValidity();
    this.closeCategoryDrawer();
  }

  getCategoryLimitText(): string {
    const category = (this.productForm.get('category')?.value ?? '').toString().trim().toLowerCase();
    const limit = this.categoryLimits[category];

    if (!category || limit === undefined) {
      return 'Choose a category to see the max allowed price.';
    }

    return `Max allowed for ${category}: ₹${limit.toLocaleString('en-IN')}`;
  }

  private priceLimitValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const price = Number(control.value ?? 0);
      const category = (control.parent?.get('category')?.value ?? '').toString().trim().toLowerCase();

      if (!category || price === 0) {
        return null;
      }

      const limit = this.categoryLimits[category];

      if (limit !== undefined && price > limit) {
        return { categoryLimitExceeded: true };
      }

      return null;
    };
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
