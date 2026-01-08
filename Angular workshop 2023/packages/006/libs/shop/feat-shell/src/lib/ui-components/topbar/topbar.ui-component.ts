import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'sh-topbar',
  standalone: true,
  imports: [CommonModule, ButtonUiComponent, RouterModule],
  templateUrl: './topbar.ui-component.html',
  styleUrls: ['./topbar.ui-component.scss'],
})
export class TopbarUiComponent {}
