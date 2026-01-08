import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarUiComponent } from '../../ui-components/sidebar/sidebar.ui-component';
import { TopbarUiComponent } from '../../ui-components/topbar/topbar.ui-component';
import { FacadeService } from '../../facade.service';

@Component({
  selector: 'sh-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarUiComponent, TopbarUiComponent],
  templateUrl: './shell.smart-component.html',
  styleUrls: ['./shell.smart-component.scss'],
})
export class ShellSmartComponent {
  private readonly router = inject(Router);
  private readonly facade = inject(FacadeService);
  public authenticationResult$ = this.facade.authenticationResult$;

  public logout(): void {
    this.facade.logout();
    this.router.navigate(['unauthorized']);
  }
}
