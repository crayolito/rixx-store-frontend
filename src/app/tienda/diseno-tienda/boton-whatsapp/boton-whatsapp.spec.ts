import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotonWhatsapp } from './boton-whatsapp';

describe('BotonWhatsapp', () => {
  let component: BotonWhatsapp;
  let fixture: ComponentFixture<BotonWhatsapp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonWhatsapp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BotonWhatsapp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
