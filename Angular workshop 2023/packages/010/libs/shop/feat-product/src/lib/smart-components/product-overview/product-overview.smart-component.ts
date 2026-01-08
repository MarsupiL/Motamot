import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarUiComponent } from '../../ui-components/sidebar/sidebar.ui-component';
import { FacadeService } from '../../facade.service';
import { ProductUiComponent } from '../../ui-components/product/product.ui-component';
import { BreadcrumbItem, BreadcrumbUiComponent, PagerUiComponent, } from '@shoppie/frontend/ui-design-system';
import { interval, map, Observable, tap } from 'rxjs';
import { Category, Product } from '@shoppie/frontend/type-product';
import { ObservableState } from '@shoppie/frontend/util-state';

type ViewModel = {
  categories: Category[];
  query: string;
  products: Product[];
  itemsPerPage: number;
  total: number;
  pageIndex: number;
  time: number
}
type ProductOverviewState = {
  pageIndex: number;
  query: string;
  itemsPerPage: number;
  categories: Category[];
  products: Product[];
  filteredProducts: Product[];
  pagedProducts: Product[];
  time: number;
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
export class ProductOverviewSmartComponent extends ObservableState<ProductOverviewState> {
  private readonly facadeService = inject(FacadeService);
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

  constructor() {
    super();
    this.initialize({
      pageIndex: 0,
      itemsPerPage: 5,
      query: '',
      categories: [],
      products: [],
      filteredProducts: [],
      pagedProducts: [],
      time: new Date().getTime()
    });
    const filteredProducts$ = this.onlySelectWhen(['products', 'query']).pipe(
      map(({ products, query }) => products.filter(p => p.name.toLowerCase().indexOf(query.toLowerCase()) > -1))
    );

    const pagedProducts$ = this.onlySelectWhen(['filteredProducts', 'pageIndex', 'itemsPerPage']).pipe(
      map(({ filteredProducts, pageIndex, itemsPerPage }) => {
        const offsetStart = (pageIndex) * itemsPerPage;
        const offsetEnd = (pageIndex + 1) * itemsPerPage;
        return filteredProducts.slice(offsetStart, offsetEnd);
      })
    )
    this.connect({
      products: this.facadeService.getProducts(),
      categories: this.facadeService.getCategories(),
      filteredProducts: filteredProducts$,
      pagedProducts: pagedProducts$,
      time: interval(1000).pipe(map(() => new Date().getTime()))
    })
  }

  public readonly vm$: Observable<ViewModel> = this.onlySelectWhen([
    'categories',
    'pagedProducts',
    'filteredProducts',
    'pageIndex',
    'itemsPerPage',
    'query',
    'time'
  ]).pipe(
    map(({ categories, filteredProducts, pagedProducts, pageIndex, itemsPerPage, query, time }) => {
      return {
        total: filteredProducts.length,
        query: query,
        categories,
        itemsPerPage,
        pageIndex,
        products: pagedProducts,
        time
      }
    })
  )

  public setQuery(e: Event): void {
    this.patch({ pageIndex: 0, query: (e.target as HTMLInputElement).value })
  }

  public pageIndexChange(pageIndex: number): void {
    this.patch({ pageIndex });
  }

  public itemsPerPageChange(itemsPerPage: number): void {
    this.patch({ pageIndex: 0, itemsPerPage })
  }
}
