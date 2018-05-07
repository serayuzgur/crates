"use strict";
/**
 * This extension helps to manage crate dependency versions.
 */
import { window, workspace, ExtensionContext } from "vscode";
import tomlListener from "./toml/listener";

export function activate(context: ExtensionContext) {
  // Add active text editor listener and run once on start.
  context.subscriptions.push(window.onDidChangeActiveTextEditor(tomlListener));
  workspace.onDidSaveTextDocument(() => {
    tomlListener(window.activeTextEditor);
  });

  tomlListener(window.activeTextEditor);
}

export function deactivate() {}
