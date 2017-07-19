import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FacetsHomeComponent } from './facets-home.component';

describe('FacetsHomeComponent', () => {
  let component: FacetsHomeComponent;
  let fixture: ComponentFixture<FacetsHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FacetsHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FacetsHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
