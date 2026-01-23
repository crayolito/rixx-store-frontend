import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilleteraUsuario } from './billetera-usuario';

describe('BilleteraUsuario', () => {
  let component: BilleteraUsuario;
  let fixture: ComponentFixture<BilleteraUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilleteraUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilleteraUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
