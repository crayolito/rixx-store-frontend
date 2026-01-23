import { TestBed } from '@angular/core/testing';

import { SeccionesApi } from './secciones-api';

describe('SeccionesApi', () => {
  let service: SeccionesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeccionesApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
