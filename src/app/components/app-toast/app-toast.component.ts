import { Component, forwardRef, input } from '@angular/core';
import {
  ToastBodyComponent,
  ToastCloseDirective,
  ToastComponent,
  ToastHeaderComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-toast',
  templateUrl: './app-toast.component.html',
  styleUrls: ['./app-toast.component.scss'],
  providers: [{ provide: ToastComponent, useExisting: forwardRef(() => AppToastComponent) }],
  imports: [ToastHeaderComponent, ToastBodyComponent, ToastCloseDirective]
})
export class AppToastComponent extends ToastComponent {
  readonly title = input('');
  readonly message = input('');
  readonly closeButton = input(true);
}
