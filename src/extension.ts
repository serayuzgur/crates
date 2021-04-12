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
  DocumentSelector,
} from "vscode";
import tomlListener from "./core/listener";
import TomlCommands from "./toml/commands";
import QuickActions from "./providers/quickActions";
import { VersionCompletions, FeaturesCompletions } from "./providers/autoCompletion";
import { quickFillListener } from "./providers/quickFill";

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
        quickFillListener(e);
      }
    }),

    // When the text document is saved, search for "?" versions and replace with the latest
    workspace.onDidSaveTextDocument((document: TextDocument) => {
      if (window.activeTextEditor?.document == document && document.languageId === "toml") {
        tomlListener(window.activeTextEditor, true);
      }
    }),

    // Register our Quick Actions provider
    languages.registerCodeActionsProvider(
      documentSelector,
      new QuickActions(),
      { providedCodeActionKinds: [CodeActionKind.QuickFix] }
    ),

    // Register our versions completions provider
    languages.registerCompletionItemProvider(
      documentSelector,
      new VersionCompletions(),
      "'", '"', ".", "+", "-",
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
    ),

    // Register our features auto completions provider
    languages.registerCompletionItemProvider(
      documentSelector,
      new FeaturesCompletions(),
      "'", '"'
    ),
  );

  tomlListener(window.activeTextEditor);

  // Add commands
  context.subscriptions.push(TomlCommands.replaceVersion);
}

export function deactivate() {}
