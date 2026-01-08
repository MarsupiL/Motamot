import { Injectable } from '@angular/core';
import { Subject } from "rxjs";

@Injectable()
export class CategorySmartHelperService {
  private readonly fetchCategories$$ = new Subject<void>();
  public readonly fetchCategories$ = this.fetchCategories$$.asObservable()

  public triggerFetchCategories(): void {
    this.fetchCategories$$.next();
  }
}
