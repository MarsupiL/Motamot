---
title: "Route design"
layout: base.njk
---

To start with this class we need to take package `000` from the course files.

## Routing for the stock-manager
We have the following routes for the `stock-manager` app:
- `/products`
- `/products/add`
- `/products/:productId`
- `/categories`
- `/categories/add`
- `/categories/:categoryId`
- `/stock`
- `/unauthorized`

We will have to create **Smart components** for this.
We will generate all these components in a `smart-components` folder so we can separate them easily
from the rest of the components.
We could call these components containers, but some people are confused by that.
We can call them pages, but not all smart components are pages, so let's call them Smart components.
It's up to you what you use in your project, just try to separate them from regular components.

- `/products` => `ProductOverviewSmartComponent` (`product-overview`)
- `/products/add` => `AddProductSmartComponent` (`add-product`)
- `/products/:productId` => `EditProductSmartComponent` (`edit-product`)
- `/categories` => `CategoriesOverviewSmartComponent` (`category-overview`)
- `/categories/add` => `AddCategorySmartComponent` (`add-category`)
- `/categories/:categoryId` => `EditCategorySmartComponent` (`edit-category`)
- `/stock` => `StockSmartComponent` (`stock`)
- `/unauthorized` => `LoginSmartComponent` (`login`)


```shell
npx nx g @nrwl/angular:component smart-components/product-overview --project=stock-manager-feat-stock --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/add-product --project=stock-manager-feat-stock --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/edit-product --project=stock-manager-feat-stock --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/category-overview --project=stock-manager-feat-stock --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/add-category --project=stock-manager-feat-stock --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/edit-category --project=stock-manager-feat-stock --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/stock --project=stock-manager-feat-stock --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/login --project=stock-manager-feat-auth --type=smart-component 
```

Setup the config for the `feat-stock` module in `libs/stock-manager/feat-stock/src/lib/lib.routes.ts`:

```typescript
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
        pathMatch: 'full'
    },
    {
        path: 'products', component: ProductOverviewSmartComponent
    },
    {
        path: 'products/add', component: AddProductSmartComponent
    },
    {
        path: 'products/:productId', component: EditProductSmartComponent
    },
    {
        path: 'categories', component: CategoryOverviewSmartComponent
    },
    {
        path: 'categories/add', component: AddCategorySmartComponent
    },
    {
        path: 'categories/:categoryId', component: EditCategorySmartComponent
    },
    {
        path: 'stock', component: StockSmartComponent
    }
];

```

We now can remove `libs/stock-manager/feat-stock/src/lib/stock-manager-feat-stock`. Also remove
the export from `libs/stock-manager/feat-stock/src/index.ts`

Next setup the config for the `feat-auth` module in `libs/stock-manager/feat-auth/src/lib/lib.routes.ts`:

```typescript
import { Route } from '@angular/router';
import { LoginSmartComponent } from './smart-components/login/login.smart-component';

export const stockManagerFeatAuthRoutes: Route[] = [
    {path: '', component: LoginSmartComponent}
];

```
We now can also remove `libs/stock-manager/feat-auth/src/lib/stock-manager-feat-auth`. Also remove
the export from `libs/stock-manager/feat-auth/src/index.ts`

Update the routing of the shell module in `libs/stock-manager/feat-shell/src/lib/lib.routes.ts` so that
an empty path loads `feat-stock`.

In the shell we can update the path of the feat-stock from `stock` to an empty string, so we load the `feat-stock`
lib when the shell is loaded directly.

```typescript
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
```

Update `libs/stock-manager/feat-shell/src/lib/stock-manager-feat-shell/stock-manager-feat-shell.component.html` so
that we are able to navigate between all the different routes:

```html
<h1>Stock manager</h1>
<ul>
    <li><a routerLink="products">Products</a></li>
    <li><a routerLink="products/add">Add product</a></li>
    <li><a routerLink="products/fakeid">Edit product</a></li>
    <li><a routerLink="categories">Categories</a></li>
    <li><a routerLink="categories/add">Categories add</a></li>
    <li><a routerLink="categories/fakeid">Edit category</a></li>
    <li><a routerLink="stock">Stock</a></li>
    <li><a routerLink="unauthorized">Log out</a></li>
</ul>
<router-outlet></router-outlet>
```

## Routing for the shop module

We have the following routes for the `shop` app:
- `/products`
- `/products/:productId`
- `/categories`
- `/categories/:categoryId`
- `/categories/:categoryId/:productId`
- `/shopping-cart`
- `/shopping-cart/order`
- `/shopping-cart/order/unauthorized`

- `/products` =>`ProductOverviewSmartComponent` (`product-overview`)
- `/products/:productId` => `ProductDetailSmartComponent` (`product-detail`)
- `/categories/:categoryId` => `CategoryDetailSmartComponent` (`category-detail`)
- `/categories/:categoryId/:productId` => `ProductDetailSmartComponent` (`product-detail`)
- `/shopping-cart` => `ShoppingCartSmartComponent` (`shopping-cart` in `feat-payment`) 
- `/shopping-cart/order`=> `OrderSmartComponent` (`order` in `feat-payment`)
- `/shopping-cart/order/unauthorized`=> `LoginSmartcomponent` (`unauthorized` in `feat-auth`)

