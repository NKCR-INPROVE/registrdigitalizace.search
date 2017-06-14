import { Component, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { URLSearchParams } from '@angular/http';

import { FlotComponent } from 'ng2modules-flot/flot.component';

import { AppService } from '../../../app.service';
import { AppState } from '../../../app.state';

@Component({
  selector: 'app-chart-bar',
  templateUrl: './chart-bar.component.html',
  styleUrls: ['./chart-bar.component.scss']
})
export class ChartBarComponent implements OnInit {

  @ViewChild('chart') chart: FlotComponent;
  public dataset: any = [];
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
      color: '#838383',
      clickable: true

    },
    tooltip: true
  };

  subscriptions: Subscription[] = [];

  constructor(private service: AppService, private state: AppState) {
  }

  ngOnInit() {

    this.dataset = [{ data: [[1, 130], [2, 40], [3, 80], [4, 160], [5, 159], [6, 370], [7, 330], [8, 350], [9, 370]] }];
    if (this.state.config) {
      this.getData();
    } else {
      this.subscriptions.push(this.state.stateChangedSubject.subscribe(
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


  getData() {

    let params: URLSearchParams = new URLSearchParams();
    params.set('q', 'rokvyd:[1 TO *]');
    params.set('facet', 'true');
    //params.set('facet.field', 'rokvyd');
    params.set('facet.range', 'rokvyd');
    params.set('facet.range.start', '0');
    params.set('facet.range.end', '2020');
    params.set('facet.range.gap', '10');
    params.set('facet.limit', '-1');
    params.set('facet.mincount', '1');
    this.service.search(params).subscribe(res => {
      //this.dataset = [{ data: res["facet_counts"]["facet_fields"]['rokvyd']}];
      this.dataset = [{ data: res["facet_counts"]["facet_ranges"]['rokvyd']['counts'] }];
    });
  }

}
/*
 * import { Component, ElementRef, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

declare var $: any;

@Component({
    selector: 'flot',
    template: `<div>Loading...</div>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlotComponent implements OnChanges, OnInit {
    @Input() refresh: any;
    @Input() dataset: any;
    @Input() options: any;
    @Input() width: string | number = '100%';
    @Input() height: string | number = 220;

    static initialized = false;

    private plotArea: any;

    constructor(private el: ElementRef) { }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['refresh'] && !changes['refresh'].isFirstChange() && FlotComponent.initialized) {
            $.plot(this.plotArea, this.dataset, this.options);
        }
    }

    public ngOnInit(): void {
        if (!FlotComponent.initialized) {
            this.plotArea = $(this.el.nativeElement).find('div').empty();
            this.plotArea.css({
                width: this.width,
                height: this.height
            });
            $.plot(this.plotArea, this.dataset, this.options);
            FlotComponent.initialized = true;
        }
    }
}
 */