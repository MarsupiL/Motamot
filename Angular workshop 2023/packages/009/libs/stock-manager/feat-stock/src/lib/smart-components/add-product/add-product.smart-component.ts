import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import {
  ButtonUiComponent,
  PaneUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FacadeService } from '../../facade.service';
import { HttpClientModule } from '@angular/common/http';
import { CreateProductDto } from '@shoppie/frontend/type-product';

@Component({
  selector: 'sh-add-product',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaneUiComponent,
    RouterModule,
    HttpClientModule,
    ButtonUiComponent,
  ],
  templateUrl: './add-product.smart-component.html',
  styleUrls: ['./add-product.smart-component.scss'],
})
export class AddProductSmartComponent {
  @ViewChild('form') public form: FormGroup | undefined;
  public product: CreateProductDto = {
    name: '',
    price: 0,
    description: '',
    advice: '',
    categoryId: undefined,
  };
  private readonly facade = inject(FacadeService);
  public readonly categories$ = this.facade.getCategories();
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  public onSubmit(): void {
    if (this.form?.valid) {
      this.facade.createProduct(this.product).subscribe(() => {
        this.router.navigate(['..'], { relativeTo: this.activatedRoute });
      });
    }
  }
}
