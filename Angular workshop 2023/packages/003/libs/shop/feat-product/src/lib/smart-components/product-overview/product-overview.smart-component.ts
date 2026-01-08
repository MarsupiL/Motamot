import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarUiComponent } from '../../ui-components/sidebar/sidebar.ui-component';
import { FacadeService } from '../../facade.service';
import { ProductUiComponent } from '../../ui-components/product/product.ui-component';
import {
  BreadcrumbItem,
  BreadcrumbUiComponent,
} from '@shoppie/frontend/ui-design-system';

@Component({
  selector: 'sh-product-overview',
  standalone: true,
  imports: [
    CommonModule,
    SidebarUiComponent,
    ProductUiComponent,
    BreadcrumbUiComponent,
  ],
  templateUrl: './product-overview.smart-component.html',
  styleUrls: ['./product-overview.smart-component.scss'],
})
export class ProductOverviewSmartComponent {
  public readonly breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Home',
      route: [''],
    },
    {
      label: 'Products',
      route: ['/products'],
    },
  ];
  private readonly facadeService = inject(FacadeService);
  public readonly products$ = this.facadeService.getProducts();
  public readonly categories$ = this.facadeService.getCategories();
}
