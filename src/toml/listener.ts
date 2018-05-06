/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import { TextEditor } from "vscode";
import { parse } from "toml";
import { statusBarItem } from "../ui/indicators";
import decorators from "../ui/decorations";

import { dependencies } from "./decorations";

export default function(editor: TextEditor | undefined): void {
  if (editor) {
    const { fileName } = editor.document;
    if (fileName.toLocaleLowerCase().endsWith(".toml")) {
      console.debug("TOML file activated. Parsing... ", fileName);
      statusBarItem.show();
      statusBarItem.setText("Fetching crates.io");
      const text = editor.document.getText();
      console.debug("Parsing OK : ", fileName);
      try {
        dependencies(editor, parse(text)["dependencies"], result => {
          editor.setDecorations(decorators.latestVersion("VERSION"), result);
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      statusBarItem.hide();
    }
  }
}
