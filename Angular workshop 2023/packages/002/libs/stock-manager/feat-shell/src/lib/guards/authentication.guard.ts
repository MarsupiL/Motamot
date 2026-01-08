import { inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { map, Observable } from 'rxjs';
import { FacadeService } from '../facade.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly facade = inject(FacadeService);

  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.facade.authenticated$.pipe(
      map((authenticated: boolean) => {
        if (!authenticated) {
          return this.router.createUrlTree(['unauthorized']);
        }
        return true;
      })
    );
  }
}
