import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { URLSearchParams } from '@angular/http';

import { FlotComponent } from '../../flot/flot.component';

import { AppService } from '../../../app.service';
import { AppState } from '../../../app.state';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit {
  @Input() height: string;
  @Input() width: string;
  @ViewChild('chart') chart: FlotComponent;
  public data: any[] = [];
  public options = {
    series: {
      pie: {
        show: true
      },
      hoverable: true
    },
    legend: {
      show: true,
      position: "se",
      labelFormatter: function(label, series) {

      }
    },

    grid: {
      hoverable: true,
      clickable: true
    }
  };



  subscriptions: Subscription[] = [];

  constructor(private service: AppService, private state: AppState) {
  }

  ngOnInit() {



    this.subscriptions.push(this.state.searchSubject.subscribe(
      (resp) => {
        if (resp['type'] === 'home') {
          if (resp['state'] === 'start') {
            //          this.facets = null  ;
            //          this.results = [];
          } else {
            this.setData(resp['res']);
          }
        }
      }
        ));

//    this.subscriptions.push(this.state.stateChangedSubject.subsc    ribe(
//      ()     => {
//        if(this.data.length     > 0){
//          this.setDa    ta();
//            }
//          }
//    ));

    this.options.legend.labelFormatter = this.formatLabel.bind(this);
    this.data = [];
    this.chart.setData(this.data);
    if (this.state.config) {
      this.getData();
    } else {
      this.subscriptions.push(this.service.langSubject.subscribe(
        () => {
          this.getData();
        }
      ));
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

  formatLabel(label, series) {
    return this.service.translateKey('stav.' + label);
  }

  onClick(item) {
    //console.log(item);
    console.log('Stav: ' + item['series']['label']);
  }

  setData(res) {
    this.data = [];
    let stavy = res["facet_counts"]["facet_fields"]['stav'];
    for (let i in stavy) {
      let stav = stavy[i];
      this.data.push({ label: stav[0], data: stav[1] })
    }
    this.chart.setData(this.data);
  }


  getData() {

    let params: URLSearchParams = new URLSearchParams();
    params.set('q', '*');
    params.set('facet', 'true');
    params.set('facet.field', 'stav');
    params.set('facet.limit', '-1');
    params.set('facet.mincount', '1');
    params.set('rows', '0');
    this.data = [];
    //    this.service.search(params).subscribe(res => {
    //      let stavy = res["facet_counts"]["facet_fields"]['stav'];
    //      for (let i in stavy) {
    //        let stav = stavy[i];
    //        this.data.push({ label: stav[0], data: stav[1]})
    //      }
    //      this.chart.setData(this.data);
    //    });
    this.service.search(params);
  }

}
