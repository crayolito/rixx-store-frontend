import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawerCarrito } from './drawer-carrito';

describe('DrawerCarrito', () => {
  let component: DrawerCarrito;
  let fixture: ComponentFixture<DrawerCarrito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerCarrito]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrawerCarrito);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
