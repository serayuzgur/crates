/**
 * Commands related to TOML files.
 */
import { commands, TextEditor, TextEditorEdit, Range } from "vscode";
import tomlListener from "../core/listener";

export interface ReplaceItem {
  item: string;
  start: number;
  end: number;
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
        console.log("Replacing", info.item);
        edit.replace(
          new Range(
            editor.document.positionAt(info.start + 1),
            editor.document.positionAt(info.end - 1),
          ),
          info.item.substr(1, info.item.length - 2),
        );
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
            editor.document.positionAt(rItem.start),
            editor.document.positionAt(rItem.end),
          ),
          rItem.item,
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
