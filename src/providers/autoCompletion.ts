import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionList,
  Position,
  ProviderResult,
  Range,
  TextDocument,
} from "vscode";

import { fetchedDepsMap } from "../core/listener";
import { checkVersion } from "../semver/semverUtils";

const RE_VERSION_AUTO_COMPLETE = /^[ \t]*(?<!#)(\S+?)([ \t]*=[ \t]*)(?:({.*?version[ \t]*=[ \t]*)("|')(.*?)\4|("|')(.*?)\6)/;
const RE_FEATURES_AUTO_COMPLETE = /^[ \t]*(?<!#)((?:[\S]+?[ \t]*=[ \t]*.*?{.*?)?features[ \t]*=[ \t]*\[[ \t]*)(.+?)[ \t]*\]/;

const alphabet = "abcdefghijklmnopqrstuvwxyz";
export function sortText(i: number): string {
  // This function generates an appropriate alphabetic sortText for the given number.
  const columns = Math.floor(i / alphabet.length);
  const letter = alphabet[i % alphabet.length];
  return "z".repeat(columns) + letter;
}

const RE_TABLE_HEADER = /^[ \t]*(?!#)[ \t]*\[[ \t]*(.+?)[ \t]*\][ \t]*$/;
const RE_TABLE_HEADER_DEPENDENCY = /^(?:.+?\.)?dependencies(?:\.([^.]+?))?$/;
function findCrate(document: TextDocument, line: number): string | undefined {
  while (--line >= 0) {
    const match = document.lineAt(line).text.match(RE_TABLE_HEADER);
    if (!match) continue;
    return match[1].match(RE_TABLE_HEADER_DEPENDENCY)?.[1];
  }
}

function findCrateAndVersion(document: TextDocument, line: number): [string, string] | undefined {
  let crate;
  let version;

  var i = line;
  while (!crate && --i >= 0) {
    const lineText = document.lineAt(i).text;
    const match = lineText.match(RE_TABLE_HEADER);
    if (!match) {
      if (!version) {
        let versionMatch = lineText.match(RE_VERSION_AUTO_COMPLETE);
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
        let versionMatch = lineText.match(RE_VERSION_AUTO_COMPLETE);
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

export class VersionCompletions implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
    _context: CompletionContext
  ): ProviderResult<CompletionItem[] | CompletionList> {
    if (!fetchedDepsMap) return;

    const match = document
      .lineAt(position)
      .text.match(RE_VERSION_AUTO_COMPLETE);
    if (match) {
      const tabledHeaderCrateName = findCrate(document, position.line);
      if (tabledHeaderCrateName && match[1] !== "version") return;
      const crate = tabledHeaderCrateName ?? match[1];

      const version = match[7] ?? match[5];

      const fetchedDep = fetchedDepsMap.get(crate);
      if (!fetchedDep || !fetchedDep.versions) return;

      const versionStart = match[1].length + match[2].length + (match[3]?.length ?? 0) + 1;
      const versionEnd = versionStart + version.length;

      if (version.trim().length !== 0) {
        const filterVersion = version.substr(0, versionStart - position.character).toLowerCase();

        const range = new Range(
          new Position(position.line, versionStart),
          new Position(position.line, versionEnd)
        );

        let i = 0;
        return new CompletionList(
          (filterVersion.length > 0
            ? fetchedDep.versions.filter((version) =>
                version.toLowerCase().startsWith(filterVersion)
              )
            : fetchedDep.versions
          ).map((version) => {
            const item = new CompletionItem(version, CompletionItemKind.Class);
            item.range = range;
            item.preselect = i === 0;
            item.sortText = sortText(i++);
            return item;
          }),
          true
        );
      } else if (position.character !== versionEnd + 1) {
        // Fixes the edge case where auto completion comes up for `version = ""|`
        return fetchedDep.versionCompletionItems;
      }
    }
  }
}

export class FeaturesCompletions implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
    _context: CompletionContext
  ): ProviderResult<CompletionItem[] | CompletionList> {
    if (!fetchedDepsMap) return;

    const line = document.lineAt(position);

    const featuresMatch = line.text.match(RE_FEATURES_AUTO_COMPLETE);
    if (featuresMatch) {
      const match = findCrateAndVersion(document, position.line);
      if (!match) return;
      const [crate, version] = match;

      const fetchedDep = fetchedDepsMap.get(crate);
      if (
        !fetchedDep ||
        !fetchedDep.featureCompletionItems ||
        !fetchedDep.versions
      )
        return;

      const featuresArray = featuresMatch[2];

      const featuresStart = featuresMatch[1].length;
      const featuresEnd = featuresStart + featuresArray.length;

      const featuresRange = new Range(
        new Position(position.line, featuresStart),
        new Position(position.line, featuresEnd)
      );

      if (!featuresRange.contains(position)) return;

      const maxSatisfying = checkVersion(version, fetchedDep.versions)[1] ?? version;
      return fetchedDep.featureCompletionItems.get(maxSatisfying);
    }
  }
}
