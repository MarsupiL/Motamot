import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { Product } from '@shoppie/frontend/type-product';

type Mutable<Type> = {
  -readonly [Key in keyof Type]: Type[Key];
};

@Component({
  selector: 'sh-editable-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-stock-list.ui-component.html',
  styleUrls: ['./editable-stock-list.ui-component.scss'],
})
export class EditableStockListUiComponent {
  @ViewChild('form') public form: FormGroup | undefined;
  @Output() stockChange = new EventEmitter<Product>();
  public productsCopy: Mutable<Product>[] = [];

  @Input()
  public set products(value: Product[] | null) {
    if (value) {
      this.productsCopy = value?.map((product) => ({ ...product }));
    }
  }
}
