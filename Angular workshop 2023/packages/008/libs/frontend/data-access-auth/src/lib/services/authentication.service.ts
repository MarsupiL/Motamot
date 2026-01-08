import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { AuthenticationResult } from '@shoppie/frontend/type-auth';

@Injectable({ providedIn: 'root' })
/**
 * Note this is a mocked version, this monrepo doesn't have a real backend
 */
export class AuthenticationService {
  private readonly document = inject(DOCUMENT);
  private readonly localStorageKey = 'authentication-result';
  private readonly authenticationResult$$ =
    new BehaviorSubject<AuthenticationResult | null>(null);

  public readonly authenticated$ = this.authenticationResult$$.pipe(
    map((v) => !!v)
  );
  public readonly authenticationResult$ =
    this.authenticationResult$$.asObservable();

  constructor() {
    const authenticationResult =
      this.document?.defaultView?.localStorage.getItem(this.localStorageKey);
    if (authenticationResult) {
      this.authenticationResult$$.next(JSON.parse(authenticationResult));
    }
  }

  public authenticate(
    login: string,
    password: string
  ): Observable<AuthenticationResult> {
    this.authenticationResult$$.next({
      token: 'faketoken',
      firstName: 'John',
      lastName: 'Doe',
    });
    this.document?.defaultView?.localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(this.authenticationResult$$.value)
    );
    return this.authenticationResult$$.asObservable() as Observable<AuthenticationResult>;
  }

  public logout(): void {
    this.authenticationResult$$.next(null);
    this.document?.defaultView?.localStorage.removeItem(this.localStorageKey);
  }
}
