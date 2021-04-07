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

const RE_VERSION_AUTO_COMPLETE = /^\s*(\S+?)([ \t]*=[ \t]*)(?:(.*?version[ \t]*=[ \t]*)("|')(.*?)\4|("|')(.*?)\6)/;

const alphabet = "abcdefghijklmnopqrstuvwxyz";
export function sortText(i: number): string {
  const columns = Math.floor(i / alphabet.length);
  const letter = alphabet[i % alphabet.length];
  return "z".repeat(columns) + letter;
}

export default class AutoCompletions implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
    _context: CompletionContext
  ): ProviderResult<CompletionItem[] | CompletionList> {
    if (!fetchedDepsMap) return [];

    const match = document
      .lineAt(position)
      .text.match(RE_VERSION_AUTO_COMPLETE);
    if (match) {
      const crate = match[1];
      var version = match[7] ?? match[5];

      const fetchedDep = fetchedDepsMap.get(crate);
      if (!fetchedDep || !fetchedDep.versions) return;

      if (version.trim().length !== 0) {
        var filterVersion = version.toLowerCase();

        const versionStart = crate.length + match[2].length + (match[3]?.length ?? 0) + 1;
        const versionEnd = versionStart + version.length;

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
      } else {
        return fetchedDep.completionItems;
      }
    }
  }
}
