import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricasAdminPagina } from './metricas-admin-pagina';

describe('MetricasAdminPagina', () => {
  let component: MetricasAdminPagina;
  let fixture: ComponentFixture<MetricasAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricasAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricasAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
