import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';
import { RouterModule } from '@angular/router';
import { Product } from '@shoppie/frontend/type-product';

@Component({
  selector: 'sh-product',
  standalone: true,
  imports: [CommonModule, ButtonUiComponent, RouterModule],
  templateUrl: './product.ui-component.html',
  styleUrls: ['./product.ui-component.scss'],
})
export class ProductUiComponent {
  @Input() public product: Product | null = null;
}
