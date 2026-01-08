import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { FacadeService } from '../../facade.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ButtonUiComponent,
  PaneUiComponent,
} from '@shoppie/frontend/ui-design-system';
import { UpdateCategoryDto } from '@shoppie/frontend/type-product';

@Component({
  selector: 'sh-edit-category',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PaneUiComponent,
    ButtonUiComponent,
    FormsModule,
  ],
  templateUrl: './edit-category.smart-component.html',
  styleUrls: ['./edit-category.smart-component.scss'],
})
export class EditCategorySmartComponent {
  public category: UpdateCategoryDto = {
    name: '',
    description: '',
  };
  @ViewChild('form') public form: FormGroup | undefined;
  private readonly facade = inject(FacadeService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly category$ = this.activatedRoute.params.pipe(
    switchMap((p) => this.facade.getCategoryByd(p['categoryId']))
  );

  constructor() {
    this.category$.subscribe((product) => {
      this.category = { ...product };
    });
  }

  public onSubmit(): void {
    if (this.form?.valid) {
      this.facade
        .updateCategory(
          this.activatedRoute.snapshot.params['categoryId'],
          this.category
        )
        .subscribe(() => {
          this.router.navigate(['..'], { relativeTo: this.activatedRoute });
        });
    }
  }

  public onRemove(): void {
    this.facade
      .removeCategory(this.activatedRoute.snapshot.params['categoryId'])
      .subscribe(() => {
        this.router.navigate(['..'], { relativeTo: this.activatedRoute });
      });
  }
}
