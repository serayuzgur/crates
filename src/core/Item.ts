/**
 * Item is a data structure to define parsed items, hierarchy and index.
 */
export default class Item {
  key: string = "";
  values: Array<Item> = [];
  value: string | undefined = "";
  registry?: string;
  start: number = -1;
  end: number = -1;
  constructor(item?: Item) {
    if (item) {
      this.key = item.key;
      this.values = item.values;
      this.value = item.value;
      this.registry = item.registry;
      this.start = item.start;
      this.end = item.end;
    }
  }
}