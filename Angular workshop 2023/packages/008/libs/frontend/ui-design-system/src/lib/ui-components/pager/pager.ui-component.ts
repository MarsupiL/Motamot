import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';
import { InputState } from '@shoppie/frontend/util-state';

type ViewModel = Readonly<{
  itemFrom: number;
  itemTo: number;
  total: number;
  previousDisabled: boolean;
  nextDisabled: boolean;
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
  @InputState() inputState$!: Observable<PagerInputState>;

  @Input() public itemsPerPage: number = 0;
  @Input() public total: number = 0;
  @Input() public pageIndex: number = 0;

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

  @Output() public readonly pageIndexChange = new EventEmitter<number>()

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
}
