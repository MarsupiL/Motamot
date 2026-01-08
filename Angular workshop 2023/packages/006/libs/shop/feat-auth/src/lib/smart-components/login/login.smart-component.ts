import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonUiComponent } from '@shoppie/frontend/ui-design-system';

@Component({
  selector: 'sh-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonUiComponent],
  templateUrl: './login.smart-component.html',
  styleUrls: ['./login.smart-component.scss'],
})
export class LoginSmartComponent {
  public loginForm = {
    login: '',
    password: '',
  };
}
