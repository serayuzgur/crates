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
  DocumentSelector,
  commands,
} from "vscode";
import tomlListener from "./core/listener";
import TomlCommands from "./toml/commands";
import { VersionCompletions } from "./providers/autoCompletion";

export function activate(context: ExtensionContext) {
  const documentSelector: DocumentSelector = { language: "toml", pattern: "**/[Cc]argo.toml" };

  context.subscriptions.push(
    // Add active text editor listener and run once on start.
    window.onDidChangeActiveTextEditor(tomlListener),

    // When the text document is changed, fetch + check dependencies
    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
      const { fileName } = e.document;
      if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
        if (!e.document.isDirty) {
          tomlListener(window.activeTextEditor);
        }
      }
    }),


    // Register our versions completions provider
    languages.registerCompletionItemProvider(
      documentSelector,
      new VersionCompletions(),
      "'", '"', ".", "+", "-",
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
    ),

    // TODO:  Register our Quick Actions provider
    // languages.registerCodeActionsProvider(
    //   documentSelector,
    //   new QuickActions(),
    //   { providedCodeActionKinds: [CodeActionKind.QuickFix] }
    // ),
    // TODO: Register our features auto completions provider
    // languages.registerCompletionItemProvider(
    //   documentSelector,
    //   new FeaturesCompletions(),
    //   "'", '"'
    // ),
  );
  const welcomeDisposable = commands.registerCommand(
    'welcome-view-content-sample.hello',
    async () => {
      window.showInformationMessage('Hello world!');
    }
  );

  tomlListener(window.activeTextEditor);

  // Add commands
  context.subscriptions.push(TomlCommands.replaceVersion);
  context.subscriptions.push(welcomeDisposable);
}

export function deactivate() { }
