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

import { fetchedDepsMap, getFetchedDependency } from "../core/listener";
import { checkVersion } from "../semver/semverUtils";

import { RE_VERSION, RE_FEATURES, findCrate, findCrateAndVersion } from "../toml/parser";

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
    if (!fetchedDepsMap) return;

    const match = document
      .lineAt(position)
      .text.match(RE_VERSION);
    if (match) {
      const crate = match[1] === "version" ? findCrate(document, position.line) : match[1];
      if (!crate) return;

      const version = match[7] ?? match[5];

      const fetchedDep = getFetchedDependency(document, crate, position);
      if (!fetchedDep || !fetchedDep.versions) return;

      const versionStart = match[1].length + match[2].length + (match[3]?.length ?? 0) + 1;
      const versionEnd = versionStart + version.length;

      if (
        !new Range(
          new Position(position.line, versionStart),
          new Position(position.line, versionEnd)
        ).contains(position)
      )
        return;

      if (version.trim().length !== 0) {
        const filterVersion = version
          .substr(0, versionStart - position.character)
          .toLowerCase();

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

    const featuresMatch = line.text.match(RE_FEATURES);
    if (featuresMatch) {
      let crate;
      let version;
      const versionMatch = line.text.match(RE_VERSION);
      if (versionMatch) {
        crate = versionMatch[1];
        version = versionMatch[7] ?? versionMatch[5];
      } else {

        const match = findCrateAndVersion(document, position.line);
        if (!match) return;
        [crate, version] = match;
      }

      const fetchedDep = getFetchedDependency(document, crate, position);
      if (!fetchedDep || !fetchedDep.featureCompletionItems || !fetchedDep.versions) return;

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
