import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DuplicityComponent } from './duplicity.component';

describe('DuplicityComponent', () => {
  let component: DuplicityComponent;
  let fixture: ComponentFixture<DuplicityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DuplicityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DuplicityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
