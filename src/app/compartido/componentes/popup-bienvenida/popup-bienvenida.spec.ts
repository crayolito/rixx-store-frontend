import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupBienvenida } from './popup-bienvenida';

describe('PopupBienvenida', () => {
  let component: PopupBienvenida;
  let fixture: ComponentFixture<PopupBienvenida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupBienvenida]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupBienvenida);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
