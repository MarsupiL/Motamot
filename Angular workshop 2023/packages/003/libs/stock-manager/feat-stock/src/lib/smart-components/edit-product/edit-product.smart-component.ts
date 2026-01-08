import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonUiComponent,
  PaneUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { FacadeService } from '../../facade.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { FormGroup, FormsModule } from '@angular/forms';
import { UpdateProductDto } from '@shoppie/frontend/type-product';

@Component({
  selector: 'sh-edit-product',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PaneUiComponent,
    ButtonUiComponent,
    FormsModule,
  ],
  templateUrl: './edit-product.smart-component.html',
  styleUrls: ['./edit-product.smart-component.scss'],
})
export class EditProductSmartComponent {
  public product: UpdateProductDto = {
    name: '',
    price: 0,
    description: '',
    advice: '',
    categoryId: undefined,
  };
  @ViewChild('form') public form: FormGroup | undefined;
  private readonly facade = inject(FacadeService);
  public readonly categories$ = this.facade.getCategories();
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly product$ = this.activatedRoute.params.pipe(
    switchMap((p) => this.facade.getProductByd(p['productId']))
  );

  constructor() {
    this.product$.subscribe((product) => {
      this.product = { ...product };
    });
  }

  public onSubmit(): void {
    if (this.form?.valid) {
      this.facade
        .updateProduct(
          this.activatedRoute.snapshot.params['productId'],
          this.product
        )
        .subscribe(() => {
          this.router.navigate(['..'], { relativeTo: this.activatedRoute });
        });
    }
  }

  public onRemove(): void {
    this.facade
      .removeProduct(this.activatedRoute.snapshot.params['productId'])
      .subscribe(() => {
        this.router.navigate(['..'], { relativeTo: this.activatedRoute });
      });
  }
}
