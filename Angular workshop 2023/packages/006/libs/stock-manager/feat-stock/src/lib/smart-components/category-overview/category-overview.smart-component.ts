import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';
import { CategoryListUiComponent } from '../../ui-components/category-list/category-list.ui-component';
import { FacadeService } from '../../facade.service';
import { combineLatest, map, Observable, startWith, switchMap } from 'rxjs';
import { EnhancedCategory } from '../../types/enhanced-category.type';
import { CategorySmartHelperService } from "../../smart-helpers/category-smart-helper.service";

@Component({
  selector: 'sh-category-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonUiComponent,
    CategoryListUiComponent,
    RouterModule
  ],
  providers: [CategorySmartHelperService],
  templateUrl: './category-overview.smart-component.html',
  styleUrls: ['./category-overview.smart-component.scss'],
})
export class CategoryOverviewSmartComponent {
  private readonly smartHelper = inject(CategorySmartHelperService);
  private readonly facade = inject(FacadeService);
  private readonly categories$ = this.smartHelper.fetchCategories$.pipe(
    startWith(null), // initial call
    switchMap(() => this.facade.getCategories())
  );
  private readonly products$ = this.facade.getProducts();

  public readonly categoriesWithProductCount$: Observable<EnhancedCategory[]> =
    combineLatest([this.categories$, this.products$]).pipe(
      map(([categories, products]) => {
        return categories.map((cat) => ({
          ...cat,
          numberOfItems: products.filter((p) => p.categoryId === cat.id).length,
        }));
      })
    );
}
