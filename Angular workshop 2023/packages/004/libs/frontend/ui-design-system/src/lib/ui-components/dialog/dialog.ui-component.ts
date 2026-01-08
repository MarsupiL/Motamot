import { AfterViewInit, Component, EventEmitter, inject, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonUiComponent } from "../button/button.ui-component";
import { CdkPortal, PortalModule } from "@angular/cdk/portal";
import { Overlay, OverlayConfig, OverlayModule } from "@angular/cdk/overlay";

@Component({
  selector: 'sh-dialog',
  standalone: true,
  imports: [CommonModule, OverlayModule, PortalModule, ButtonUiComponent],
  templateUrl: './dialog.ui-component.html',
  styleUrls: ['./dialog.ui-component.scss'],
})
export class DialogUiComponent implements AfterViewInit, OnDestroy {
  // Tell the parent to destroy the component
  @Output() public readonly closeDialog = new EventEmitter<void>();

  private readonly overlay = inject(Overlay);
  // get a grasp on the ng-template with the cdkPortal directive
  @ViewChild(CdkPortal) public readonly portal: CdkPortal | undefined;
  private readonly overlayConfig = new OverlayConfig({
    // show backdrop
    hasBackdrop: true,
    // position the dialog in the center of the page
    positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    // when in the dialog, block scrolling of the page
    scrollStrategy: this.overlay.scrollStrategies.block(),
    minWidth: 500,
  });
  private overlayRef = this.overlay.create(this.overlayConfig);

  constructor() {
    this.overlayRef?.backdropClick()
      .subscribe(() => {
        this.closeDialog.emit();
      });
  }

  public ngAfterViewInit(): void {
    // Wait until the view is initialized to attach the portal to the overlay
    this.overlayRef?.attach(this.portal);
  }

  public ngOnDestroy(): void {
    // parent destroys this component, this component destroys the overlayRef
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
  }
}
