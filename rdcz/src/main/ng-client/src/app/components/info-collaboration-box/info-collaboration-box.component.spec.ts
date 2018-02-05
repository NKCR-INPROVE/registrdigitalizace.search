import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoCollaborationBoxComponent } from './info-collaboration-box.component';

describe('InfoCollaborationBoxComponent', () => {
  let component: InfoCollaborationBoxComponent;
  let fixture: ComponentFixture<InfoCollaborationBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoCollaborationBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoCollaborationBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
