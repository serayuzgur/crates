"use strict";
/**
 * This extension helps to manage crate dependency versions.
 */
import {
  window,
  ExtensionContext,
} from "vscode";
import tomlListener from "./toml/listener";

export function activate(context: ExtensionContext) {
  
  // Add active text editor listener and run once on start.
  context.subscriptions.push(window.onDidChangeActiveTextEditor(tomlListener));
  tomlListener(window.activeTextEditor);

}

export function deactivate() {}
