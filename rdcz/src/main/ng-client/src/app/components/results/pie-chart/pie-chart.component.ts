import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { URLSearchParams } from '@angular/http';

import { AppService } from '../../../app.service';
import { AppState } from '../../../app.state';
import { FlotComponent } from '../../flot/flot.component';
import { Filter } from '../../../models/filter';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html'
  //styleUrls: ['./pie-chart.component.scss']
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
    colors: ["#66bb6a", "#ffab40", "#880e4f"],
    legend: {
      show: true,
      position: "se",
      labelFormatter: function(label, series) {
        //console.log(label, series);
      }
    },
    background: {
      color: "#000"
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
          } else {
            this.setData(resp['res']);
          }
        }
      }
    ));
    
    
    this.subscriptions.push(this.service.langSubject.subscribe(
      (resp) => {
        this.chart.setData(this.data);
      }
    ));

    this.options.legend.labelFormatter = this.formatLabel.bind(this);

    this.data = [];
    this.chart.setData(this.data);

    let this_ = this;
    setTimeout(() => {
      jQuery(".legend .legendLabel").each(function(i, row) {
        let stav = jQuery(this).children('span').data('stav');
        jQuery(this).click(() => {
          this_.addFilter(stav);
        });
      });
    }, 1000);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

  formatLabel(label, series) {
    return '<span data-stav="'+label+'">'+ this.service.translateKey('stav.' + label) +
      ' (' + series['data'][0][1] + ')</span>';
  }

  addFilter(val: string) {
    let filter: Filter = new Filter();
    filter.field = 'stav';
    filter.value = val;
    this.state.addFilter(filter);
    this.service.goToResults();
  }

  onClick(item) {
    //console.log(item);
    //console.log('Stav: ' + item['series']['label']);
    this.addFilter(item['series']['label']);
    this.service.goToResults();
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



}
