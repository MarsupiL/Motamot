import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthenticationResult } from '@shoppie/frontend/type-auth';

@Component({
  selector: 'sh-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.ui-component.html',
  styleUrls: ['./sidebar.ui-component.scss'],
})
export class SidebarUiComponent {
  @Input() public authenticationResult: AuthenticationResult | null = null;
}
