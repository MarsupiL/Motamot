import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BreadcrumbItem,
  BreadcrumbUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { FacadeService } from '../../facade.service';
import { SidebarUiComponent } from '../../ui-components/sidebar/sidebar.ui-component';
import { ProductUiComponent } from '../../ui-components/product/product.ui-component';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'sh-category-detail',
  standalone: true,
  imports: [
    CommonModule,
    SidebarUiComponent,
    ProductUiComponent,
    BreadcrumbUiComponent,
  ],
  templateUrl: './category-detail.smart-component.html',
  styleUrls: ['./category-detail.smart-component.scss'],
})
export class CategoryDetailSmartComponent {
  public readonly breadcrumbItems$: Observable<BreadcrumbItem[]> =
    this.category$.pipe(
      map((category) => {
        return [
          {
            label: 'Home',
            route: [''],
          },
          {
            label: 'Products',
            route: ['/products'],
          },
          {
            label: category.name,
            route: ['/categories', category.id.toString()],
          },
        ];
      })
    );
  private readonly facadeService = inject(FacadeService);
  public readonly categories$ = this.facadeService.getCategories();
  private readonly activatedRoute = inject(ActivatedRoute);
  public readonly category$ = this.activatedRoute.params.pipe(
    switchMap((params) =>
      this.facadeService.getCategoryByd(Number(params['categoryId']))
    )
  );
  private readonly products$ = this.facadeService.getProducts();
  public readonly productsByCategory$ = combineLatest([
    this.products$,
    this.category$,
  ]).pipe(
    map(([products, category]) =>
      products.filter((product) => product.categoryId === category.id)
    )
  );
}
