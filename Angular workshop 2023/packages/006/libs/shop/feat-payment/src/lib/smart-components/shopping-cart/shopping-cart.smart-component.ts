import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BreadcrumbItem,
  BreadcrumbUiComponent,
  ButtonUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'sh-shopping-cart',
  standalone: true,
  imports: [
    CommonModule,
    ButtonUiComponent,
    BreadcrumbUiComponent,
    RouterModule,
  ],
  templateUrl: './shopping-cart.smart-component.html',
  styleUrls: ['./shopping-cart.smart-component.scss'],
})
export class ShoppingCartSmartComponent {
  public readonly breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Home',
      route: [''],
    },
    {
      label: 'Shopping-cart',
      route: ['/payment', 'shopping-cart'],
    },
  ];
}
