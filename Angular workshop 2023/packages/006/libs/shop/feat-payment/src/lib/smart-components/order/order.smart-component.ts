import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  BreadcrumbItem,
  BreadcrumbUiComponent,
} from '@shoppie/frontend/ui-design-system';

@Component({
  selector: 'sh-order',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbUiComponent],
  templateUrl: './order.smart-component.html',
  styleUrls: ['./order.smart-component.scss'],
})
export class OrderSmartComponent {
  public readonly breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Home',
      route: [''],
    },
    {
      label: 'Shopping-cart',
      route: ['/payment', 'shopping-cart'],
    },
    {
      label: 'order',
      route: ['/payment', 'shopping-cart', 'order'],
    },
  ];
}
