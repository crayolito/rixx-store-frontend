import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelPrincipalPagina } from './panel-principal-pagina';

describe('PanelPrincipalPagina', () => {
  let component: PanelPrincipalPagina;
  let fixture: ComponentFixture<PanelPrincipalPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelPrincipalPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelPrincipalPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
