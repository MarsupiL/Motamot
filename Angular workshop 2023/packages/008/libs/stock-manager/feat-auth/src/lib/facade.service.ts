import { inject, Injectable } from '@angular/core';
import { AuthenticationService } from '@shoppie/frontend/data-access-auth';
import { Observable } from 'rxjs';
import { AuthenticationResult } from '@shoppie/frontend/type-auth';

@Injectable({
  providedIn: 'root',
})
export class FacadeService {
  private readonly authenticationService = inject(AuthenticationService);

  public authenticate(
    login: string,
    password: string
  ): Observable<AuthenticationResult> {
    return this.authenticationService.authenticate(login, password);
  }
}
