import { TextDocument } from "vscode";
import Item from "../core/Item";
import { AlternateRegistry } from "../core/AlternateRegistry";

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
    if (field.key.endsWith(".workspace") || field.key.endsWith(".path")) continue;
    if (field.values.length > 0) {
      const dependency = findVersionTable(field);
      if (dependency) dependencies.push(dependency);
    } else if (field.value != null) {
      if (field.key.endsWith(".version")) field.key = field.key.replace(".version", "");
      dependencies.push(field)
    }
  }
  return dependencies;
}

function findVersionTable(table: Item): Item | null {
  let item = null
  let itemName = null;
  let itemRegistry = undefined;
  for (const field of table.values) {
    if (field.key === "workspace" || field.key === "path") return null;
    if (field.key === "version") {
      item = new Item(field);
      item.key = table.key;
    }
    if (field.key === "package") itemName = field.value;
    if (field.key === "registry") itemRegistry = field.value;
  }
  if (item && itemName) item.key = itemName;
  if (item && itemRegistry !== undefined) item.registry = itemRegistry;
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
 * Parse config.toml to extract alternate registries.
 * @param configTomlContent 
 * @returns 
 */
export function parseAlternateRegistries(configTomlContent: string): AlternateRegistry[] {
  const toml = parse(configTomlContent);
  let alternateRegistries: AlternateRegistry[] = [];
  for (let value of toml.values) {
    if (value.key.startsWith("registries.")) {
      addRegistry(value, alternateRegistries);
    } else if (value.key == "registries") {
      for (let registry of value.values) {
        addRegistry(registry, alternateRegistries);
      }
    }
  }
  return alternateRegistries
}

/**
 * Add `registry` to `alternateRegistries` array, search its index and token.
 * Return nothing, as we update `alternateRegistries` reference.
 * @param registry 
 * @param alternateRegistries 
 */
function addRegistry(registry: Item, alternateRegistries: AlternateRegistry[]) {
  const name = registry.key.replace("registries.", "");
  const index = registry.values.find(({ key }) => key === "index")?.value?.replace("sparse+", "");
  const token = registry.values.find(({ key }) => key === "token")?.value;
  alternateRegistries.push(new AlternateRegistry(name, index, token));
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
    } else if (isComment(ch)) {
      i = skipLineData(data, i);
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
  let last_ch = "";

  let isParsingKey = true;
  while (i++ < data.length) {
    const ch = data.charAt(i);
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
    for (let value of i.values) {
      if (value.key === "git" || value.key === "path") {
        return false;
      } else if (value.key === "package" && value.value !== undefined) {
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
function parseString(data: string, item: Item, index: number, opener: string): number {
  let i = index;
  item.start = index;
  let buff: string[] = [];
  let multiline = data.substring(i, i + 3) === opener.repeat(3);
  if (multiline) {
    i += 2;
  }
  while (i++ < data.length) {
    const ch = data.charAt(i);
    switch (ch) {
      case '"':
      case "'":
        if (ch === opener && (!multiline || data.substring(i, i + 3) === opener.repeat(3))) {
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
function skipLineData(data: string, index: number): number {
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
 * Get current line data
 * @param data
 * @param index
 */
function getLine(data: string, index: number): string {
  let i = index;
  let line: string = "";
  while (i < data.length) {
    const ch = data.charAt(i);
    if (isNewLine(ch)) {
      return line;
    }
    line += ch;
    i++;
  }
  return line;
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
function parseBoolean(data: string, item: Item, index: number, opener: string): number {
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
 * Parse number
 * @param data
 * @param item
 * @param index
 * @param opener
 */
function parseNumber(data: string, item: Item, index: number): number {
  const ch = data.charAt(index);
  if (ch === "+" || ch === "-") {
    index++;
  }
  let i = index;
  item.start = index;
  let buff: string[] = [];
  while (i < data.length) {
    const ch = data.charAt(i);
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
        buff.push(ch);
        break;
      default:
        if (isNewLine(ch)) {
          item.value = buff.join("");
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

function isBoolean(data: string, i: number) {
  return data.substring(i, i + 4) === "true" || data.substring(i, i + 5) === "false";
}

function isNumber(data: string, i: number) {
  const ch = data.charAt(i);
  if (ch === "+" || ch === "-") {
    return true;
  }
  return parseInt(data.charAt(i), 10);
}

function isGitConflictLine(line: string) {
  return line.startsWith("<<<<<<<") || line.startsWith(">>>>>>>") || line.startsWith("=======");
}

function isDisabledLine(line: string) {
  return line.replace(/\s/g, '').endsWith("#crates:disable-check");
}
