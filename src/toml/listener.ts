/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import { TextEditor, TextEditorDecorationType } from "vscode";
import { parse } from "toml";
import { statusBarItem } from "../ui/indicators";
import decorators from "../ui/decorations";
import { dependencies } from "./decorations";
import { status } from "./commands";

let decoration: TextEditorDecorationType;

function parseAndDecorate(editor: TextEditor) {
  const { fileName } = editor.document;

  console.log("Parsing... ", fileName);
  statusBarItem.setText("Fetching crates.io");
  const text = editor.document.getText();
  const toml = parse(text);
  const tomlDependencies = toml["dependencies"];

  // parse target dependencies and add to dependencies
  const targets = toml["target"];
  Object.keys(targets).map(key => {
    const target = targets[key];
    if (target.dependencies) {
      Object.keys(target.dependencies).map(
        (key2: any) => (tomlDependencies[key2] = target.dependencies[key2]),
      );
    }
  });
  try {
    dependencies(editor, tomlDependencies, options => {
      if (decoration) {
        decoration.dispose();
      }
      decoration = decorators.latestVersion("VERSION");
      editor.setDecorations(decoration, options);
    });
  } catch (e) {
    console.error(e);
  }
}

export default function(editor: TextEditor | undefined): void {
  if (editor) {
    const { fileName } = editor.document;
    if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
      status.inProgress = true;
      statusBarItem.show();
      parseAndDecorate(editor);
    } else {
      statusBarItem.hide();
    }
    status.inProgress = false;
  } else {
    console.log("No active editor found.");
  }
}
