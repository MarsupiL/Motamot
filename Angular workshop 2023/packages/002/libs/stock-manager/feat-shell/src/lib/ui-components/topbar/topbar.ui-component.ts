import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';
import { AuthenticationResult } from '@shoppie/frontend/type-auth';

@Component({
  selector: 'sh-topbar',
  standalone: true,
  imports: [CommonModule, ButtonUiComponent],
  templateUrl: './topbar.ui-component.html',
  styleUrls: ['./topbar.ui-component.scss'],
})
export class TopbarUiComponent {
  @Input() public authenticationResult: AuthenticationResult | null = null;
  @Output() public readonly logout = new EventEmitter();
}
