"use strict";
/**
 * This extension helps to manage crate dependency versions.
 */
import {
  window,
  workspace,
  ExtensionContext,
  TextDocumentChangeEvent,
  languages,
  TextDocument,
  Position,
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  TextEdit,
} from "vscode";
import tomlListener from "./toml/listener";
import TomlCommands from "./toml/commands";
import { Range } from "semver";

export function activate(context: ExtensionContext) {
  // Add active text editor listener and run once on start.
  context.subscriptions.push(window.onDidChangeActiveTextEditor(tomlListener));

  context.subscriptions.push(
    workspace.onDidChangeTextDocument((e:TextDocumentChangeEvent) => {
      const { fileName } = e.document;
      if (!e.document.isDirty && fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
        tomlListener(window.activeTextEditor);
      }
    }),
  );

  languages.registerCompletionItemProvider({ pattern: '**/Cargo.toml' }, {
    async provideCompletionItems (document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        const lineIndex = position.line;
        const { text } = document.lineAt(lineIndex);

        // if (!isInDependenciesSection(document, lineIndex)) {
        //     return;
        // }

        const currentLineReplaceRange = new Range(new Position(lineIndex, 0), new Position(lineIndex, text.length));

        try {
          // get name list from dir recursively
            const { data } = await axios.get(`https://crates.io/api/v1/crates?page=1&per_page=20&q=${text}&sort=`);
            const crates: Crate[] = data.crates;
            return crates.map(mapCrateToCompletionItem(currentLineReplaceRange));
        } catch (err) {
            console.error(err);
        }
    },
    resolveCompletionItem (item: CompletionItem, token: CancellationToken) {
        return item;
    }
});

  tomlListener(window.activeTextEditor);

  // Add commands
  context.subscriptions.push(TomlCommands.replaceVersion);
}

const mapCrateToCompletionItem = (currentLineReplaceRange: Range) => (crate: Crate) => {
  const { description, max_version, name } = crate;
  const item = new CompletionItem(name, CompletionItemKind.Text);
  item.additionalTextEdits = [TextEdit.delete(currentLineReplaceRange)];
  item.insertText = `${name} = "${max_version}"`;
  item.detail = `${max_version}`;
  item.documentation = `${description}`;
  return item;
};

export function deactivate() {}
