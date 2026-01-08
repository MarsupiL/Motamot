import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from "@angular/router";

@Component({
  selector: 'sh-shop-feat-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop-feat-shell.component.html',
  styleUrls: ['./shop-feat-shell.component.scss'],
})
export class ShopFeatShellComponent {}
