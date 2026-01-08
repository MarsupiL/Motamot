import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CategoryService,
  ProductService,
} from '@shoppie/frontend/data-access-product';
import { StockService } from '@shoppie/stock-manager/data-access-stock';
import {
  Category,
  CreateCategoryDto,
  CreateProductDto,
  Product,
  UpdateCategoryDto,
  UpdateProductDto,
} from '@shoppie/frontend/type-product';

@Injectable({
  providedIn: 'root',
})
export class FacadeService {
  private readonly productService = inject(ProductService);
  private readonly stockService = inject(StockService);
  private readonly categoryService = inject(CategoryService);

  public createProduct(dto: CreateProductDto): Observable<Product> {
    return this.productService.createProduct(dto);
  }

  public getProducts(): Observable<Product[]> {
    return this.productService.getProducts();
  }

  public getProductByd(id: number): Observable<Product> {
    return this.productService.getProductById(id);
  }

  public updateProduct(id: number, dto: UpdateProductDto): Observable<Product> {
    return this.productService.updateProduct(id, dto);
  }

  public removeProduct(id: number): Observable<void> {
    return this.productService.removeProduct(id);
  }

  public createCategory(dto: CreateCategoryDto): Observable<Category> {
    return this.categoryService.createCategory(dto);
  }

  public getCategories(): Observable<Category[]> {
    return this.categoryService.getCategories();
  }

  public getCategoryByd(id: number): Observable<Category> {
    return this.categoryService.getCategoryById(id);
  }

  public updateCategory(
    id: number,
    dto: UpdateCategoryDto
  ): Observable<Category> {
    return this.categoryService.updateCategory(id, dto);
  }

  public removeCategory(id: number): Observable<void> {
    return this.categoryService.removeCategory(id);
  }

  public updateStock(id: number, quantity: number): Observable<any> {
    return this.stockService.updateStock(id, quantity);
  }
}
