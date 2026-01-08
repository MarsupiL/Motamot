import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sh-pager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pager.ui-component.html',
  styleUrls: ['./pager.ui-component.scss'],
})
export class PagerUiComponent {
  public Math = Math;
  @Input() public itemsPerPage: number = 0;
  @Input() public total: number = 0;
  @Input() public pageIndex: number = 0;

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
