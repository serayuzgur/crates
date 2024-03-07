import { Range } from "vscode";

/**
 * Item is a data structure to define parsed items, hierarchy and index.
 */
export default class Item {
  key: string = "";
  values: Array<any> = [];
  value: string | undefined = "";
  start: number = -1;
  end: number = -1;
  line: number = -1;
  range: Range = new Range(0, 0, 0, 0);
  decoRange: Range = new Range(0, 0, 0, 0);
  constructor(item?: Item) {
    if (item) {
      this.key = item.key;
      this.values = item.values;
      this.value = item.value;
      this.start = item.start;
      this.end = item.end;
      this.line = item.line;
      this.decoRange = item.decoRange;
    }
  }
}
