import { Route } from '@angular/router';
import { CategoryDetailSmartComponent } from './smart-components/category-detail/category-detail.smart-component';
import { ProductOverviewSmartComponent } from './smart-components/product-overview/product-overview.smart-component';
import { ProductDetailSmartComponent } from './smart-components/product-detail/product-detail.smart-component';

export const shopFeatProductRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'products', component: ProductOverviewSmartComponent
  },
  {
    path: 'products/:productId', component: ProductDetailSmartComponent
  },
  {
    path: 'categories/:categoryId', component: CategoryDetailSmartComponent
  },
  {
    path: 'categories/:categoryId/:productId', component: ProductDetailSmartComponent
  }
];
