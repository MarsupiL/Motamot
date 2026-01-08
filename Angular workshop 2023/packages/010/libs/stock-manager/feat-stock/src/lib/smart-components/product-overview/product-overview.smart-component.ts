import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';
import { RouterModule } from '@angular/router';
import { FacadeService } from '../../facade.service';
import { ProductUiComponent } from '../../ui-components/product/product.ui-component';

@Component({
  selector: 'sh-product-overview',
  standalone: true,
  imports: [CommonModule, ButtonUiComponent, RouterModule, ProductUiComponent],
  templateUrl: './product-overview.smart-component.html',
  styleUrls: ['./product-overview.smart-component.scss'],
})
export class ProductOverviewSmartComponent {
  private readonly facade = inject(FacadeService);
  public readonly products$ = this.facade.getProducts();
}
