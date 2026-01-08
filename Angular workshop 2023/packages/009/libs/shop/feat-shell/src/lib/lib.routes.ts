import { Route } from '@angular/router';
import { ShellSmartComponent } from './smart-components/shell/shell.smart-component';

export const shopFeatShellRoutes: Route[] = [
  {
    path: '',
    component: ShellSmartComponent,
    children: [
      {
        path: 'payment',
        loadChildren: () =>
          import('@shoppie/shop/feat-payment').then(
            (mod) => mod.shopFeatPaymentRoutes
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('@shoppie/shop/feat-product').then(
            (mod) => mod.shopFeatProductRoutes
          ),
      },
    ],
  },
];
