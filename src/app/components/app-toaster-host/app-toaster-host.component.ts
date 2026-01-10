import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToasterComponent, ToasterPlacement } from '@coreui/angular';

import { AppToastService } from '../../services/app-toast.service';

@Component({
  selector: 'app-toaster-host',
  templateUrl: './app-toaster-host.component.html',
  styleUrls: ['./app-toaster-host.component.scss'],
  imports: [ToasterComponent, NgClass]
})
export class AppToasterHostComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ToasterComponent) private readonly toaster?: ToasterComponent;

  readonly placement = ToasterPlacement.TopEnd;

  constructor(private readonly toastService: AppToastService) {}

  ngAfterViewInit(): void {
    if (this.toaster) {
      this.toastService.registerToaster(this.toaster);
    }
  }

  ngOnDestroy(): void {
    if (this.toaster) {
      this.toastService.clearToaster(this.toaster);
    }
  }
}
