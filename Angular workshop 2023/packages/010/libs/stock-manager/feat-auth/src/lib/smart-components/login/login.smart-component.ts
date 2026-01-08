import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import {
  ButtonUiComponent,
  PaneUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { FacadeService } from '../../facade.service';
import { Router } from '@angular/router';

@Component({
  selector: 'sh-login',
  standalone: true,
  imports: [CommonModule, FormsModule, PaneUiComponent, ButtonUiComponent],
  templateUrl: './login.smart-component.html',
  styleUrls: ['./login.smart-component.scss'],
})
export class LoginSmartComponent {
  @ViewChild('form') form: FormGroup | undefined;
  public loginForm = {
    login: '',
    password: '',
  };
  private readonly router = inject(Router);
  private readonly facade = inject(FacadeService);

  public onSubmit(): void {
    if (this.form?.valid) {
      this.facade
        .authenticate(this.loginForm.login, this.loginForm.password)
        .subscribe(() => {
          this.router.navigate(['']);
        });
    }
  }
}
