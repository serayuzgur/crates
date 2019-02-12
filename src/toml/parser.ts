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

  while (i++ < data.length) {
    const ch = data.charAt(i);
    if (isWhiteSpace(ch) || isNewLine(ch)) {
      continue;
    } else if (ch === "#") {
      i = parseComment(data, i);
    } else if (ch === "[") {
      item = new Item();
      item.start = i;
      buff = [];
    } else if (ch === "]") {
      item.key = buff.join("");
      i = parseValues(data, item, i);
      item = initNewItem(item, parent, i);
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
  while (i++ < data.length) {
    const ch = data.charAt(i);
    if (isWhiteSpace(ch) || isNewLine(ch) || isComma(ch)) {
      continue;
    } else if (ch === "#") {
      i = parseComment(data, i);
    } else if (isParsingKey) {
      if (ch === "[") {
        return --i;
      } else if (ch === "}") {
        return i;
      }
      i = parseKey(data, item, i);
      isParsingKey = false;
    } else if (ch === "#") {
      i = parseComment(data, i);
    } else if (ch === '"' || ch === "'") {
      i = parseString(data, item, i, ch);
      item = initNewItem(item, parent, i);
      isParsingKey = true;
    } else if (ch === "[") {
      i = parseArray(data, item, i);
      item = initNewItem(item, parent, i);
      isParsingKey = true;
    } else if (ch === "{") {
      i = parseValues(data, item, i);
      if (!isCratesDep(item)) {
        item.start = -1;
      }
      item = initNewItem(item, parent, i);
      isParsingKey = true;
    } else if (isBoolean(data, i)) {
      i = parseBoolean(data, item, i, ch);
      item = initNewItem(item, parent, i);
      isParsingKey = true;
    }
  }

  return i;
}

function isCratesDep(i: Item): boolean {
  if (i.values && i.values.length) {
    for (let value of i.values) {
      if (value.key === "git" || value.key === "path") {
        return false;
      } else if (value.key === "package") {
        i.key = value.value;
      }
    }
  }
  return true;
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
  while (i++ < data.length) {
    const ch = data.charAt(i);
    if (isWhiteSpace(ch) || isNewLine(ch) || isComma(ch)) {
      continue;
    } else if (ch === '"' || ch === "'") {
      i = parseString(data, item, i, ch);
      item = initNewItem(item, parent, i);
    } else if (ch === "]") {
      return i;
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
  item.start = index;
  let buff: string[] = [];
  while (i++ < data.length) {
    const ch = data.charAt(i);
    switch (ch) {
      case '"':
      case "'":
        if (ch === opener) {
          item.value = buff.join("");
          item.end = i;
          return i;
        }
      default:
        buff.push(ch);
    }
  }
  return i;
}

/**
 * Parse comment
 * @param data
 * @param index
 */
function parseComment(data: string, index: number): number {
  let i = index;
  while (i++ < data.length) {
    const ch = data.charAt(i);
    if (isNewLine(ch)) {
      return i;
    }
  }
  return i;
}

/**
 * Parse key
 * @param data
 * @param item
 * @param index
 */
function parseKey(data: string, item: Item, index: number): number {
  let i = index;
  let buff: string[] = [];
  item.start = index;
  while (i < data.length) {
    const ch = data.charAt(i);
    if (ch === "=") {
      item.key = buff.join("");
      return i;
    } else if (!isWhiteSpace(ch)) {
      buff.push(ch);
    }
    i++;
  }
  return i;
}

/**
 * Parse boolean
 * @param data
 * @param item
 * @param index
 * @param opener
 */
function parseBoolean(
  data: string,
  item: Item,
  index: number,
  opener: string,
): number {
  const ch = data.charAt(index);
  switch (ch) {
    case "t":
      item.value = "true";
      return index + 3;
    case "f":
      item.value = "false";
      return index + 4;
    default:
      return index;
  }
}

/**
 * Reset some values
 * @param item
 * @param parent
 * @param i
 * @param buff
 */
function initNewItem(item: Item, parent: Item, i: number) {
  if (item.start !== -1) {
    item.end = i + 1;
    parent.values.push(item);
  }
  return new Item();
}

function isWhiteSpace(ch: string) {
  return ch === " " || ch === "\t";
}
function isNewLine(ch: string) {
  return ch === "\n" || ch === "\r";
}

function isComma(ch: string) {
  return ch === ",";
}

function isBoolean(data: string, i: number) {
  return (
    data.substring(i, i + 4) === "true" || data.substring(i, i + 5) === "false"
  );
}
