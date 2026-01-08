---
title: "Honeycomb testing"
layout: base.njk
---

## setting everything up 

To start with this class we need to take package `004` from the course files.

For the `shop-feat-product` project we want to create storybook configuration and cypress setup.
To achieve this run the following command:

```shell
npx nx g @nrwl/angular:storybook-configuration shop-feat-product
```
✔ Configure a Cypress e2e app to run against the storybook instance? (Y/n) · true

✔ Automatically generate *.stories.ts files for components declared in this project? (Y/n) · true

✔ Automatically generate test files in the generated Cypress e2e app? (Y/n) · true

## Running the test suite

You can run the test suite by executing the following command:

```shell
npx nx run shop-feat-product-e2e:e2e --watch
```
You will see that this gives the following error:
**Can't find stylesheet to import**

For this we need to update the options of the `libs/shop/feat-product/project.json` file
so it knows where the shared styles live.
We need to add `styles` and  `styePreprocessorOptions`:

```json
"build-storybook": {
    "executor": "@storybook/angular:build-storybook",
    "outputs": ["{options.outputDir}"],
    "options": {
        ...
        "styles": ["apps/shop/src/styles.scss"],
        "stylePreprocessorOptions": {
          "includePaths": ["libs/frontend/ui-design-system/src/lib/styles"]
        }
    }
},
```

Open the storybook here: `libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.stories.ts`

And alter the contents accordingly:

```typescript
import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { ProductOverviewSmartComponent } from './product-overview.smart-component';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

export default {
    title: 'ProductOverviewSmartComponent',
    component: ProductOverviewSmartComponent,
    decorators: [
        moduleMetadata({
            imports: [
                HttpClientModule,
                RouterModule.forRoot([
                    {
                        path: '',
                        component: ProductOverviewSmartComponent
                    }
                ], {useHash: true})
            ],
        }),
    ],
} as Meta<ProductOverviewSmartComponent>;

export const Primary: StoryFn = () => ({
    template: `<router-outlet></router-outlet>`
})


```

### Setting up an nx plugin and executor

In `libs/shop/feat-product/src` create a folder called `mock-api` and create three files:
- `data.ts`
- `index.ts`
- `server.ts`

Install the following package:

```shell
npm i @nrwl/nx-plugin@15.7.2 -D
```

Generate a new nx plugin with the following command:

```shell
npx nx g @nrwl/nx-plugin:plugin tools --importPath=@shoppie/tools
```
(if it doesn't work the first time, running it a second time might help)
Generate a new nx executor with the following command:

```shell
npx nx g @nrwl/nx-plugin:executor mock-api --project=tools
```
Add the executor to the `libs/shop/feat-product/project.json` file:

```json
},
"mock-api": {
  "executor": "@shoppie/tools:mock-api"
},
"storybook": {
...
}
```

Install express and cors by running the following commands:
```shell
npm i express@4.18.2 -D && npm i @types/express@4.17.14 -D
``` 

```shell
 npm i cors@2.8.5 -D && npm i @types/cors@2.8.5
```

Let's create the executor so it would run the code that we will later on in `libs/tools/src/executors/mock-api/executor.ts`:

````typescript
import { MockApiExecutorSchema } from './schema';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';

export default async function runExecutor(
  options: MockApiExecutorSchema,
  context: ExecutorContext
) {
  const location = `${context.root}/${context.workspace.projects[context.projectName].root}/src/mock-api/server.ts`
  require(location) // this will execute our mock server
  await new Promise(() => {})
}

````

### Setting up the mock api

In `libs/shop/feat-product/src/mock-api/server.ts` add the following code to create our mock server

```typescript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors())
app.listen('3000')
console.log('running mock server');

```

In `tsconfig.base.json` in the `compilerOptions`, set **allowSyntheticDefaultImports** to **true**.

In `data.ts` add the following mock data:

```typescript
import { Category, Product } from '@shoppie/frontend/type-product';

export const products: Product[] = [...new Array(10)].map((v, i) => {
  return {
    name: `product ${i + 1}`,
    price: 1690,
    description: `Fake description ${i + 1}`,
    advice: `Fake advice ${i + 1}`,
    id: i + 1,
    categoryId: 1,
    quantity: 16
  }
})

export const categories: Category[] = [...new Array(5)].map((v, i) => {
  return {
    name: `category ${i + 1}`,
    description: `Fake description ${i + 1}`,
    id: i + 1
  }
})
```
In the tests we will need access to our mock data later.
For that reason we need to export it from our barrel file:

```typescript
// libs/shop/feat-product/src/mock-api/index.ts
export * from './data';
```

To make it available in our test we need to set up a path mapping in `tsconfig.base.json`.

```json
...
"@shoppie/shop/feat-product/mock-data": ["libs/shop/feat-product/src/mock-api/index.ts"]
```

Later we can import it from `@shoppie/shop/feat-product/mock-data`.

### Add the mock data to the actual mock server

In `libs/shop/feat-product/src/mock-api/server.ts`, update the code to this:

```typescript
import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import { categories, products } from './data';

const app = express();
app.use(cors())
app.listen('3000')

app.get('/products', (req: Request, resp: Response) => {
  resp.send(products);
})

app.get('/categories', (req: Request, resp: Response) => {
  resp.send(categories);
})
console.log('running mock server on port 3000');
```

Run the executor like this:

```shell
npx nx run shop-feat-product:mock-api
```

## Writing the tests

If you haven't done the previous steps we need to take package `005` from the course files.

```

Go to [http://localhost:3000/products](http://localhost:3000/products) to check if the api server runs correctly.
Now run the following command to see if the test is using the mock data

```shell
npx nx run shop-feat-product-e2e:e2e --watch
```

In `libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.html` add **data-cy** attributes on the 
search field and the `sh-product` elements:

```html
...
      <form>
        <label>
          <input type="text" data-cy="input__search" ... />
        </label>
      </form>
    </div>
    <div class="product-overview__content-right-items">
      <sh-product data-cy="product__item"...>...</sh-product>
    </div>
  </div>
</div>

```

create a file `apps/shop-feat-product-e2e/src/support/selectors.ts` and add the following selectors:

```typescript
export const getInputSearch = () => cy.get('[data-cy="input__search"]');
export const getProductItems = () => cy.get('[data-cy="product__item"]');
export const getProductItem = (index: number) => getProductItems().eq(index);
```

In the `apps/shop-feat-product-e2e/src/e2e/smart-components/product-overview/product-overview.smart-component.cy.ts` file add the following code. The first test is for free:

```typescript
import { products } from '@shoppie/shop/feat-product/mock-data';
import { getProductItems } from '../../../support/selectors';

describe('shop-feat-product', () => {
  beforeEach(() =>
    cy.visit('/iframe.html?id=productoverviewsmartcomponent--primary')
  );
  it('should render the product items', () => {
    getProductItems().should('have.length', products.length)
  });
});

```

## Now it's up to you!

Get acquainted with cypress and the api and ask questions when needed
