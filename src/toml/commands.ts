/**
 * Commands related to TOML files.
 */
import { commands, TextEditor, TextEditorEdit, Range } from "vscode";

export const status = { inProgress: false };

export const replaceVersion = commands.registerTextEditorCommand(
  "crates.replaceVersion",
  (editor: TextEditor, edit: TextEditorEdit, info) => {
    if (editor && info && !status.inProgress) {
      const { fileName } = editor.document;
      if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
        status.inProgress = true;
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
