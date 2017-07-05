import { Facet } from './facet'
export class FacetField {
  field: string;
  isMultiple: boolean;
  values: Facet[] = [];
  icon: string;
  active:boolean;
  classname:string;
  translate: boolean;
  showOriginal: boolean; 
  sortable: boolean;
}
