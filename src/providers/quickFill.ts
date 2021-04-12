import { TextEditor, Range, TextDocumentChangeEvent, window } from "vscode";
import Dependency from "../core/Dependency";
import Item from "../core/Item";
import { findCrateAndVersion, RE_VERSION } from "../toml/parser";
import { fetchedDepsMap, getFetchedDependency } from "../core/listener";

export async function quickFillDependencies(
  editor: TextEditor,
  dependencies: Item[],
  fetchedDeps: Dependency[]
) {
  if (dependencies.length === 0 || fetchedDeps.length === 0) return;
  await editor.edit((edit) => {
    for (let i = 0; i < dependencies.length; i++) {
      const dependency = dependencies[i];
      if (dependency.value === "?") {
        const fetchedDep = fetchedDeps[i];
        if (!fetchedDep.versions || fetchedDep.versions?.length === 0) return;

        // Make sure we update the value of the Dependency as well.
        dependency.value = fetchedDep.versions[0];

        edit.replace(
          new Range(
            editor.document.positionAt(dependency.start + 1),
            editor.document.positionAt(dependency.end - 1)
          ),
          fetchedDep.versions[0]
        );
      }
    }
  });
}

export async function quickFillListener(e: TextDocumentChangeEvent) {
  if (!fetchedDepsMap) return;
  if (
    e.contentChanges.length === 1 &&
    e.contentChanges[0].text === "?" &&
    e.contentChanges[0].range.isSingleLine
  ) {
    const contentChange = e.contentChanges[0];
    const editor = window.activeTextEditor!;
    const line = contentChange.range.start.line;

    const versionMatch = editor.document.lineAt(line).text.match(RE_VERSION);

    let crate: string;
    let version: string;
    if (versionMatch) {
      crate = versionMatch[1];
      version = versionMatch[7] ?? versionMatch[5];
    } else {
      const match = findCrateAndVersion(editor.document, line);
      if (!match) return;
      [crate, version] = match;
    }

    if (version === "?") {
      const fetchedDep = getFetchedDependency(
        editor.document,
        crate,
        contentChange.range.start
      );
      if (
        !fetchedDep ||
        !fetchedDep.versions ||
        fetchedDep.versions.length === 0
      )
        return;

      await window.activeTextEditor!.edit(
        (edit) => {
          // Make sure we update the value of the Dependency as well.
          fetchedDep.item.value = fetchedDep.versions![0];

          edit.replace(
            contentChange.range.start.character ===
              contentChange.range.end.character
              ? contentChange.range.with(
                  undefined,
                  contentChange.range.end.translate(0, 1)
                )
              : contentChange.range.with(
                undefined,
                contentChange.range.start.translate(0, 1)
              ),
            fetchedDep.item.value
          );
        },
        {
          undoStopBefore: false,
          undoStopAfter: true,
        }
      );
    }
  }
}
