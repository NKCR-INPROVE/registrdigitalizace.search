import { Component, OnInit, Input, Compiler, NgModuleFactory, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule , Router, Params, NavigationEnd, NavigationStart } from '@angular/router';

@Component({
  selector: 'app-inner-content',
  templateUrl: './inner-content.component.html',
  styleUrls: ['./inner-content.component.scss']
})
export class InnerContentComponent implements OnInit {
  
  dynamicComponent;
  dynamicModule: NgModuleFactory<any>;

  @Input()
  text: string;

  constructor(
  private router: Router,
    private compiler: Compiler) { 
  }
//  
  setText(t: any){
    this.dynamicComponent = this.createNewComponent(t);
    this.dynamicModule = this.compiler.compileModuleSync(this.createComponentModule(this.dynamicComponent));
  }
  
  ngOnInit() {
    
    this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
            const tree =  this.router.parseUrl(this.router.url);
            if (tree.fragment) {
	        const element = document.querySelector("#" + tree.fragment);
	        if (element) { element.scrollIntoView(true); }
            }
         }
    });
    
  }
  
  protected createComponentModule (componentType: any) {
    @NgModule({
      imports: [RouterModule],
      declarations: [
        componentType
      ],
      schemas: [NO_ERRORS_SCHEMA],
      entryComponents: [componentType]
    })
    class RuntimeComponentModule
    {
    }
    // a module for just this Type
    return RuntimeComponentModule;
  }

  protected createNewComponent (text:string) {
    let template = `${text}`;

    @Component({
      selector: 'dynamic-component',
      template: template
    })
    class DynamicComponent implements OnInit{
       text: any;

    ngOnInit() {
       this.text = text;
    }
    }
    return DynamicComponent;
  }

}
