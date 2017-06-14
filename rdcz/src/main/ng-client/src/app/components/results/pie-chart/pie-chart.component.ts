import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit {
  public data: any = {};
  public options = {
    series: {
      pie: {
        show: true
      },
      hoverable: true
    },
    grid: {
      hoverable: true,
      borderWidth: 0,
      clickable: true

    },
    tooltip: {
      show: true,                 //false
      content: 'Stav %x (%y)'      //"%s | X: %x | Y: %y"
    }
  };

  constructor() { }

  ngOnInit() {
  }

}
