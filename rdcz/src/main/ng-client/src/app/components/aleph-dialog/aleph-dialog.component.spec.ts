import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlephDialogComponent } from './aleph-dialog.component';

describe('AlephDialogComponent', () => {
  let component: AlephDialogComponent;
  let fixture: ComponentFixture<AlephDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AlephDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlephDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
