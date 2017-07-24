
import {
  Component, ElementRef, Input, Output, OnInit, EventEmitter,
  HostListener, OnChanges, SimpleChanges, ChangeDetectionStrategy
} from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-flot',
  templateUrl: './flot.component.html',
  styleUrls: ['./flot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlotComponent implements OnChanges, OnInit {
  //@Input() dataset: any;
  public data = [];
  @Input() onselection: any;
  @Input() options: any;
  @Input() width: string | number = '100%';
  @Input() height: string | number = 220;

  @Output() onSelection: EventEmitter<any> = new EventEmitter();
  @Output() onClick: EventEmitter<any> = new EventEmitter();

  initialized = false;

  plotArea: any;
  plot: any;

  selecting: boolean = false;

  constructor(private el: ElementRef) { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['option'] && this.initialized) {
      this.draw();
    }
  }

  draw() {
    if (this.initialized) {
      this.plot = $.plot(this.plotArea, this.data, this.options);
    }
  }

  public setData(data) {
    this.data = data;
    this.draw();

  }

  public setSelection(sel) {
    if (this.initialized) {
      this.plot.setSelection(sel);
      window.event.preventDefault();
    }
  }

  private dataAtPos(pos) {
    let item = null;

    let series = this.plot.getData();
    //for (let i = series.length - 1; i >= 0; --i) {
    var s = series[0],
      points = s.datapoints.points,
      
    mx = pos.x;
    var ps = s.datapoints.pointsize;
    var barLeft, barRight;

    switch (s.bars.align) {
      case "left":
        barLeft = 0;
        break;
      case "right":
        barLeft = -s.bars.barWidth;
        break;
      default:
        barLeft = -s.bars.barWidth / 2;
    }

    barRight = barLeft + s.bars.barWidth;

    for (let j = 0; j < points.length; j += ps) {
      var x = points[j], y = points[j + 1], b = points[j + 2];
      //console.log(mx, x,y,b);
      if (x == null)
        continue;

      // for a bar graph, the cursor must be inside the bar
      if (series[0].bars.horizontal ?
        (mx <= Math.max(b, x) && mx >= Math.min(b, x)) :
        (mx >= x + barLeft && mx <= x + barRight))
        item = [0, j / ps];
    }
    //}

    let ret = null;
    if (item) {
      let i = item[0];
      let j = item[1];
      ps = series[0].datapoints.pointsize;

      ret = {
        datapoint: series[0].datapoints.points.slice(j * ps, (j + 1) * ps),
        dataIndex: j,
        series: series[0],
        seriesIndex: i
      };
    }
    return ret;
  }

  public ngOnInit(): void {
    if (!this.initialized) {
      this.plotArea = $(this.el.nativeElement).find('div').empty();
      this.plotArea.css({
        width: this.width,
        height: this.height
      });

      var _this = this;
      this.plotArea.bind("plotselected", function(event, ranges) {
        //console.log('plotselected');
        _this.selecting = true;
        _this.onSelection.emit(ranges);
      });

      this.plotArea.bind("plotclick", function(event, pos, item) {
        //console.log('plotclick');
        if (_this.selecting) {
          _this.selecting = false;;
          return;
        }
        if (item) {
          _this.onClick.emit(item);
        }
        if (!item) {
          let titem = _this.dataAtPos(pos);
          if(titem){
            _this.onClick.emit(titem);
          }
        }
        _this.selecting = false;
      });

//      this.plotArea.bind("plothover", function (event, pos, item) {
//        if(!item){
//          let titem = _this.dataAtPos(pos);
//          if(titem){
//            _this.plot.showTooltip(titem, {
//                                pageX: 0,
//                                pageY: 0
//                            });
//            
//          }
//        }
//      });


      this.initialized = true;
      this.draw();
    }
  }

  //  @HostListener('click') click(event) {
  //    console.log('clicke');
  //  }

  @HostListener('contextmenu') contextmenu(e) {
    console.log(e);
  }


}
