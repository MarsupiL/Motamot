import { Route } from '@angular/router';
import { ShopFeatShellComponent } from './shop-feat-shell/shop-feat-shell.component';

export const shopFeatShellRoutes: Route[] = [
  {
    path: '',
    component: ShopFeatShellComponent,
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
      }
    ],
  },
];
