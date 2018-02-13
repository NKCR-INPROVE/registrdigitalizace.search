import {Component, OnInit, ViewChild, ComponentFactoryResolver} from '@angular/core';
import {Router, ActivatedRoute, NavigationEnd} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../app.state';
import {AppService} from '../../app.service';
import {InnerContentComponent} from '../inner-content/inner-content.component';

@Component({
  selector: 'app-napoveda',
  templateUrl: './napoveda.component.html',
  styleUrls: ['./napoveda.component.scss']
})
export class NapovedaComponent implements OnInit {

  subscriptions: Subscription[] = [];
  @ViewChild(InnerContentComponent) inn: InnerContentComponent;
  constructor(
    public state: AppState,
    public service: AppService) {}

  ngOnInit() {
    this.service.getText('pages/help').subscribe(t => {
      this.inn.setText(t);
    });
  }

}
