import { Route } from '@angular/router';
import { AddProductSmartComponent } from './smart-components/add-product/add-product.smart-component';
import { AddCategorySmartComponent } from './smart-components/add-category/add-category.smart-component';
import { StockSmartComponent } from './smart-components/stock/stock.smart-component';
import { ProductOverviewSmartComponent } from './smart-components/product-overview/product-overview.smart-component';
import { EditCategorySmartComponent } from './smart-components/edit-category/edit-category.smart-component';
import { EditProductSmartComponent } from './smart-components/edit-product/edit-product.smart-component';
import { CategoryOverviewSmartComponent } from './smart-components/category-overview/category-overview.smart-component';

export const stockManagerFeatStockRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    component: ProductOverviewSmartComponent,
  },
  {
    path: 'products/add',
    component: AddProductSmartComponent,
  },
  {
    path: 'products/:productId',
    component: EditProductSmartComponent,
  },
  {
    path: 'categories',
    component: CategoryOverviewSmartComponent,
  },
  {
    path: 'categories/add',
    component: AddCategorySmartComponent,
  },
  {
    path: 'categories/:categoryId',
    component: EditCategorySmartComponent,
  },
  {
    path: 'stock',
    component: StockSmartComponent,
  },
];
