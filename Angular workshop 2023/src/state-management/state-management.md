---
title: "State management"
layout: base.njk
---

To start with this class we need to take package `009` from the course files.


You can start the `shop` application by running:

```shell
npx nx shop:serve
```

In [http://localhost:4200/products](http://localhost:4200/products) you will see that the pager has some
extra logic implemented to show the items per page and change them.

We are going to start with creating a type `PagerState` in `libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts`:

```typescript
type PagerInputState = {
    itemsPerPage: number;
    total: number;
    pageIndex: number;
}
type PagerState = PagerInputState & {
    showItemsPerPage: boolean;
    itemsPerPageOptions: number[];
}
```

Extend the `PagerUiComponent` from `ObservableState<PagerState>` an remove the 2 BehaviorSubjects.
Add a constructor where you initialize the state with the default input state and default values:

```typescript
// libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts
// extend from ObservableState
export class PagerUiComponent extends ObservableState<PagerState> {
    @InputState() inputState$!: Observable<PagerInputState>;

    @Input() public itemsPerPage = 0;
    @Input() public total = 0;
    @Input() public pageIndex = 0;

    constructor() {
        super();
        // initialize the state
        this.initialize({
            ...getDefaultInputState(this),
            showItemsPerPage: false,
            itemsPerPageOptions: [5, 10, 20]
        }, this.inputState$);
    }
    ...
}
```

Update the `vm$` so it uses the state instead of a `combineLatest`

```typescript
public readonly vm$: Observable<ViewModel> = this.state$.pipe(
    map(({ pageIndex, total, itemsPerPage, showItemsPerPage, itemsPerPageOptions }) => {
        return {
          total,
          previousDisabled: pageIndex === 0,
          nextDisabled: pageIndex >= Math.ceil(total / itemsPerPage) - 1,
          itemFrom: pageIndex * itemsPerPage + 1,
          showItemsPerPage,
          itemsPerPageOptions,
          itemTo:
            pageIndex < Math.ceil(total / itemsPerPage) - 1
              ? pageIndex * itemsPerPage + itemsPerPage
              : total,
        }
      })
    )
```

The last thing we need to do is update the `toggleShowItemsPerPage()` method so it
patches the state:

```typescript
public toggleShowItemsPerPage(): void {
    this.patch({ showItemsPerPage: !this.snapshot.showItemsPerPage });
}
```

We have now implemented an easy version of simple local component state for our pager.
- No more BehaviorSubjects
- No more `combineLatest`
- No `takeUntil(this.destroy$$)`
- No `foo$$.value` nor `foo$$.next`
- No multiple emissions at the same time

## Smart component state

In `libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.ts`, create
a type called `ProductOverviewState`:

```typescript
type ProductOverviewState = {
    pageIndex: number;
    query: string;
    itemsPerPage: number;
    categories: Category[];
    products: Product[];
    filteredProducts: Product[];
    pagedProducts: Product[];
}
```
Extend the `ProductOverviewSmartComponent` from `ObservableState<ProductOverviewState>` and 
remove the BehaviorSubjects `pageIndex$$`, `query$$` and `itemsPerPage$$` and initialize the state accordingly:

```typescript
export class ProductOverviewSmartComponent extends ObservableState<ProductOverviewState> {
    ...
    constructor() {
        super();
        this.initialize({
            pageIndex: 0,
            itemsPerPage: 5,
            query: '',
            categories: [],
            products: [],
            filteredProducts: [],
            pagedProducts: []
        });
    }
    ...
}
```

Now let's tackle the reactive part and connect the categories and the products in the `connect` function:
The connect function will subscribe to the source observable, and unsubscribe when needed.

```typescript
constructor()
{
    super();
    this.initialize({
        pageIndex: 0,
        itemsPerPage: 5,
        query: '',
        categories: [],
        products: [],
        filteredProducts: [],
        pagedProducts: []
    });
    this.connect({
        products: this.facadeService.getProducts(),
        categories: this.facadeService.getCategories()
    })
}
```

We still have to calculate `filteredProducts` and `pagedProducts`.
By using the `onlySelectWhen()` method we can get the latest state only when one of the passed keys has changed.
Here is what we need to create an observable for `filteredProducts$`  and `pagedProducts$`:

```typescript
const filteredProducts$ = this.onlySelectWhen(['products', 'query']).pipe(
  map(({products, query}) => products.filter(p => p.name.toLowerCase().indexOf(query.toLowerCase()) > -1))
);

const pagedProducts$ = this.onlySelectWhen(['filteredProducts', 'pageIndex', 'itemsPerPage']).pipe(
  map(({filteredProducts, pageIndex, itemsPerPage}) => {
    const offsetStart = (pageIndex) * itemsPerPage;
    const offsetEnd = (pageIndex + 1) * itemsPerPage;
    return  filteredProducts.slice(offsetStart, offsetEnd);
  })
)
```

Let's also connect these to our local component state:

```typescript
this.connect({
    products: this.facadeService.getProducts(),
    categories: this.facadeService.getCategories(),
    filteredProducts: filteredProducts$,
    pagedProducts: pagedProducts$
})
```

The calculation of the viewModel should look a way cleaner after refactoring it:

```typescript
 public readonly vm$: Observable<ViewModel> = this.onlySelectWhen([
    'categories',
    'pagedProducts',
    'filteredProducts',
    'pageIndex',
    'itemsPerPage',
    'query'
  ]).pipe(
    map(({ categories, filteredProducts, pagedProducts, pageIndex, itemsPerPage, query }) => {
      return {
        total: filteredProducts.length,
        query: query,
        categories,
        itemsPerPage,
        pageIndex,
        products: pagedProducts
      }
    })
  )
```

Now we still have to interact with the state in the `setQuery()` method, `itemsPerPageChange()` method and `pageIndexChange()` method:

```typescript
public setQuery(e: Event): void {
    this.patch({ pageIndex: 0, query: (e.target as HTMLInputElement).value })
}

public pageIndexChange(pageIndex: number): void {
    this.patch({ pageIndex });
}

public itemsPerPageChange(itemsPerPage: number): void {
    this.patch({ pageIndex: 0, itemsPerPage })
}
```

## Bonus

The `connect()` method is quite powerful. Add another piece of state `time` to 
`ProductOverviewState` initialize it in the `initialize()` function with:

```typescript
this.initialize({
    ...
    time: new Date().getTime()
});
```

Now connect it in the `connect()` function with:
```typescript
time: interval(1000).pipe(map(() => new Date().getTime()))
```

Now add it to the ViewModel and visualize the time inside the application with 
```html
{%raw%}{{vm.time|date: 'hh:mm:ss'}}{%endraw%}}
```