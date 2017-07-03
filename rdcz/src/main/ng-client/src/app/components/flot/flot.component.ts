
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
  
  public setSelection(sel){
    //{xaxis:{from: this.ranges[0], to:this.ranges[1]}
    this.plot.setSelection(sel);
    window.event.preventDefault();
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
        _this.selecting = true;
        _this.onSelection.emit(ranges);
      });
      
      this.plotArea.bind("plotclick", function (event, pos, item) {
        if(item && !_this.selecting){
          _this.onClick.emit(item);
        }
        _this.selecting = false;
        
      });
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
