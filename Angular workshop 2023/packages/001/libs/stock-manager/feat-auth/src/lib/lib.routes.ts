import { Route } from '@angular/router';
import { LoginSmartComponent } from "./smart-components/login/login.smart-component";

export const stockManagerFeatAuthRoutes: Route[] = [
  { path: '', component: LoginSmartComponent },
];
