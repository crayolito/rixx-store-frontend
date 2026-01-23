import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilPagina } from './perfil-pagina';

describe('PerfilPagina', () => {
  let component: PerfilPagina;
  let fixture: ComponentFixture<PerfilPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
