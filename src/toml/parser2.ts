import { TextDocument } from "vscode";
import Item from "../core/Item";

export const RE_VERSION = /^[ \t]*(?<!#)(\S+?)([ \t]*=[ \t]*)(?:({.*?version[ \t]*=[ \t]*)("|')(.*?)\4|("|')(.*?)\6)/;
export const RE_FEATURES = /^[ \t]*(?<!#)((?:[\S]+?[ \t]*=[ \t]*.*?{.*?)?features[ \t]*=[ \t]*\[[ \t]*)(.+?)[ \t]*\]/;

const RE_TABLE_HEADER = /^[ \t]*(?!#)[ \t]*\[[ \t]*(.+?)[ \t]*\][ \t]*$/;
const RE_TABLE_HEADER_DEPENDENCY = /^(?:.+?\.)?(?:dev-)?dependencies(?:\.([^.]+?))?$/;
export function findCrate(document: TextDocument, line: number): string | undefined {
  while (--line >= 0) {
    const match = document.lineAt(line).text.match(RE_TABLE_HEADER);
    if (!match) continue;
    return match[1].match(RE_TABLE_HEADER_DEPENDENCY)?.[1];
  }
}

export function findCrateAndVersion(
  document: TextDocument,
  line: number
): [string, string] | undefined {
  let crate;
  let version;

  var i = line;
  while (!crate && --i >= 0) {
    const lineText = document.lineAt(i).text;
    const match = lineText.match(RE_TABLE_HEADER);
    if (!match) {
      if (!version) {
        let versionMatch = lineText.match(RE_VERSION);
        if (versionMatch && versionMatch[1] === "version") {
          version = versionMatch[7];
        }
      }
    } else {
      crate = match[1].match(RE_TABLE_HEADER_DEPENDENCY)?.[1];
    }
  }

  var i = line;
  while (!version && ++i < document.lineCount) {
    const lineText = document.lineAt(i).text;
    const match = lineText.match(RE_TABLE_HEADER);
    if (!match) {
      if (!version) {
        let versionMatch = lineText.match(RE_VERSION);
        if (versionMatch && versionMatch[1] === "version") {
          version = versionMatch[7];
        }
      }
    } else {
      return;
    }
  }

  if (crate && version) {
    return [crate, version];
  }
}

/**
 * Finds all version items with a flat crate=version pair.
 * @param item Item to search in
 */
function findVersion(item: Item): Item[] {
  let dependencies: Item[] = [];
  for (const field of item.values) {
    if (field.key.endsWith(".workspace")) continue;
    if (field.values.length > 0) {
      const dependency = findVersionTable(field);
      if (dependency) dependencies.push(dependency);
    } else if (field.value != null) {
      dependencies.push(field);
    }
  }
  return dependencies;
}

function findVersionTable(table: Item): Item | null {
  let item = null;
  let itemName = null;
  for (const field of table.values) {
    if (field.key === "workspace") return null;
    if (field.key === "version") {
      item = new Item(field);
      item.key = table.key;
    }
    if (field.key === "package") itemName = field.value;
  }
  if (item && itemName) item.key = itemName;
  return item;
}

/**
 * Filters all dependency related items with a flat crate=version match.
 * @param items
 */
export function filterCrates(items: Item[]): Item[] {
  let dependencies: Item[] = [];
  for (let i = 0; i < items.length; i++) {
    let value = items[i];

    if (!value.key.startsWith("package.metadata") && value.key.endsWith("dependencies")) {
      dependencies = dependencies.concat(findVersion(value));
    } else {
      const dotIndex = value.key.lastIndexOf(".");
      const wordIndex = dotIndex - 12;
      if (value.key.indexOf("dependencies") === wordIndex) {
        const mock = new Item(value);
        mock.key = value.key.substring(dotIndex + 1);
        const dependency = findVersionTable(mock);
        if (dependency) dependencies.push(dependency);
      }
    }
  }
  return dependencies;
}

/**
 *
 * @param data Parse the given document and index all items.
 */
export function parse2(data: string): Item {
  let item: Item = new Item();
  item.start = 0;
  item.end = data.length;
  const asArr = Array.from(data);
  parseTables(asArr, item);
  return item;
}

/**
 * Parse table level items.
 * @param data
 * @param parent
 */
function parseTables(data: string[], parent: Item): Item {
  let item: Item = new Item();
  let i = -1;
  let length = data.length;

  while (i++ < length) {
    const ch = data[i];
    if (isWhiteSpace(ch) || isNewLine(ch)) {
      continue;
    } else if (isComment(ch)) {
      i = skipLineData(data, i);
    } else if (ch === "[") {
      item = new Item();
      item.start = i;
    } else if (ch === "]") {
      item.setKey(data.slice(item.start + 1, i));
      i = parseValues(data, item, i);
      item = initNewItem(item, parent, i);
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
function parseValues(data: string[], parent: Item, index: number): number {
  let i = index;
  let item = new Item();
  let last_ch = "";

  let isParsingKey = true;
  while (i++ < data.length) {
    const ch = data[i];
    let current_line = "";
    if (isNewLine(last_ch)) {
      current_line = getLine(data, i);
    }
    last_ch = ch;

    if (isWhiteSpace(ch) || isNewLine(ch) || isComma(ch)) {
      continue;
    } else if (isComment(ch) || isGitConflictLine(current_line) || isDisabledLine(current_line)) {
      i = skipLineData(data, i);
    } else if (isParsingKey) {
      if (ch === "[") {
        return --i;
      } else if (ch === "}") {
        return i;
      }
      i = parseKey(data, item, i);
      isParsingKey = false;
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
    } else if (isNumber(data, i)) {
      i = parseNumber(data, item, i);
      item = initNewItem(item, parent, i);
      isParsingKey = true;
    }
  }
  return i;
}

function isCratesDep(i: Item): boolean {
  if (i.values && i.values.length) {
    for (let j = 0; j < i.values.length; j++) {
      const value = i.values[j];
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
function isSkipChar(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === ',';
}

function parseArray(data: string[], parent: Item, index: number): number {
  let i = index;
  let item = new Item();
  while (i++ < data.length) {
    const ch = data[i];
    if (isSkipChar(ch)) {
      continue;
    } else if (isComment(ch)) {
      i = skipLineData(data, i);
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
function parseString(data: string[], item: Item, index: number, opener: string): number {
  let i = index;
  item.start = index;
  let buff: string[] = [];
  let multiline = data[i] === opener && data[i + 1] === opener && data[i + 2] === opener;
  if (multiline) {
    i += 2;
  }
  while (i++ < data.length) {
    const ch = data[i];
    switch (ch) {
      case '"':
      case "'":
        if (ch === opener && (!multiline || (data[i + 1] === opener && data[i + 2] === opener))) {
          if (multiline) {
            i += 2;
          }
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
 * Skip data until '\n'
 * @param data
 * @param index
 */
function skipLineData(data: string[], index: number): number {
  const newlineIndex = data.indexOf("\n", index);
  if (newlineIndex !== -1) {
    return newlineIndex;
  }
  return data.length;
}

/**
 * Get current line data
 * @param data
 * @param index
 */
function getLine(data: string[], index: number): string {
  let i = index;
  let line: string[] = [];
  while (i < data.length) {
    const ch = data[i];
    if (isNewLine(ch)) {
      return line.join("");
    }
    line.push(ch);
    i++;
  }
  return line.join("");
}

/**
 * Parse key
 * @param data
 * @param item
 * @param index
 */
function parseKey(data: string[], item: Item, index: number): number {
  let i = index;
  item.start = index;
  while (i < data.length) {
    const ch = data[i];
    if (ch === "=") {
      item.setKey(data.slice(item.start, i));
      return i;
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
function parseBoolean(data: string[], item: Item, index: number, opener: string): number {
  const ch = data[index];
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
 * Parse number
 * @param data
 * @param item
 * @param index
 * @param opener
 */
function parseNumber(data: string[], item: Item, index: number): number {
  const ch = data[index];
  if (ch === "+" || ch === "-") {
    index++;
  }
  let i = index;
  item.start = index;
  while (i < data.length) {
    const ch = data[i];
    switch (ch) {
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case ".":
        break;
      default:
        if (isNewLine(ch)) {
          item.value = data.slice(item.start, i).join("");
          item.end = i;
          return i;
        }
    }
    i++;
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

function isComment(ch: string) {
  return ch === "#";
}

function isBoolean(data: string[], i: number) {
  const val = data.slice(i, i + 4).join();
  return val === "true" || val === "fals";
}

function isNumber(data: string[], i: number) {
  const ch = data[i];
  return ch === "+" || ch === "-" || !isNaN(parseInt(ch, 10));
}

function isGitConflictLine(line: string) {
  const firstChar = line[0];
  if (firstChar === '<') {
    return line.startsWith("<<<<<<<");
  } else if (firstChar === '=') {
    return line.startsWith("=======");
  } else if (firstChar === '>') {
    return line.startsWith(">>>>>>>");
  }
  return false;
}

function isDisabledLine(line: string) {
  return /#crates:disable-check\s*$/.test(line);
}

const TOML = {
  TRUE: ["t", "r", "u", "e"],
  FALSE: ["f", "a", "l", "s", "e"],
  CONFLICT_START: ["<", "<", "<", "<", "<"],
  CONFLICT_END: [">", ">", ">", ">", ">"],
  CONFLICT_EQUAL: ["=", "=", "=", "=", "="],
};
