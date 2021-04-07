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
} from "vscode";
import tomlListener from "./core/listener";
import TomlCommands from "./toml/commands";

export function activate(context: ExtensionContext) {
  // Add active text editor listener and run once on start.
  context.subscriptions.push(window.onDidChangeActiveTextEditor(tomlListener));

  context.subscriptions.push(
    // When the text document is changed, fetch + check dependencies
    workspace.onDidChangeTextDocument((e:TextDocumentChangeEvent) => {
      const { fileName } = e.document;
      if (!e.document.isDirty && fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
        tomlListener(window.activeTextEditor);
      }
    }),

    // When the text document is saved, search for "?" versions and replace with the latest
    workspace.onDidSaveTextDocument((document:TextDocument) => {
      if (window.activeTextEditor?.document == document) {
        tomlListener(window.activeTextEditor, true);
      }
    })
  );

  tomlListener(window.activeTextEditor);

  // Add commands
  context.subscriptions.push(TomlCommands.replaceVersion);
}

export function deactivate() {}
