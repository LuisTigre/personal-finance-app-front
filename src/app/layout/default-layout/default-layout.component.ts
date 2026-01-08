import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { Subscription } from 'rxjs';

import { IconDirective } from '@coreui/icons-angular';
import { LockService } from '../../services/lock.service';
import { LockScreenComponent } from '../../components/lock-screen/lock-screen.component';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [
    CommonModule,
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooterComponent,
    DefaultHeaderComponent,
    IconDirective,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective,
    LockScreenComponent
  ]
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public navItems = [...navItems];
  public locked = false;
  private lockSubscription?: Subscription;

  constructor(private lockService: LockService) {}

  ngOnInit(): void {
    // Subscribe to lock state changes
    this.lockSubscription = this.lockService.isLocked$.subscribe(locked => {
      this.locked = locked;
    });
  }

  ngOnDestroy(): void {
    if (this.lockSubscription) {
      this.lockSubscription.unsubscribe();
    }
  }
}
