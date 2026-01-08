---
title: "View models and orchestrators"
layout: base.njk
---
To start with this class we need to take package `006` from the course files.


You can start the `shop` application by running:

```shell
npx nx shop:serve
```
and start the api by running:

```shell
npm run api
```

In this tutorial we will start by refactoring the `libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts`
class to use a **viewmodel**.

A ViewModel is a reactive model for our view.
Let's add the following type to the `libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts` file:

```typescript
type ViewModel = Readonly<{
    itemFrom: number;
    itemTo: number;
    total: number;
    previousDisabled: boolean;
    nextDisabled: boolean;
}>;
```

The `libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.html` has a lot of logic now.
We will want to refactor the following code later:

```html
Showing {%raw%}{{ (pageIndex * itemsPerPage) + 1 }}{%endraw%}
to
{%raw%}{{ pageIndex < (Math.ceil(total / itemsPerPage) - 1) ? (pageIndex * itemsPerPage) + itemsPerPage : total }}
of {{ total }} entries{%endraw%}
<button (click)="goToStart()" [disabled]="pageIndex === 0">
  Begin
</button>
<button (click)="previous()" [disabled]="pageIndex === 0">
  Previous
</button>
<button (click)="next()" [disabled]="pageIndex >= (Math.ceil(total / itemsPerPage) - 1)">
  Next
</button>
<button (click)="goToEnd()" [disabled]="pageIndex >= (Math.ceil(total / itemsPerPage) - 1)">
  End
</button>
```

### BehaviorSubject

Let's update the code of `libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts` to use BehaviorSubjects with setters
and expose it as an observable with `combineLatest`.

```typescript
// libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts
private readonly itemsPerPage$$ = new BehaviorSubject<number>(0);
private readonly total$$ = new BehaviorSubject<number>(0);
private readonly pageIndex$$ = new BehaviorSubject<number>(0);

@Input()
public set itemsPerPage(v: number) {
    this.itemsPerPage$$.next(v);
}

@Input()
public set total(v: number) {
    this.total$$.next(v);
}

@Input()
public set pageIndex(v: number) {
    this.pageIndex$$.next(v);
}

public readonly vm$: Observable<ViewModel> = combineLatest({
  itemsPerPage: this.itemsPerPage$$,
  total: this.total$$,
  pageIndex: this.pageIndex$$
}).pipe(map(({itemsPerPage, total, pageIndex}) => {
      return {
        total,
        previousDisabled: pageIndex === 0,
        nextDisabled: pageIndex >= Math.ceil(total / itemsPerPage) - 1,
        itemFrom: pageIndex * itemsPerPage + 1,
        itemTo:
          pageIndex < Math.ceil(total / itemsPerPage) - 1
            ? pageIndex * itemsPerPage + itemsPerPage
            : total,
      }
    }))
...
```

Now update the `libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.html` to use the ViewModel instead
of the standalone properties:

```html
<ng-container *ngIf="vm$|async as vm">
  {%raw%}Showing {{ vm.itemFrom }}
  to
  {{ vm.itemTo }}
  of {{ vm.total }} entries {%endraw%}
  <button (click)="goToStart()" [disabled]="vm.previousDisabled">
    Begin
  </button>
  <button (click)="previous()" [disabled]="vm.previousDisabled">
    Previous
  </button>
  <button (click)="next()" [disabled]="vm.nextDisabled">
    Next
  </button>
  <button (click)="goToEnd()" [disabled]="vm.nextDisabled">
    End
  </button>
</ng-container>

```

Now update the efficiency of the code with `distinctUntilChanged` operators everywhere.

```typescript
// libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts
public readonly vm$: Observable<ViewModel> = combineLatest({
  itemsPerPage: this.itemsPerPage$$.pipe(distinctUntilChanged()),
  total: this.total$$.pipe(distinctUntilChanged()),
  pageIndex: this.pageIndex$$.pipe(distinctUntilChanged())
}).pipe(map(({itemsPerPage, total, pageIndex}) => {...))
```

The pager still does not work since the normal `@Input()` properties are not accessible anymore because
they are setters. Replace them by the `value` property of the BehaviorSubjects to make it work:

