import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutTienda } from './layout-tienda';

describe('LayoutTienda', () => {
  let component: LayoutTienda;
  let fixture: ComponentFixture<LayoutTienda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutTienda]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutTienda);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