Let's generate our components:

```shell
npx nx g @nrwl/angular:component smart-components/product-overview --project=shop-feat-product --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/product-detail --project=shop-feat-product --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/category-detail --project=shop-feat-product --type=smart-component &&

npx nx g @nrwl/angular:component smart-components/shopping-cart --project=shop-feat-payment --type=smart-component &&
npx nx g @nrwl/angular:component smart-components/order --project=shop-feat-payment --type=smart-component &&

npx nx g @nrwl/angular:component smart-components/login --project=shop-feat-auth --type=smart-component
```
Update `libs/shop/feat-shell/src/lib/shop-feat-shell/shop-feat-shell.component.html` so
that it navigates to all the different routes:

```html
<h1>Shop</h1>
<ul>
    <li><a routerLink="/">Products</a></li>
    <li><a routerLink="/products/fakeId">Product</a></li>
    <li><a routerLink="/categories/fakeId">Category</a></li>
    <li><a routerLink="/categories/fakeId/fakeId">Product</a></li>
    <li><a routerLink="/payment/shopping-cart">Shopping cart</a></li>
    <li><a routerLink="/payment/shopping-cart/order">Order</a></li>
    <li><a routerLink="/payment/shopping-cart/order/unauthorized">Unauthorized</a></li>
</ul>
<router-outlet></router-outlet>

```

In `libs/shop/feat-product/src/lib/lib.routes.ts` use the following route config:

```typescript
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

```

In `libs/shop/feat-payment/src/lib/lib.routes.ts` use the following route config:
*Note: we are loading the `@shoppie/shop/feat-auth` as a lazy  loaded child module of the `shopping-cart/order` route.*

```typescript
import { Route } from '@angular/router';
import { OrderSmartComponent } from './smart-components/order/order.smart-component';
import { ShoppingCartSmartComponent } from './smart-components/shopping-cart/shopping-cart.smart-component';

export const shopFeatPaymentRoutes: Route[] = [
    {
        path: '', redirectTo: 'shopping-cart', pathMatch: 'full',
    },
    {
        path: 'shopping-cart',
        component: ShoppingCartSmartComponent
    },
    {
        path: 'shopping-cart/order',
        component: OrderSmartComponent,
        children: [
            {
                path: 'unauthorized',
                loadChildren: () => import('@shoppie/shop/feat-auth').then(mod => mod.shopFeatAuthRoutes)
            }
        ]
    }
];
```

Since we load the `unauthorized` as a child route we need to add a `<router-outlet>` inside the 
`libs/shop/feat-payment/src/lib/smart-components/order/order.smart-component.html`:

```html
<p>order works!</p>
<router-outlet></router-outlet>
```

Since we are using standalone components we need to add the `RouterModule` inside the imports of the 
`libs/shop/feat-payment/src/lib/smart-components/order/order.smart-component.ts`.

Remove `libs/shop/feat-product/src/lib/shop-feat-product` and also remove the export from 
`libs/shop/feat-product/src/index.ts`. 
Then remove `libs/shop/feat-payment/src/lib/shop-feat-payment` and also remove the export from 
`libs/shop/feat-payment/src/index.ts`.

Lastly remove the `unauthorized` route from the `libs/shop/feat-shell/src/lib/lib.routes.ts` and change the path from the `feat-product` 
from `product` to an empty string:

```typescript
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

```

In `libs/feat-auth/src/lib/lib.routes.ts` update the component to `LoginsmartComponent`:

```typescript
import { Route } from '@angular/router';
import { LoginSmartComponent } from './smart-components/login/login.smart-component';

export const shopFeatAuthRoutes: Route[] = [
    { path: '', component: LoginSmartComponent },
];
```
Now we can also remove the `libs/shop/feat-auth/src/lib/shop-feat-auth` and also remove the export from
`libs/shop/feat-auth/src/index.ts`.

## Bonus:
As an extra step we can generate the dumb uicomponents we still need:

```shell
npx nx g @nrwl/angular:component ui-components/topbar --project=stock-manager-feat-shell --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/sidebar --project=stock-manager-feat-shell --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/button --project=frontend-ui-design-system --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/pane --project=frontend-ui-design-system --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/breadcrumb --project=frontend-ui-design-system --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/product --project=stock-manager-feat-stock --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/category-list --project=stock-manager-feat-stock --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/editable-stock-list --project=stock-manager-feat-stock --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/topbar --project=shop-feat-shell --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/sidebar --project=shop-feat-product --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/product --project=shop-feat-product --type=ui-component &&
npx nx g @nrwl/angular:component ui-components/shopping-cart --project=shop-feat-payment --type=ui-component 
```

In `libs/frontend/ui-design-system/src/lib/` remove the `frontend-ui-design-system` directory
and change the `index.ts` file, so we can export the generated components.

```typescript
export * from './lib/ui-components/breadcrumb/breadcrumb.ui-component';
export * from './lib/ui-components/pane/pane.ui-component';
export * from './lib/ui-components/button/button.ui-component';
```
