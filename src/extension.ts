"use strict";
/**
 * This extension helps to manage crate dependency versions.
 */
import {
  window,
  workspace,
  ExtensionContext,
  TextDocument,
} from "vscode";
import tomlListener from "./toml/listener";
import TomlCommands from "./toml/commands";

export function activate(context: ExtensionContext) {
  // Add active text editor listener and run once on start.
  context.subscriptions.push(window.onDidChangeActiveTextEditor(tomlListener));

  context.subscriptions.push(
    workspace.onDidSaveTextDocument((document: TextDocument) => {
      const { fileName } = document;
      if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
        tomlListener(window.activeTextEditor);
      }
    }),
  );
  tomlListener(window.activeTextEditor);

  // Add commands
  context.subscriptions.push(TomlCommands.replaceVersion);
}

export function deactivate() {}
