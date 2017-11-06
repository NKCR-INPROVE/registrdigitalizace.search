import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import {MzModalService} from 'ng2-materialize';
import {LinkListComponent} from '../link-list/link-list.component';

import { AppService } from '../../app.service';
import { AppState } from '../../app.state';

declare var tinymce: any;


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];

  menu: any = null;
  selected: string = 'help';
  visibleChanged: boolean = false;
  saved: boolean = false;

  text: string;
  elementId: string = 'editEl';

  editor;

  ngOnInit() {
  }
  

  showLinkList() {
    //console.log(this.editor.selection.getNode());
    let selected = "";
    let node: Element = this.editor.selection.getNode();
    if(node.hasAttribute('routerlink')){
      selected = node.getAttribute('routerlink');
    }
    
    let links = [];
    for(let i in this.menu['files']){
      links.push(this.menu['files'][i]);
    }
    for(let i in this.menu['dirs'][0]['files']){
      links.push('info/' + this.menu['dirs'][0]['files'][i]);
    }
    this.modalService.open(LinkListComponent, {state: this.state, links: links, selected: selected});
    //this.dir['files'].push('newpage');
  }
  
  selectLink(link: string){
    let node: Element = this.editor.selection.getNode();
    if(node.hasAttribute('routerlink')){
      node.setAttribute('routerlink', link);
    } else if(node.hasAttribute('href')){
      node.setAttribute('routerlink', link);
      node.removeAttribute('href');
    } else if(this.editor.selection.getContent().length == 0){
      let ret = ' <a routerLink="'+link+'">'+ link+'</a> ';
      this.editor.insertContent(ret);
    } else {
      let ret = '<a routerLink="'+link+'">'+ this.editor.selection.getContent()+'</a>';
      this.editor.insertContent(ret);
    }
  }

  constructor(
    private modalService: MzModalService,
    public state: AppState,
    private service: AppService) { }

  ngAfterViewInit() {
    var ctx = this.state.config ? this.state.config['context'] : '/';
    var that = this;
    tinymce.init({
      selector: '#' + this.elementId,
      menubar: false,
      plugins: ['link', 'paste', 'table', 'save', 'code', 'image'],
      toolbar: 'save | undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | code nglink',
      
      theme: "modern",
      content_css: ctx + 'assets/editor.css',
      body_class: 'underlined',
      skin_url: 'assets/skins/light',
      //images_upload_url: 'img?action=UPLOAD&id=' + this.selected,
      
      images_upload_handler: function (blobInfo, success, failure) {
        var xhr: XMLHttpRequest;
        var formData;
        xhr = new XMLHttpRequest();
        xhr.withCredentials = false;
        xhr.open('POST', 'img?action=UPLOAD&id=' + that.selected);
        xhr.onload = function() {
          var json;

          if (xhr.status != 200) {
            failure('HTTP Error: ' + xhr.status);
            return;
          }
          json = JSON.parse(xhr.responseText);

          if (!json || typeof json.location != 'string') {
            failure('Invalid JSON: ' + xhr.responseText);
            return;
          }
          success(json.location);
        };
        formData = new FormData();
        //formData.append('file', blobInfo.blob(), fileName(blobInfo));
        console.log(blobInfo.filename(), blobInfo.name());
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        xhr.send(formData);
      },

      file_picker_callback: function(cb, value, meta) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('name', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = function() {
          var file = this['files'][0];

          var reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = function() {
            var id = 'blobid' + (new Date()).getTime();
            var blobCache = tinymce.activeEditor.editorUpload.blobCache;
            var base64 = reader.result.split(',')[1];
            var blobInfo = blobCache.create(id, file, base64);
            blobCache.add(blobInfo);

            // call the callback and populate the Title field with the file name
            cb(blobInfo.blobUri(), { title: file.name });
          };
        };

        input.click();
      },
      //valid_elements: 'a[routerLink|*]',


      file_browser_callback_types: 'file image media',
      setup: editor => {
        editor.addButton('nglink', {
          text: 'Internal link',
          icon: false,
          onclick: () => {
            this.showLinkList();
          }
        });
        //editor.schema.addValidElements('a[attr=routerLink');
        this.editor = editor;
        this.initData();
      },
      save_oncancelcallback: function() { console.log('Save canceled'); },
      save_onsavecallback: () => this.save()
    });
  }

  initData() {

    if (this.state.config) {
      this.fillMenu();
    } else {
      this.subscriptions.push(this.state.configSubject.subscribe(val => {
        this.fillMenu();
      }));
    }

    this.subscriptions.push(this.service.langSubject.subscribe(val => {
      this.getText();
    }));

    this.subscriptions.push(this.state.adminChanged.subscribe(val => {
      this.select();
    }));

    this.subscriptions.push(this.state.linkSelected.subscribe(val => {
      this.selectLink(val);
    }));
  }


  ngOnDestroy() {
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
    tinymce.remove(this.editor);
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
    
        let s = this.menu['name'] + '/' + this.menu['files'][0]; 
        this.state.setSelectAdminItem(s);
        //this.selected = 
        //this.getText();
      });
    
  }

  getText() {
    this.service.getText(this.selected).subscribe(t => {
      this.text = t;
      this.editor.schema.addValidElements('a[routerLink|*]');
      this.editor.schema.addValidElements('a[fragment|*]');
      this.editor['settings']['images_upload_url'] = 'img?action=UPLOAD&name=' + this.selected;
      this.editor.setContent(this.text);
      
      //console.log(this.editor.settings);
      //images_upload_url: 'img?action=UPLOAD&name=' + this.selected,
    });
  }

  select() {
    this.selected = this.state.selectAdminItem;
    this.saved = false;
    this.getText();
  }

  save() {

    const content = this.editor.getContent();
    
    this.service.saveText(this.selected, content).subscribe(res => {
      console.log(res);
      this.saved = !res.hasOwnProperty('error');
    });
  }

  changeVisible() {
    this.visibleChanged = true;
    //console.log(this.menu);
  }

}
