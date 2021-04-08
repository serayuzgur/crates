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
const RE_FEATURES_AUTO_COMPLETE = /^[ \t]*(?<!#)([\S]+?)([ \t]*=[ \t]*.*?{.*?features[ \t]*=[ \t]*\[[ \t]*)(.+?)[ \t]*\]/;

const alphabet = "abcdefghijklmnopqrstuvwxyz";
export function sortText(i: number): string {
  // This function generates an appropriate alphabetic sortText for the given number.
  const columns = Math.floor(i / alphabet.length);
  const letter = alphabet[i % alphabet.length];
  return "z".repeat(columns) + letter;
}

export class VersionCompletions implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
    _context: CompletionContext
  ): ProviderResult<CompletionItem[] | CompletionList> {
    if (!fetchedDepsMap) return [];

    const line = document.lineAt(position);

    const match = line.text.match(RE_VERSION_AUTO_COMPLETE);
    if (match) {
      const crate = match[1];
      const version = match[7] ?? match[5];

      const fetchedDep = fetchedDepsMap.get(crate);
      if (!fetchedDep || !fetchedDep.versions) return;

      const versionStart = crate.length + match[2].length + (match[3]?.length ?? 0) + 1;
      const versionEnd = versionStart + version.length;

      if (version.trim().length !== 0) {
        const filterVersion = version.toLowerCase();

        const range = new Range(
          new Position(position.line, versionStart),
          new Position(position.line, versionEnd)
        );

        let i = 0;
        return new CompletionList(
          fetchedDep.versions
            .filter((version) =>
              version.toLowerCase().startsWith(filterVersion)
            )
            .map((version) => {
              const item = new CompletionItem(
                version,
                CompletionItemKind.Class
              );
              item.range = range;
              item.preselect = i === 0;
              item.sortText = sortText(i++);
              return item;
            }),
          true
        );
      } else if (position.character !== versionEnd + 1) {
        // Fixes the edge case where auto completion comes up for version = ""|
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
    if (!fetchedDepsMap) return [];

    const line = document.lineAt(position);

    const featuresMatch = line.text.match(RE_FEATURES_AUTO_COMPLETE);
    const versionMatch = line.text.match(RE_VERSION_AUTO_COMPLETE);
    if (featuresMatch && versionMatch) {
      const crate = featuresMatch[1];
      const version = versionMatch[7] ?? versionMatch[5];

      const fetchedDep = fetchedDepsMap.get(crate);
      if (!fetchedDep || !fetchedDep.featureCompletionItems || !fetchedDep.versions) return;

      const featuresArray = featuresMatch[3];
      const featuresRange = new Range(
        new Position(position.line, crate.length + featuresMatch[2].length),
        new Position(position.line, crate.length + featuresMatch[2].length + featuresArray.length)
      );

      if (!featuresRange.contains(position)) return;

      const maxSatisfying = checkVersion(version, fetchedDep.versions)[1] ?? version;
      return fetchedDep.featureCompletionItems.get(maxSatisfying);
    }
  }
}
