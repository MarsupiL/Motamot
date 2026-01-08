import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarUiComponent } from '../../ui-components/sidebar/sidebar.ui-component';
import { FacadeService } from '../../facade.service';
import { ProductUiComponent } from '../../ui-components/product/product.ui-component';
import {
  BreadcrumbItem,
  BreadcrumbUiComponent, PagerUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { BehaviorSubject, map, shareReplay } from 'rxjs';
import { combineLatest } from 'rxjs';

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
  public readonly pageIndex$ = this.pageIndex$$.asObservable();
  public readonly itemsPerPage$ = this.itemsPerPage$$.asObservable();
  public readonly query$ = this.query$$.asObservable();
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
  private readonly productsResult$ = this.facadeService.getProducts().pipe(shareReplay({bufferSize: 1, refCount: true}));
  private readonly filteredProducts$ = combineLatest({query: this.query$$, productsResult: this.productsResult$})
    .pipe(
      map(({query, productsResult}) => {
        return productsResult.filter(p => p.name.toLowerCase().indexOf(query.toLowerCase()) > -1)
      })
    )
  public readonly products$ = combineLatest({
    pageIndex: this.pageIndex$,
    itemsPerPage: this.itemsPerPage$,
    filteredProducts: this.filteredProducts$
  }).pipe(
    map(({pageIndex, filteredProducts, itemsPerPage}) => {
      const offsetStart = (pageIndex) * itemsPerPage;
      const offsetEnd = (pageIndex + 1) * itemsPerPage;
      return filteredProducts.slice(offsetStart, offsetEnd)
    })
  )

  public readonly total$ =this.filteredProducts$.pipe(map(products => products.length))
  public readonly categories$ = this.facadeService.getCategories();

  public setQuery(e: Event): void {
    this.query$$.next((e.target as HTMLInputElement).value);
  }

  public pageIndexChange(pageIndex: number): void {
    this.pageIndex$$.next(pageIndex)
  }
}
