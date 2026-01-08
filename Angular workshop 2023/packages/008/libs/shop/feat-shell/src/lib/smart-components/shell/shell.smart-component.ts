import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopbarUiComponent } from '../../ui-components/topbar/topbar.ui-component';

@Component({
  selector: 'sh-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarUiComponent],
  templateUrl: './shell.smart-component.html',
  styleUrls: ['./shell.smart-component.scss'],
})
export class ShellSmartComponent {}
