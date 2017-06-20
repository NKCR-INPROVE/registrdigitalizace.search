import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryAsFilterComponent } from './query-as-filter.component';

describe('QueryAsFilterComponent', () => {
  let component: QueryAsFilterComponent;
  let fixture: ComponentFixture<QueryAsFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueryAsFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryAsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
