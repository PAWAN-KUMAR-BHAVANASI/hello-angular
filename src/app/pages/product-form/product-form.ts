import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProductInput, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductFormPage implements OnInit {
  isEditMode = false;
  productId: number | null = null;
  productForm!: ReturnType<ProductFormPage['createProductForm']>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
  ) {
    this.productForm = this.createProductForm();
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

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const productInput: ProductInput = {
      name: this.productForm.value.name ?? '',
      category: this.productForm.value.category ?? '',
      price: Number(this.productForm.value.price ?? 0),
      createdAt: new Date(this.productForm.value.createdAt ?? new Date()),
    };

    if (this.isEditMode && this.productId !== null) {
      this.productService.updateProduct(this.productId, productInput);
    } else {
      this.productService.addProduct(productInput);
    }

    this.router.navigateByUrl('/');
  }

  private createProductForm() {
    return this.formBuilder.nonNullable.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      createdAt: [this.toDateInputValue(new Date()), Validators.required],
    });
  }

  private static toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateInputValue(date: Date): string {
    return ProductFormPage.toDateInputValue(date);
  }
}
