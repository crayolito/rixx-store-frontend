import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaPagina } from './categoria-pagina';

describe('CategoriaPagina', () => {
  let component: CategoriaPagina;
  let fixture: ComponentFixture<CategoriaPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
