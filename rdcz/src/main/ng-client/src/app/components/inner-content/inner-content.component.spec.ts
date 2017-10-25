import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InnerContentComponent } from './inner-content.component';

describe('InnerContentComponent', () => {
  let component: InnerContentComponent;
  let fixture: ComponentFixture<InnerContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InnerContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InnerContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
