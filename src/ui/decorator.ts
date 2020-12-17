import { TextEditor, TextEditorDecorationType, workspace, DecorationOptions } from "vscode";
import { statusBarItem } from "./indicators";
import Dependency from "../core/Dependency";
import decoration, { latestVersion } from "./decoration";

export let decorationHandle: TextEditorDecorationType;


/**
 *
 * @param editor Takes crate info and editor. Decorates the editor.
 * @param dependencies
 */
export default function decorate(editor: TextEditor, dependencies: Array<Dependency>) {
  if (decorationHandle) {
    decorationHandle.dispose();
  }
  const pref = loadPref(editor);

  const errors: Array<string> = [];
  const filtered = dependencies.filter((dep: Dependency) => {
    if (dep && !dep.error && (dep.versions && dep.versions.length)) {
      return dep;
    } else if (!dep.error) {
      dep.error = dep.item.key + ": " + "No versions found";
    }
    errors.push(`${dep.error}`);
    return dep;
  });
  const options: DecorationOptions[] = [];

  for (let i = filtered.length - 1; i > -1; i--) {
    const dependency: Dependency = filtered[i];
    try {
      const decor = decoration(
        editor,
        dependency.item,
        dependency.versions || [],
        pref.compatibleDecorator,
        pref.incompatibleDecorator,
        pref.errorDecorator,
        dependency.error,
      );
      if (decor) {
        options.push(decor);
      }
    } catch (e) {
      console.error(e);
      errors.push(`Failed to build build decorator (${dependency.item.value})`);
    }
  }
  decorationHandle = latestVersion("VERSION");
  editor.setDecorations(decorationHandle, options);

  if (errors.length) {
    statusBarItem.setText("⚠️ Completed with errors");
  } else {
    statusBarItem.setText("OK");
  }
}


function loadPref(editor: TextEditor) {
  const config = workspace.getConfiguration("", editor.document.uri);
  const compatibleDecorator = config.get<string>("crates.compatibleDecorator") ?? "";
  const incompatibleDecorator = config.get<string>("crates.incompatibleDecorator") ?? "";
  const errorText = config.get<string>("crates.errorDecorator");
  const errorDecorator = errorText ? errorText + "" : "";
  return {
    compatibleDecorator,
    incompatibleDecorator,
    errorDecorator,
  }
}

