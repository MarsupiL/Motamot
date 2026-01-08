import { inject, Injectable } from '@angular/core';
import { AuthenticationService } from '@shoppie/frontend/data-access-auth';

@Injectable({
  providedIn: 'root',
})
export class FacadeService {
  private readonly authenticationService = inject(AuthenticationService);
  public readonly authenticated$ = this.authenticationService.authenticated$;
  public readonly authenticationResult$ =
    this.authenticationService.authenticationResult$;

  public logout(): void {
    this.authenticationService.logout();
  }
}
