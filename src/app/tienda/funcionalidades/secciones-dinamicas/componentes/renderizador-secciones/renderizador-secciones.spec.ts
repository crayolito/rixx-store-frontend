import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenderizadorSecciones } from './renderizador-secciones';

describe('RenderizadorSecciones', () => {
  let component: RenderizadorSecciones;
  let fixture: ComponentFixture<RenderizadorSecciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenderizadorSecciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenderizadorSecciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
