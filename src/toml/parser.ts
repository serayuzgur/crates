/**
 * Item is a data structure to define parsed items, hierarchy and index.
 */
export class Item {
  key: string = "";
  values: Array<any> = [];
  value: string | undefined = "";
  start: number = -1;
  end: number = -1;
  constructor(item?: Item) {
    if (item) {
      this.key = item.key;
      this.values = item.values;
      this.value = item.value;
      this.start = item.start;
      this.end = item.end;
    }
  }
}

/**
 * Finds all version items with a flat crate=version pair.
 * @param item Item to search in
 * @param level Level of depth in search.
 */
export function findVersion(item: Item, level: number): Item[] {
  let dependencies: Item[] = [];
  for (let i = 0; i < item.values.length; i++) {
    let value = item.values[i];
    if (value.values.length > 0) {
      dependencies = dependencies.concat(findVersion(value, level + 1));
    } else if (level === 0) {
      dependencies.push(value);
    } else if (value.key === "version") {
      const mock = new Item(value);
      mock.key = item.key;
      dependencies.push(mock);
    }
  }
  return dependencies;
}

/**
 * Filters all dependency related items with a flat crate=version match.
 * @param items
 */
export function filterCrates(items: Item[]): Item[] {
  let dependencies: Item[] = [];
  for (let i = 0; i < items.length; i++) {
    let value = items[i];

    if (value.key.endsWith("dependencies")) {
      dependencies = dependencies.concat(findVersion(value, 0));
    } else {
      const dotIndex = value.key.lastIndexOf(".");
      const wordIndex = dotIndex - 12;
      if (value.key.indexOf("dependencies") === wordIndex) {
        const mock = new Item(value);
        mock.key = value.key.substring(dotIndex + 1);
        dependencies = dependencies.concat(findVersion(mock, 1));
      }
    }
  }
  return dependencies;
}

/**
 *
 * @param data Parse the given document and index all items.
 */
export function parse(data: string): Item {
  let item: Item = new Item();
  item.start = 0;
  item.end = data.length;
  parseTables(data, item);
  return item;
}

/**
 * Parse table level items.
 * @param data
 * @param parent
 */
function parseTables(data: string, parent: Item): Item {
  let item: Item = new Item();
  let i = -1;
  let buff = [];
  let isComment = false;

  while (i++ < data.length) {
    const ch = data.charAt(i);
    if (isWhiteSpace(ch) || isComment) {
      if (ch === "\n") {
        isComment = false;
      }
      continue;
    } else if (ch === "#") {
      isComment = true;
    } else if (ch === "[") {
      item = new Item();
      item.start = i;
      buff = [];
    } else if (ch === "]") {
      item.key = buff.join("");
      i = parseValues(data, item, i);
      item = initNewItem(item, parent, i, buff);
    } else {
      buff.push(ch);
    }
  }

  return parent;
}

/**
 * Parse key=value pairs.
 * @param data
 * @param parent
 * @param index
 */
function parseValues(data: string, parent: Item, index: number): number {
  let i = index;
  let item = new Item();

  let isParsingKey = true;
  let buff: string[] = [];
  let isComment = false;
  while (i++ < data.length) {
    const ch = data.charAt(i);

    if (!isParsingKey && buff.length === 0) { item.start = i; }


    if (isWhiteSpace(ch) || isComment) {
      if (ch === "\n") {
        isComment = false;
      }
      continue;
    } else if (ch === "#") {
      isComment = true;
    } else if (ch === "=") {
      isParsingKey = false;
      item.key = buff.join("");
      buff = [];
    } else if (ch === '"' || ch === "'") {
      i = parseString(data, item, i, ch);
      item = initNewItem(item, parent, i, buff);
      isParsingKey = true;
    } else if (ch === "{") {
      i = parseValues(data, item, i);
      item = initNewItem(item, parent, i, buff);
    } else if (ch === "}") {
      item = initNewItem(item, parent, i, buff);
      isParsingKey = true;
      return i;
    } else if (ch === "[") {
      if (isParsingKey) {
        i--;
        break;
      }
      i = parseArray(data, item, i);
      item = initNewItem(item, parent, i, buff);
      isParsingKey = true;
    } else if (ch === "]") {
      // item = clearVars(item, parent, i, buff);
      i--;
      break;
    } else {
      buff.push(ch);
    }
  }

  return i;
}

/**
 * Parse array elements.
 * @param data
 * @param parent
 * @param index
 */
function parseArray(data: string, parent: Item, index: number): number {
  let i = index;
  let item = new Item();
  let buff: string[] = [];
  let isComment = false;
  while (i++ < data.length) {
    const ch = data.charAt(i);

    if (buff.length === 0) { item.start = i; }

    if (ch === " " || ch === "\n" || ch === "\t" || ch === "," || isComment) {
      if (ch === "\n") {
        isComment = false;
      }
      continue;
    } else if (ch === "#") {
      isComment = true;
    } else if (ch === '"' || ch === "'") {
      item.start = i;
      i = parseString(data, item, i, ch);
      item = initNewItem(item, parent, i, buff);
    } else if (ch === "{") {
      i = parseValues(data, item, i);
      item = initNewItem(item, parent, i, buff);
    } else if (ch === "}") {
      item = initNewItem(item, parent, i, buff);
      return i;
    } else if (ch === "[") {
      i = parseValues(data, item, i);
      item = initNewItem(item, parent, i, buff);
    } else if (ch === "]") {
      item = initNewItem(item, parent, i, buff);
      break;
    } else {
      buff.push(ch);
    }
  }

  return i;
}

/**
 * Parse string
 * @param data
 * @param item
 * @param index
 * @param opener
 */
function parseString(
  data: string,
  item: Item,
  index: number,
  opener: string,
): number {
  let i = index;
  let buff: string[] = [];
  while (i++ < data.length) {
    const ch = data.charAt(i);
    switch (ch) {
      case '"':
      case "'":
        if (ch === opener) {
          item.value = buff.join("");
          return i;
        }
      default:
        buff.push(ch);
    }
  }
  return i;
}

/**
 * Reset some values
 * @param item
 * @param parent
 * @param i
 * @param buff
 */
function initNewItem(item: Item, parent: Item, i: number, buff: Array<string>) {
  if (item.start !== -1) {
    item.end = i+1;
    parent.values.push(item);
  }
  buff.length = 0;
  return new Item();
}

function isWhiteSpace(ch: string) {
  return ch === " " || ch === "\n" || ch === "\r" || ch === "\t";
}
