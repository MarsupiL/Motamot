import { Route } from '@angular/router';
import { StockManagerFeatShellComponent } from './stock-manager-feat-shell/stock-manager-feat-shell.component';

export const stockManagerFeatShellRoutes: Route[] = [
  {
    path: '',
    component: StockManagerFeatShellComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('@shoppie/stock-manager/feat-stock').then(mod => mod.stockManagerFeatStockRoutes)
      },
      {
        path: 'unauthorized',
        loadChildren: () => import('@shoppie/stock-manager/feat-auth').then(mod => mod.stockManagerFeatAuthRoutes)
      }
    ]
  }
];
