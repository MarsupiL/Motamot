import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { FacadeService } from '../../facade.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ButtonUiComponent,
  PaneUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { HttpClientModule } from '@angular/common/http';
import { CreateCategoryDto } from '@shoppie/frontend/type-product';

@Component({
  selector: 'sh-add-category',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaneUiComponent,
    RouterModule,
    HttpClientModule,
    ButtonUiComponent,
  ],
  templateUrl: './add-category.smart-component.html',
  styleUrls: ['./add-category.smart-component.scss'],
})
export class AddCategorySmartComponent {
  @ViewChild('form') public form: FormGroup | undefined;
  public category: CreateCategoryDto = {
    name: '',
    description: '',
  };
  private readonly facade = inject(FacadeService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  public onSubmit(): void {
    if (this.form?.valid) {
      this.facade.createCategory(this.category).subscribe(() => {
        this.router.navigate(['..'], { relativeTo: this.activatedRoute });
      });
    }
  }
}
