import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '@shoppie/frontend/type-product';
import { RouterModule } from '@angular/router';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';

@Component({
  selector: 'sh-product',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonUiComponent],
  templateUrl: './product.ui-component.html',
  styleUrls: ['./product.ui-component.scss'],
})
export class ProductUiComponent {
  @Input() public product: Product | null = null;
}
