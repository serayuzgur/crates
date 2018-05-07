/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import { TextEditor, TextEditorDecorationType } from "vscode";
import { parse } from "toml";
import { statusBarItem } from "../ui/indicators";
import decorators from "../ui/decorations";
import { dependencies } from "./decorations";

let decoration: TextEditorDecorationType;

function parseAndDecorate(editor: TextEditor) {
  const { fileName } = editor.document;

  console.log("Parsing... ", fileName);
  statusBarItem.setText("Fetching crates.io");
  const text = editor.document.getText();
  console.log("Parsing OK : ", fileName);
  try {
    dependencies(editor, parse(text)["dependencies"], options => {
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
      statusBarItem.show();
      parseAndDecorate(editor);
    } else {
      statusBarItem.hide();
    }
  } else {
    console.log("No active editor found.");
  }
}
