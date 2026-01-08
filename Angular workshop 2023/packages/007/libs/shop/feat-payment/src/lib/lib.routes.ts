import { Route } from '@angular/router';
import { OrderSmartComponent } from './smart-components/order/order.smart-component';
import { ShoppingCartSmartComponent } from './smart-components/shopping-cart/shopping-cart.smart-component';

export const shopFeatPaymentRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'shopping-cart',
    pathMatch: 'full',
  },
  {
    path: 'shopping-cart',
    component: ShoppingCartSmartComponent,
  },
  {
    path: 'shopping-cart/order',
    component: OrderSmartComponent,
    children: [
      {
        path: 'unauthorized',
        loadChildren: () =>
          import('@shoppie/shop/feat-auth').then(
            (mod) => mod.shopFeatAuthRoutes
          ),
      },
    ],
  },
];
