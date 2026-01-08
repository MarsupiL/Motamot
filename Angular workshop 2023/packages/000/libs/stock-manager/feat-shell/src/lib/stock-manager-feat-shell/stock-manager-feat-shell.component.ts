import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from "@angular/router";

@Component({
  selector: 'sh-stock-manager-feat-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stock-manager-feat-shell.component.html',
  styleUrls: ['./stock-manager-feat-shell.component.scss'],
})
export class StockManagerFeatShellComponent {}