```typescript
public next(): void {
    this.pageIndexChange.emit(this.pageIndex$$.value + 1);
}

public previous(): void {
    this.pageIndexChange.emit(this.pageIndex$$.value - 1);
}

public goToEnd(): void {
    this.pageIndexChange.emit(Math.ceil(this.total$$.value / this.itemsPerPage$$.value) - 1);
}
```

We have a fully working pager component!

## Refactor to reactive input state
Take package `007` or continue if you have finished previous exercise to continue

First of all create a type `PagerInputState` and remove the BehaviorSubjects and roll the inputs back to the
initial state:

```typescript
// libs/frontend/ui-design-system/src/lib/ui-components/pager/pager.ui-component.ts
...
type PagerInputState = {
    itemsPerPage: number;
    total: number;
    pageIndex: number;
}
...
export class PagerUiComponent {
    @InputState() inputState$!: Observable<PagerInputState>;
    
    @Input() public itemsPerPage: number = 0;
    @Input() public total: number = 0;
    @Input() public pageIndex: number = 0;
    ...
}
```

Update the `combineLatest` and `distinctUntilChanged` code so it derives from the `inputState$`:

```typescript
public readonly vm$: Observable<ViewModel> = this.inputState$
    .pipe(map(({ itemsPerPage, total, pageIndex }) => {
        return {
          total,
          previousDisabled: pageIndex === 0,
          nextDisabled: pageIndex >= Math.ceil(total / itemsPerPage) - 1,
          itemFrom: pageIndex * itemsPerPage + 1,
          itemTo:
            pageIndex < Math.ceil(total / itemsPerPage) - 1
              ? pageIndex * itemsPerPage + itemsPerPage
              : total,
        }
      })
)
```

Also make sure that the `next()`, `previous()` and `goToEnd()` functions use the inputs instead
of the BehaviorSubjects:

```typescript
public next(): void {
    this.pageIndexChange.emit(this.pageIndex + 1);
}

public previous(): void {
    this.pageIndexChange.emit(this.pageIndex - 1);
}

public goToEnd(): void {
    this.pageIndexChange.emit(Math.ceil(this.total / this.itemsPerPage) - 1);
}
```

## ViewModels for smart components

Take package `008` or continue if you have finished previous exercises to continue.

In `libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.html` we can see that we have 
a bunch of nested **async** pipes. These result in multiple subscriptions in not that clean code.
We will refactor this later:

```html
<div class="product-overview__content">
  <sh-sidebar
    [categories]="(categories$|async)!"
    class="product-overview__content-left"
  ></sh-sidebar>
  <div class="product-overview__content-right">
    <sh-breadcrumb [breadcrumbItems]="breadcrumbItems"></sh-breadcrumb>
    <div class="product-overview__content-right-top">
      <h1>Product overview</h1>
      <form>
        <label>
          <input placeholder="Type to filter..." type="text" data-cy="input__search" (input)="setQuery($event)" [value]="query$|async" />
        </label>
      </form>
    </div>
    <div class="product-overview__content-right-items">
      <sh-product
        data-cy="product__item"
        *ngFor="let product of products$|async"
        [product]="product"
        class="product-overview__content-right-item"
      ></sh-product>
    </div>
    <sh-pager
      [itemsPerPage]="(itemsPerPage$|async)|| 0"
      [total]="(total$|async)|| 0"
      [pageIndex]="(pageIndex$|async)||0"
      (pageIndexChange)="pageIndexChange($event)"
    >
    </sh-pager>
  </div>
</div>

```

The code of the ts file also looks complex:

```typescript
 private readonly pageIndex$$ = new BehaviorSubject<number>(0);
  private readonly query$$ = new BehaviorSubject<string>('');
  private readonly itemsPerPage$$ = new BehaviorSubject<number>(5);
  public readonly pageIndex$ = this.pageIndex$$.asObservable();
  public readonly itemsPerPage$ = this.itemsPerPage$$.asObservable();
  public readonly query$ = this.query$$.asObservable();
  public readonly breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Home',
      route: [''],
    },
    {
      label: 'Products',
      route: ['/products'],
    },
  ];
  private readonly facadeService = inject(FacadeService);
  private readonly productsResult$ = this.facadeService.getProducts().pipe(shareReplay({bufferSize: 1, refCount: true}));
  private readonly filteredProducts$ = combineLatest({query: this.query$$, productsResult: this.productsResult$})
    .pipe(
      map(({query, productsResult}) => {
        return productsResult.filter(p => p.name.toLowerCase().indexOf(query.toLowerCase()) > -1)
      })
    )
  public readonly products$ = combineLatest({
    pageIndex: this.pageIndex$,
    itemsPerPage: this.itemsPerPage$,
    filteredProducts: this.filteredProducts$
  }).pipe(
    map(({pageIndex, filteredProducts, itemsPerPage}) => {
      const offsetStart = (pageIndex) * itemsPerPage;
      const offsetEnd = (pageIndex + 1) * itemsPerPage;
      return filteredProducts.slice(offsetStart, offsetEnd)
    })
  )

  public readonly total$ =this.filteredProducts$.pipe(map(products => products.length))
  public readonly categories$ = this.facadeService.getCategories();

  public setQuery(e: Event): void {
    this.query$$.next((e.target as HTMLInputElement).value);
  }

  public pageIndexChange(pageIndex: number): void {
    this.pageIndex$$.next(pageIndex)
  }
```

