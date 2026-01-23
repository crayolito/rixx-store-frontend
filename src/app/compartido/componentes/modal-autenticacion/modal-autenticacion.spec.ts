import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAutenticacion } from './modal-autenticacion';

describe('ModalAutenticacion', () => {
  let component: ModalAutenticacion;
  let fixture: ComponentFixture<ModalAutenticacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAutenticacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAutenticacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
