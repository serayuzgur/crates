/**
 * Commands related to TOML files.
 */
import { commands, TextEditor, TextEditorEdit, Range } from "vscode";
import tomlListener from "../core/listener";

export interface ReplaceItem {
  value: string;
  range: {
    start: { line: number; character: number; };
    end: { line: number; character: number; };
  };
}

export const status = {
  inProgress: false,
  replaceItems: [] as ReplaceItem[],
};

export const replaceVersion = commands.registerTextEditorCommand(
  "crates.replaceVersion",
  (editor: TextEditor, edit: TextEditorEdit, info: ReplaceItem) => {
    if (editor && info && !status.inProgress) {
      const { fileName } = editor.document;
      if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
        status.inProgress = true;
        console.debug("Replacing", info.value, "at", info.range);
        const range = new Range(
          info.range.start.line,
          info.range.start.character,
          info.range.end.line,
          info.range.end.character,
        );
        edit.replace(range, info.value);
        status.inProgress = false;
      }
    }
  },
);

export const reload = commands.registerTextEditorCommand(
  "crates.retry",
  (editor: TextEditor, edit: TextEditorEdit, info) => {
    if (editor) {
      tomlListener(editor);
    }
  },
);

export const updateAll = commands.registerTextEditorCommand(
  "crates.updateAll",
  (editor: TextEditor, edit: TextEditorEdit) => {
    if (
      editor &&
      !status.inProgress &&
      status.replaceItems &&
      status.replaceItems.length > 0 &&
      editor.document.fileName.toLocaleLowerCase().endsWith("cargo.toml")
    ) {
      status.inProgress = true;
      console.log("Replacing All");
      for (let i = status.replaceItems.length - 1; i > -1; i--) {
        const rItem = status.replaceItems[i];
        edit.replace(
          new Range(
            rItem.range.start.line,
            rItem.range.start.character + 1,
            rItem.range.end.line,
            rItem.range.end.character - 1,
          ),
          rItem.value,
        );
      }
      status.inProgress = false;
      //Sometimes fails at the first time.
      editor.document.save().then(a => {
        if (!a) {
          editor.document.save();
        }
      });
    }
  },
);

export default { replaceVersion };
