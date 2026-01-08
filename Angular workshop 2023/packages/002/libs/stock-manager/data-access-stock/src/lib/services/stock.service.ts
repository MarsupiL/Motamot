import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '@shoppie/frontend/type-product';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/products';

  public updateStock(id: number, quantity: number): Observable<Product> {
    return this.httpClient.patch<Product>(`${this.apiUrl}/${id}`, { quantity });
  }
}
