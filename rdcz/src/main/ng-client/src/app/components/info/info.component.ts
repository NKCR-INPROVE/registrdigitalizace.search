import { Component, AfterViewInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AppState } from '../../app.state';
import { AppService } from '../../app.service';
import {InnerContentComponent} from '../inner-content/inner-content.component';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements AfterViewInit {
  
  @ViewChild(InnerContentComponent) inn: InnerContentComponent;
  
  
  menu: any = null;
  subscriptions: Subscription[] = [];
  page: string = 'pages/info';

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    public state: AppState,
    public service: AppService,
    private route: ActivatedRoute) { }

  ngAfterViewInit() {
    this.fillMenu();
    this.loadComponent();
    this.subscriptions.push(this.service.langSubject.subscribe(
      () => {
        this.loadComponent();
      }
    ));
  }
  
  

  fillMenu() {
      this.service.getEditablePages().subscribe(res => {
        //this.menu = res;
        this.menu = {
          "name": "pages",
          "dirs": [{
            "name": "info",
            "dirs": [],
            "files": [
              "exportSKC",
              "index",
              "ccnb",
              "dotaznik2013",
              "relief",
              "statistika",
              "vysvetlivky",
              "napoveda",
              "newpage",
              "prehled",
              "excel",
              "marcxml"
            ]
          }],
          "files": [
            "info",
            "help"
          ]
        };
        
        this.menu = res;
    
      });
    
  }
  
  loadComponent() {
    
    let param = this.route.snapshot.paramMap.get('page');
    if(!param || param === ''){
      this.page = 'pages/info';
    } else {
      this.page = 'pages/info/' + param;
    }
    
    this.service.getText(this.page).subscribe(t => {
//      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(InnerContentComponent);
//      let viewContainerRef = this.inner.viewContainerRef;
//      viewContainerRef.clear();
//      let componentRef = viewContainerRef.createComponent(componentFactory);
//      (<InnerContentComponent>componentRef.instance).setText(t);
      this.inn.setText(t);
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
  }

}
