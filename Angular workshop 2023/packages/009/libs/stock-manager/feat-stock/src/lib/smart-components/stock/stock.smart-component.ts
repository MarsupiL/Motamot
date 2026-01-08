import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacadeService } from '../../facade.service';
import { EditableStockListUiComponent } from '../../ui-components/editable-stock-list/editable-stock-list.ui-component';
import { Product } from '@shoppie/frontend/type-product';

@Component({
  selector: 'sh-stock',
  standalone: true,
  imports: [CommonModule, EditableStockListUiComponent],
  templateUrl: './stock.smart-component.html',
  styleUrls: ['./stock.smart-component.scss'],
})
export class StockSmartComponent {
  private readonly facade = inject(FacadeService);
  public readonly products$ = this.facade.getProducts();

  public onStockChange(product: Product): void {
    this.facade.updateStock(product.id, product.quantity as number).subscribe();
  }
}
