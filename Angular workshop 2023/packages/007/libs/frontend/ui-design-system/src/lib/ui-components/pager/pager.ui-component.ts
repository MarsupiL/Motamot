import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable } from 'rxjs';

type ViewModel = Readonly<{
  itemFrom: number;
  itemTo: number;
  total: number;
  previousDisabled: boolean;
  nextDisabled: boolean;
}>;

@Component({
  selector: 'sh-pager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pager.ui-component.html',
  styleUrls: ['./pager.ui-component.scss'],
})
export class PagerUiComponent {
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

  public readonly vm$: Observable<ViewModel> = combineLatest(
    {
      itemsPerPage: this.itemsPerPage$$.pipe(distinctUntilChanged()),
      total: this.total$$.pipe(distinctUntilChanged()),
      pageIndex: this.pageIndex$$.pipe(distinctUntilChanged())
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
    })
  )

  @Output() public readonly pageIndexChange = new EventEmitter<number>()

  public goToStart(): void {
    this.pageIndexChange.emit(0);
  }

  public next(): void {
    this.pageIndexChange.emit(this.pageIndex$$.value + 1);
  }

  public previous(): void {
    this.pageIndexChange.emit(this.pageIndex$$.value - 1);
  }

  public goToEnd(): void {
    this.pageIndexChange.emit(Math.ceil(this.total$$.value / this.itemsPerPage$$.value) - 1);
  }
}
