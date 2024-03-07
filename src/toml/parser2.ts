import { Position, Range, TextDocument, TextLine } from "vscode";
import Item from "../core/Item";

/**
 *
 * @param doc Parse the given document and index all items.
 */
export function parse(doc: TextDocument): Item | undefined {
  let items: Item[] = [];
  let isInDepTable = false;
  for (let row = 0; row < doc.lineCount; row++) {
    let line = doc.lineAt(row);
    if (line.isEmptyOrWhitespace) {
      continue;
    }
    if (shouldIgnoreLine(line)) {
      continue;
    }
    if (isDependencyTable(line.text)) {
      isInDepTable = true;
    } else if (isDependencySingle(line.text)) {
      isInDepTable = false;
      const crate = line.text.substring(line.text.lastIndexOf(".") + 1, line.text.indexOf("]"));
      let item = new Item();
      item.key = crate;
      let innerRow = row;
      while (++innerRow < doc.lineCount) {
        line = doc.lineAt(innerRow);
        if (shouldIgnoreLine(line)) {
          continue;
        }
        let pair = parsePair(line.text, innerRow);
        if (pair) {
          switch (pair.key) {
            case "version":
              item.value = pair.value;
              item.start = pair.start;
              item.end = pair.end;
              item.line = innerRow;
              continue;
            case "package":
              item.key = pair.value ?? item.key;
              continue;
            case "features":
            case "default-features":
              continue;
          }
          if (pair.start == -1) {
            break;
          }
          pair.line = innerRow;
          pair.range = new Range(
            new Position(pair.line, pair.start),
            new Position(pair.line, pair.end)
          );
          pair.decoRange = new Range(
            new Position(pair.line, pair.start),
            new Position(pair.line, line.range.end.character)
          );

          items.push(pair);
        } else if (isDependencyTable(line.text) || isDependencySingle(line.text)) {
          break;
        }
        line = doc.lineAt(innerRow);
      }
      item.range = new Range(
        new Position(item.line, item.start),
        new Position(item.line, item.end)
      );
      item.decoRange = new Range(
        new Position(item.line, item.start),
        new Position(item.line, line.text.length)
      );
      row = innerRow - 1;
      items.push(item);
    } else if (isInDepTable) {
      let pair = parsePair(line.text, row);
      if (pair) {
        pair.line = row;

        pair.range = new Range(
          new Position(pair.line, pair.start),
          new Position(pair.line, pair.end)
        );
        pair.decoRange = new Range(
          new Position(pair.line, pair.start),
          new Position(pair.line, line.range.end.character)
        );

        items.push(pair);
      } else {
        isInDepTable = false;
      }
    }
  }

  const result = new Item;
  result.values = items;
  return result;
}

function parsePair(line: string, row: number): Item | undefined {
  const item = new Item();
  let eqIndex = line.indexOf("=");
  if (eqIndex === -1) {
    return undefined;
  }
  row = eqIndex + 1;
  const parts = line.split("=");
  item.key = clearText(parts[0]);
  item.value = clearText(parts[1]);
  if (line.indexOf("{") > -1) {
    // json object
    parsePackage(line, item);
    parseVersion(line, item);
    return item.start > -1 ? item : undefined;
  }
  item.start = line.indexOf(item.value);
  item.end = item.start + item.value.length;
  return item.start > -1 ? item : undefined;
}

function parseVersion(line: string, item: Item) {
  let i = item.start;
  let eqIndex = line.indexOf("version");
  if (eqIndex === -1) {
    return;
  }
  i = eqIndex + 7;
  while (i < line.length) {
    const ch = line[i];
    if (ch === "=") {
      item.start = i;
      parseVersionValue(line, item);
      return;
    }
    i++;
  }
  return;
}
function parseVersionValue(line: string, item: Item) {
  let i = item.start;
  let foundAt = -1;
  while (i++ < line.length) {
    const ch = line[i];
    if (isQuote(ch)) {
      continue;
    }
    if (isWhiteSpace(ch)) {
      if (foundAt > -1) {
        break;
      }
      continue;
    } else if (foundAt > -1)
      continue;
    foundAt = i;
  }
  i--;
  item.value = clearText(line.substring(foundAt, i));
  item.start = foundAt;
  item.end = item.start + item.value.length;

}

function parsePackage(line: string, item: Item) {
  let i = item.start;
  let eqIndex = line.indexOf("package");
  if (eqIndex == -1) {
    return;
  }
  i = eqIndex + 7;

  while (i < line.length) {
    const ch = line[i];
    if (ch === "=") {
      parsePackageValue(line, item, i);
      return;
    }
    i++;
  }
}

function parsePackageValue(line: string, item: Item, start: number) {
  let i = start;
  let foundAt = -1;
  while (i++ < line.length) {
    const ch = line[i];
    if (isWhiteSpace(ch) || isQuote(ch)) {
      if (foundAt > -1) {
        break;
      }
      continue;
    } else if (foundAt > -1)
      continue;
    foundAt = i;
  }
  item.key = line.substring(foundAt, i);
}


function isWhiteSpace(ch: string) {
  return ch === " " || ch === "\t";
}

function isQuote(ch: string) {
  return ch === '"' || ch === "'";
}

function isComment(ch: string) {
  return ch === "#";
}

function isGitConflictLine(line: string) {
  switch (line[0]) {
    case '<':
      return line.startsWith("<<<<<<<");
    case '=':
      return line.startsWith("=======");
    case '>':
      return line.startsWith(">>>>>>>");
    default:
      return false;
  }
}

function isDisabledLine(line: string) {
  return line.includes('crates:') && line.includes('disable-check');
}
function isDependencyTable(line: string): boolean {
  return line.includes("dependencies]");
}

function isDependencySingle(line: string): boolean {
  return line.includes("dependencies.");
}

function shouldIgnoreLine(line: TextLine): boolean {
  if (line.isEmptyOrWhitespace) {
    return true;
  }
  let column = line.firstNonWhitespaceCharacterIndex;
  const firstChar = line.text[column];
  if (isComment(firstChar)) {
    return true;
  }
  if (isDisabledLine(line.text)) {
    return true;
  }
  if (isGitConflictLine(line.text)) {
    return true;
  }
  return false;
}

function clearText(text: string) {
  return text.replace(/"/g, "").replace(/'/g, "").trim();
}

