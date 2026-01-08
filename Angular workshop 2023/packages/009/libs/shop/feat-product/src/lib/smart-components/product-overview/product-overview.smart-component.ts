import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarUiComponent } from '../../ui-components/sidebar/sidebar.ui-component';
import { FacadeService } from '../../facade.service';
import { ProductUiComponent } from '../../ui-components/product/product.ui-component';
import { BreadcrumbItem, BreadcrumbUiComponent, PagerUiComponent, } from '@shoppie/frontend/ui-design-system';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Category, Product } from '@shoppie/frontend/type-product';

type ViewModel = {
  categories: Category[];
  query: string;
  products: Product[];
  itemsPerPage: number;
  total: number;
  pageIndex: number;
}

@Component({
  selector: 'sh-product-overview',
  standalone: true,
  imports: [
    CommonModule,
    SidebarUiComponent,
    ProductUiComponent,
    BreadcrumbUiComponent,
    PagerUiComponent
  ],
  templateUrl: './product-overview.smart-component.html',
  styleUrls: ['./product-overview.smart-component.scss'],
})
export class ProductOverviewSmartComponent {
  private readonly pageIndex$$ = new BehaviorSubject<number>(0);
  private readonly query$$ = new BehaviorSubject<string>('');
  private readonly itemsPerPage$$ = new BehaviorSubject<number>(5);
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
  public readonly vm$: Observable<ViewModel> = combineLatest({
    categories: this.facadeService.getCategories(),
    productsResult: this.facadeService.getProducts(),
    pageIndex: this.pageIndex$$,
    itemsPerPage: this.itemsPerPage$$,
    query: this.query$$,
  }).pipe(
    map(({ categories, productsResult, pageIndex, itemsPerPage, query }) => {
      const filteredProducts =  productsResult.filter(p => p.name.toLowerCase().indexOf(query.toLowerCase()) > -1);
      const offsetStart = (pageIndex) * itemsPerPage;
      const offsetEnd = (pageIndex + 1) * itemsPerPage;
      const products =  filteredProducts.slice(offsetStart, offsetEnd);
      return {
        total: filteredProducts.length,
        query: query,
        categories,
        itemsPerPage,
        pageIndex,
        products
      }
    })
  )

  public setQuery(e: Event): void {
    // WARNING: multiple emissions at the same time
    this.pageIndex$$.next(0);
    this.query$$.next((e.target as HTMLInputElement).value);
  }

  public pageIndexChange(pageIndex: number): void {
    this.pageIndex$$.next(pageIndex)
  }

  public itemsPerPageChange(itemsPerPage: number): void {
    // WARNING: multiple emissions at the same time
    this.itemsPerPage$$.next(itemsPerPage);
    this.pageIndex$$.next(0);
  }
}
