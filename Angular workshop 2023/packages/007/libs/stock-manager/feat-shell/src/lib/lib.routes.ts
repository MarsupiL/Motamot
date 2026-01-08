import { Route } from '@angular/router';
import { AuthenticationGuard } from './guards/authentication.guard';
import { ShellSmartComponent } from './smart-components/shell/shell.smart-component';

export const stockManagerFeatShellRoutes: Route[] = [
  {
    path: '',
    component: ShellSmartComponent,
    children: [
      {
        path: '',
        canActivate: [AuthenticationGuard],
        loadChildren: () =>
          import('@shoppie/stock-manager/feat-stock').then(
            (mod) => mod.stockManagerFeatStockRoutes
          ),
      },
      {
        path: 'unauthorized',
        loadChildren: () =>
          import('@shoppie/stock-manager/feat-auth').then(
            (mod) => mod.stockManagerFeatAuthRoutes
          ),
      },
    ],
  },
];
