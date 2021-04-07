"use strict";
/**
 * This extension helps to manage crate dependency versions.
 */
import {
  window,
  workspace,
  ExtensionContext,
  TextDocumentChangeEvent,
  TextDocument,
  languages,
  CodeActionKind,
} from "vscode";
import tomlListener from "./core/listener";
import TomlCommands from "./toml/commands";
import QuickActions from "./providers/quickActions";
import AutoCompletions from "./providers/autoCompletion";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    // Add active text editor listener and run once on start.
    window.onDidChangeActiveTextEditor(tomlListener),

    // When the text document is changed, fetch + check dependencies
    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
      const { fileName } = e.document;
      if (
        !e.document.isDirty &&
        fileName.toLocaleLowerCase().endsWith("cargo.toml")
      ) {
        tomlListener(window.activeTextEditor);
      }
    }),

    // When the text document is saved, search for "?" versions and replace with the latest
    workspace.onDidSaveTextDocument((document: TextDocument) => {
      if (window.activeTextEditor?.document == document) {
        tomlListener(window.activeTextEditor, true);
      }
    }),

    // Register our Quick Actions provider
    languages.registerCodeActionsProvider(
      { language: "toml", pattern: "**/[Cc]argo.toml" },
      new QuickActions(),
      { providedCodeActionKinds: [CodeActionKind.QuickFix] }
    ),

    // Register our auto completions provider
    languages.registerCompletionItemProvider(
      { language: "toml", pattern: "**/[Cc]argo.toml" },
      new AutoCompletions(),
      "'", '"', ".", "+", "-",
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
    )
  );

  tomlListener(window.activeTextEditor);

  // Add commands
  context.subscriptions.push(TomlCommands.replaceVersion);
}

export function deactivate() {}
