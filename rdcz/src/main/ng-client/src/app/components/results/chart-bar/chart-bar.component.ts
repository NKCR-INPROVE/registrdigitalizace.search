import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { URLSearchParams } from '@angular/http';

import { FlotComponent } from '../../flot/flot.component';

import { AppService } from '../../../app.service';
import { AppState } from '../../../app.state';

@Component({
  selector: 'app-chart-bar',
  templateUrl: './chart-bar.component.html',
  styleUrls: ['./chart-bar.component.scss']
})
export class ChartBarComponent implements OnInit {

  @ViewChild('chart') chart: FlotComponent;
  @Input() height: string;
  @Input() width: string;

  @Output() selChanged: EventEmitter<any> = new EventEmitter();


  public data: any = {};
  public options = {
    series: {
      bars: {
        show: true,
        lineWidth: 1,
        barWidth: 10,
        order: 2
      },
      hoverable: true
    },
    grid: {
      hoverable: true,
      borderWidth: 0,
      color: '#546e7a',
      clickable: true

    },
    selection: {
      mode: 'x'
    },
    tooltip: {
      show: true,                 //false
      content: 'Rok %x (%y)'      //"%s | X: %x | Y: %y"
    },
    colors: ["#ffab40", "#ffab40", "#ffab40"]
  }
  subscriptions: Subscription[] = [];

  ranges = [0, 0];

  constructor(private service: AppService, private state: AppState) {
  }

  ngOnInit() {
    this.data = [{ data: [] }];
    this.chart.setData(this.data);
    this.subscriptions.push(this.state.searchSubject.subscribe(
      (resp) => {
        if (resp['type'] === 'home' || resp['type'] === 'results') {
          if (resp['state'] === 'start') {
            this.data = [{ data: [] }];
            this.chart.setData(this.data);
          } else {
            if (resp['res']["facet_counts"]["facet_ranges"]['rokvyd']) {
              let c = resp['res']["facet_counts"]["facet_ranges"]['rokvyd']['counts'];
              if(c.length > 0){
                this.data = [{ data: c }];
                this.ranges = [
                  Math.max(+c[0][0], this.state.currentOd), 
                  Math.min(this.state.currentDo, +c[c.length-1][0]+10)
                  ];
//                this.ranges = [c[0][0], +c[c.length-1][0]+10];
                this.chart.setData(this.data);
                this.chart.setSelection({xaxis:{from: this.ranges[0], to:this.ranges[1]}});
              }
            }
          }
        }
      }
    ));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

  onSelection(ranges) {
    //    this.state.addRokFilter(Math.floor(ranges['xaxis']['from']), Math.ceil(ranges['xaxis']['to']));
    //    this.service.goToResults();
    this.ranges = [Math.floor(ranges['xaxis']['from']), Math.ceil(ranges['xaxis']['to'])];
  }

  use() {
    this.state.addRokFilter(this.ranges[0], this.ranges[1]);
    this.service.goToResults();
  }

  onClick(item) {
    //console.log('Rok: ' + item['datapoint'][0]);
    this.state.addRokFilter(item['datapoint'][0], item['datapoint'][0]+10);
    this.service.goToResults();
  }


  clear() {
    this.state.removeRokFilter();
    this.service.goToResults();
  }


}