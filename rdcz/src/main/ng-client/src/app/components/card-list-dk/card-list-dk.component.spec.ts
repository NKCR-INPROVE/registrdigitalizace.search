import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardListDkComponent } from './card-list-dk.component';

describe('CardListDkComponent', () => {
  let component: CardListDkComponent;
  let fixture: ComponentFixture<CardListDkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardListDkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardListDkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
