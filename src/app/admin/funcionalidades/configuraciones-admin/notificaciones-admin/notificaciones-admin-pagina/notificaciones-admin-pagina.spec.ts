import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionesAdminPagina } from './notificaciones-admin-pagina';

describe('NotificacionesAdminPagina', () => {
  let component: NotificacionesAdminPagina;
  let fixture: ComponentFixture<NotificacionesAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionesAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificacionesAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
