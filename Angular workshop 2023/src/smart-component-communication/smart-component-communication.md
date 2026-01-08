---
title: "Smart component communication"
layout: base.njk
---

To start with this class we need to take package `003` from the course files.

## Create the smart helper
The smart helper is nothing more than a service that is not provided in root.

Let's create this injectable by running the following command:
```shell
npx nx g @nrwl/angular:service smart-helpers/category-smart-helper --project=stock-manager-feat-stock
```
There is no param to skip the `providedIn: 'root'` so let's remove it from

`libs/stock-manager/feat-stock/src/lib/smart-helpers/category-smart-helper.service.ts` and make it a regular Injectable.

The smart helper will only contain a subject that is exposed through an observable and can be triggered
by executing the `triggerFetchCategories()` function.

```typescript
// libs/stock-manager/feat-stock/src/lib/smart-helpers/category-smart-helper.service.ts
@Injectable()
export class CategorySmartHelperService {
  private readonly fetchCategories$$ = new Subject<void>();
  public readonly fetchCategories$ = this.fetchCategories$$.asObservable()

  public triggerFetchCategories(): void {
    this.fetchCategories$$.next();
  }
}

```

To use this smart helper we have to provide it on the highest level of where we want to inject it.
In this case this is the `CategoryOverviewSmartComponent`. It's a best practice
to keep it as low as possible. That way the instance will get destroyed when we navigate away from the category overview.
See that the `categories$` is handled differently now

```typescript
// libs/stock-manager/feat-stock/src/lib/smart-components/category-overview/category-overview.smart-component.ts

@Component({
    ...
    providers: [CategorySmartHelperService],
    templateUrl: './category-overview.smart-component.html',
    styleUrls: ['./category-overview.smart-component.scss'],
})
export class CategoryOverviewSmartComponent {
    private readonly smartHelper = inject(CategorySmartHelperService);
    private readonly facade = inject(FacadeService);
    private readonly categories$ = this.smartHelper.fetchCategories$.pipe(
        startWith(null), // initial call
        switchMap(() => this.facade.getCategories())
    );
    ...
}

```

The only thing left to do is let the `AddCategoryComponent` tell the smart helper that the data needs to be refetched:

```typescript
// libs/stock-manager/feat-stock/src/lib/smart-components/add-category/add-category.smart-component.ts
...
export class AddCategorySmartComponent {
    private readonly smartHelper = inject(CategorySmartHelperService);
    ...
    public onSubmit(): void {
        if (this.form.valid) {
            this.facade.createCategory(this.category).subscribe(() => {
                this.router.navigate(['..'], {relativeTo: this.activatedRoute});
                this.smartHelper.triggerFetchCategories(); // refetch
            });
        }
    }
}

```

We should check out if we go to [http://localhost:4200/categories/add](http://localhost:4200/categories/add) and we create
a new category if the categories are being refetched.
