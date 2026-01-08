import { inject, Injectable } from '@angular/core';
import {
  CategoryService,
  ProductService,
} from '@shoppie/frontend/data-access-product';
import { Category, Product } from '@shoppie/frontend/type-product';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FacadeService {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  public getProducts(): Observable<Product[]> {
    return this.productService.getProducts();
  }

  public getProductByd(id: number): Observable<Product> {
    return this.productService.getProductById(id);
  }

  public getCategories(): Observable<Category[]> {
    return this.categoryService.getCategories();
  }

  public getCategoryByd(id: number): Observable<Category> {
    return this.categoryService.getCategoryById(id);
  }
}
