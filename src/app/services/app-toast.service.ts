import { Injectable } from '@angular/core';
import { ToasterComponent, ToasterPlacement } from '@coreui/angular';

import { AppToastComponent } from '../components/app-toast/app-toast.component';

export type ToastKind = 'success' | 'danger' | 'info' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class AppToastService {
  private toaster?: ToasterComponent;

  registerToaster(toaster: ToasterComponent): void {
    this.toaster = toaster;
  }

  clearToaster(toaster: ToasterComponent): void {
    if (this.toaster === toaster) {
      this.toaster = undefined;
    }
  }

  success(message: string, title = 'Success'): void {
    this.show('success', title, message);
  }

  error(message: string, title = 'Error'): void {
    this.show('danger', title, message);
  }

  info(message: string, title = 'Info'): void {
    this.show('info', title, message);
  }

  private show(kind: ToastKind, title: string, message: string): void {
    if (!this.toaster) {
      // Fallback to avoid losing feedback if host isn't mounted yet.
      // eslint-disable-next-line no-alert
      alert(message);
      return;
    }

    const componentRef = this.toaster.addToast(
      AppToastComponent,
      {
        title,
        message,
        color: kind,
        autohide: true,
        delay: 4000,
        placement: ToasterPlacement.TopEnd,
      },
      {}
    );

    componentRef.instance['visibleChange']?.emit(true);
  }
}
