import { TextEditor, TextEditorDecorationType, workspace, DecorationOptions, DecorationInstanceRenderOptions } from "vscode";
import { StatusBar } from "./status-bar";
import Dependency from "../core/Dependency";
import decoration, { latestVersion } from "./decoration";

export let decorationHandle: TextEditorDecorationType;

/**
 *
 * @param editor Takes crate info and editor. Decorates the editor.
 * @param dependencies
 */
export default function decorate(editor: TextEditor, dependencies: Array<Dependency>) {
  const pref = loadPref();

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
      let decor = decoration(
        editor,
        dependency.item,
        dependency.versions || [],
        JSON.parse(JSON.stringify(pref)),
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
  if (decorationHandle) {
    decorationHandle.dispose();
  }
  decorationHandle = latestVersion("VERSION");
  editor.setDecorations(decorationHandle, options);

  if (errors.length) {
    StatusBar.setText("Error", `Completed with errors
${errors.join('\n')}`);
  } else {
    StatusBar.setText("Info");
  }
}


function loadPref() {
  const config = workspace.getConfiguration("");
  const compatibleDecoratorText = config.get<string>("crates.compatibleDecorator") ?? "";
  let compatibleDecoratorCss = config.get<DecorationInstanceRenderOptions>("crates.compatibleDecoratorCss") ?? {};
  const errorText = config.get<string>("crates.errorDecorator");
  let errorDecoratorCss = config.get<DecorationInstanceRenderOptions>("crates.errorDecoratorCss") ?? {};
  const incompatibleDecoratorText = config.get<string>("crates.incompatibleDecorator") ?? "";
  let incompatibleDecoratorCss = config.get<DecorationInstanceRenderOptions>("crates.incompatibleDecoratorCss") ?? {};
  const errorDecoratorText = errorText ? errorText + "" : "";
  if(compatibleDecoratorCss.after == undefined) {
    compatibleDecoratorCss.after = {}
  }
  if(incompatibleDecoratorCss.after == undefined) {
    incompatibleDecoratorCss.after = {}
  }
  if(errorDecoratorCss.after == undefined) {
    errorDecoratorCss.after = {}
  }
  compatibleDecoratorCss.after.contentText = compatibleDecoratorText;
  incompatibleDecoratorCss.after.contentText = incompatibleDecoratorText;
  errorDecoratorCss.after.contentText = errorDecoratorText;

  return {
    compatibleDecoratorCss: compatibleDecoratorCss,
    incompatibleDecoratorCss: incompatibleDecoratorCss,
    errorDecoratorCss: errorDecoratorCss
  };
}

