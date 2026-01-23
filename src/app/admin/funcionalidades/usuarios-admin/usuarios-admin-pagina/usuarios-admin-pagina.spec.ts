import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuariosAdminPagina } from './usuarios-admin-pagina';

describe('UsuariosAdminPagina', () => {
  let component: UsuariosAdminPagina;
  let fixture: ComponentFixture<UsuariosAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuariosAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