First of all, let's create a `ViewModel` type in `libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.ts`:

```typescript
// libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.ts
type ViewModel = {
  categories: Category[];
  query: string;
  products: Product[];
  itemsPerPage: number;
  total: number;
  pageIndex: number;
}
...
```

Next remove the observables that end with the `asObservable()` operator and implement the ViewModel so it's an observable
that exposes everything the template needs. The following is the complete code of
`libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.ts`:

```typescript
export class ProductOverviewSmartComponent {
    private readonly pageIndex$$ = new BehaviorSubject<number>(0);
    private readonly query$$ = new BehaviorSubject<string>('');
    private readonly itemsPerPage$$ = new BehaviorSubject<number>(5);
    public readonly breadcrumbItems: BreadcrumbItem[] = [
        {
            label: 'Home',
            route: [''],
        },
        {
            label: 'Products',
            route: ['/products'],
        },
    ];
    private readonly facadeService = inject(FacadeService);
    public readonly vm$: Observable<ViewModel> = combineLatest({
        categories: this.facadeService.getCategories(),
        productsResult: this.facadeService.getProducts(),
        pageIndex: this.pageIndex$$,
        itemsPerPage: this.itemsPerPage$$,
        query: this.query$$,
    }).pipe(
        map(({ categories, productsResult, pageIndex, itemsPerPage, query }) => {
            const filteredProducts = productsResult.filter(p => p.name.toLowerCase().indexOf(query.toLowerCase()) > -1);
            const offsetStart = (pageIndex) * itemsPerPage;
            const offsetEnd = (pageIndex + 1) * itemsPerPage;
            const products = filteredProducts.slice(offsetStart, offsetEnd);
            return {
                total: filteredProducts.length,
                query: query,
                categories,
                itemsPerPage,
                pageIndex,
                products
            }
        })
    )

    public setQuery(e: Event): void {
        this.query$$.next((e.target as HTMLInputElement).value);
    }

    public pageIndexChange(pageIndex: number): void {
        this.pageIndex$$.next(pageIndex)
    }
}
```
This cleaned up, pretty well didn't it?

Now update the html in `libs/shop/feat-product/src/lib/smart-components/product-overview/product-overview.smart-component.html`
so it uses the vm instead of the observables:
```html
<div class="product-overview__content" *ngIf="vm$|async as vm">
  <sh-sidebar
    [categories]="vm.categories"
    class="product-overview__content-left"
  ></sh-sidebar>
  <div class="product-overview__content-right">
    <sh-breadcrumb [breadcrumbItems]="breadcrumbItems"></sh-breadcrumb>
    <div class="product-overview__content-right-top">
      <h1>Product overview</h1>
      <form>
        <label>
          <input placeholder="Type to filter..." type="text" data-cy="input__search"
                 (input)="setQuery($event)" [value]="vm.query" />
        </label>
      </form>
    </div>
    <div class="product-overview__content-right-items">
      <sh-product
        data-cy="product__item"
        *ngFor="let product of vm.products"
        [product]="product"
        class="product-overview__content-right-item"
      ></sh-product>
    </div>
    <sh-pager
      [itemsPerPage]="vm.itemsPerPage"
      [total]="vm.total"
      [pageIndex]="vm.pageIndex"
      (pageIndexChange)="pageIndexChange($event)"
    >
    </sh-pager>
  </div>
</div>

```

Now we have a nice and clean html and reactive flow.
