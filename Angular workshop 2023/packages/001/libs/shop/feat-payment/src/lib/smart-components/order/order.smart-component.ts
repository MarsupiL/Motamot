import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'sh-order',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order.smart-component.html',
  styleUrls: ['./order.smart-component.scss'],
})
export class OrderSmartComponent {}
