import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Command,
  Range,
  Selection,
  TextDocument,
  window,
  WorkspaceEdit,
} from "vscode";

import { dependencies, fetchedDeps, parseAndDecorate } from "../core/listener";


export default class QuickActions implements CodeActionProvider {
  async provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    _token: CancellationToken
  ): Promise<(Command | CodeAction)[] | null | undefined> {
    if (context.only && context.only! !== CodeActionKind.QuickFix)
      return Promise.resolve([]);

    if (document.isDirty)
      await parseAndDecorate(window.activeTextEditor!, false, false);

    if (
      !dependencies ||
      !fetchedDeps ||
      dependencies.length === 0 ||
      fetchedDeps.length === 0
    )
      return Promise.resolve([]);

    let isSelection = !range.start.isEqual(range.end);

    let lastTitle: string;
    let edit = new WorkspaceEdit();
    let edits = 0;

    for (let i = 0; i < dependencies.length; i++) {
      const fetchedDep = fetchedDeps[i];
      if (!fetchedDep || !fetchedDep.versions) continue;

      const dependency = dependencies[i];

      // Check that the cursor/selection matches the range of the TOML version string
      const versionRange = new Range(
        document.positionAt(dependency.start),
        document.positionAt(dependency.end)
      );
      if (isSelection) {
        if (!range.contains(versionRange)) continue;
      } else {
        if (!versionRange.contains(range)) continue;
      }

      // It's up to date
      const latestVersion = fetchedDep.versions[0];
      if (dependency.value === latestVersion) continue;

      dependency.value = latestVersion;

      edit.replace(
        document.uri,
        new Range(
          document.positionAt(dependency.start + 1),
          document.positionAt(dependency.end - 1)
        ),
        latestVersion
      );
      edits++;

      lastTitle = `Update ${dependency.key} to ${latestVersion}`;
      if (!isSelection) break;
    }

    switch (edits) {
      case 0:
        return Promise.resolve([]);

      case 1:
        var codeAction = new CodeAction(lastTitle!, CodeActionKind.QuickFix);
        codeAction.edit = edit;
        codeAction.isPreferred = true;
        return Promise.resolve([codeAction]);

      default:
        var codeAction = new CodeAction(
          "Update Dependencies",
          CodeActionKind.QuickFix
        );
        codeAction.edit = edit;
        return Promise.resolve([codeAction]);
    }
  }
}
