import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionesAdminPagina } from './configuraciones-admin-pagina';

describe('ConfiguracionesAdminPagina', () => {
  let component: ConfiguracionesAdminPagina;
  let fixture: ComponentFixture<ConfiguracionesAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionesAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfiguracionesAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
