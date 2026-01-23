import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioPagina } from './inicio-pagina';

describe('InicioPagina', () => {
  let component: InicioPagina;
  let fixture: ComponentFixture<InicioPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
