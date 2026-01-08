import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';
import { RouterModule } from '@angular/router';
import { EnhancedCategory } from '../../types/enhanced-category.type';

@Component({
  selector: 'sh-category-list',
  standalone: true,
  imports: [CommonModule, ButtonUiComponent, RouterModule],
  templateUrl: './category-list.ui-component.html',
  styleUrls: ['./category-list.ui-component.scss'],
})
export class CategoryListUiComponent {
  @Input() public categories: EnhancedCategory[] | null = [];
}
