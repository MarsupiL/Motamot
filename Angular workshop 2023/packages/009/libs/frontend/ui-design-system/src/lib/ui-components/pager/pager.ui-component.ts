import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { InputState } from '@shoppie/frontend/util-state';

type ViewModel = Readonly<{
  itemFrom: number;
  itemTo: number;
  total: number;
  previousDisabled: boolean;
  nextDisabled: boolean;
  showItemsPerPage: boolean;
  itemsPerPageOptions: number[];
}>;

type PagerInputState = {
  itemsPerPage: number;
  total: number;
  pageIndex: number;
}

@Component({
  selector: 'sh-pager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pager.ui-component.html',
  styleUrls: ['./pager.ui-component.scss'],
})
export class PagerUiComponent {
  private readonly showItemsPerPage$$ = new BehaviorSubject<boolean>(false);
  private readonly itemsPerPageOptions$$ = new BehaviorSubject<number[]>([5, 10, 20])

  @InputState() inputState$!: Observable<PagerInputState>;

  @Input() public itemsPerPage = 0;
  @Input() public total = 0;
  @Input() public pageIndex = 0;

  public readonly vm$: Observable<ViewModel> = combineLatest({
    inputState: this.inputState$,
    showItemsPerPage: this.showItemsPerPage$$,
    itemsPerPageOptions: this.itemsPerPageOptions$$
  })
    .pipe(map(({ inputState, showItemsPerPage, itemsPerPageOptions }) => {
        const { total, pageIndex, itemsPerPage } = inputState;
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

  @Output() public readonly pageIndexChange = new EventEmitter<number>();
  @Output() public readonly itemsPerPageChange = new EventEmitter<number>();

  public toggleShowItemsPerPage(): void {
    this.showItemsPerPage$$.next(!this.showItemsPerPage$$.value);
  }

  public goToStart(): void {
    this.pageIndexChange.emit(0);
  }

  public next(): void {
    this.pageIndexChange.emit(this.pageIndex + 1);
  }

  public previous(): void {
    this.pageIndexChange.emit(this.pageIndex - 1);
  }

  public goToEnd(): void {
    this.pageIndexChange.emit(Math.ceil(this.total / this.itemsPerPage) - 1);
  }

  public itemsPerPageChanged(option: any): void {
    this.itemsPerPageChange.emit(+option?.target?.value)
  }
}
