/**
 * Commands related to TOML files.
 */
import { commands, TextEditor, TextEditorEdit, Range } from "vscode";

export const replaceVersion = commands.registerTextEditorCommand(
  "crates.replaceVersion",
  (editor: TextEditor, edit: TextEditorEdit, info) => {
    if (editor && info) {
      const { fileName } = editor.document;
      if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
        console.log("Replacing", info.item);
        edit.replace(
          new Range(
            editor.document.positionAt(info.start),
            editor.document.positionAt(info.end),
          ),
          info.item,
        );
      }
    }
  },
);

export default { replaceVersion };
