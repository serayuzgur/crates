/**
 * Helps to manage decorations for the TOML files.
 */
import {
  window,
  workspace,
  DecorationOptions,
  Range,
  TextEditor,
  MarkdownString,
  TextEditorDecorationType,
} from "vscode";

import { Item } from "./parser";
import { Dependency } from "./listener";
import { status, ReplaceItem } from "./commands";
import { completeVersion, versionInfo } from "./semverUtils";

export const latestVersion = (text: string) =>
  window.createTextEditorDecorationType({
    after: {
      margin: "2em",
    },
  });

/**
 * Create a decoration for the given crate.
 * @param editor
 * @param crate
 * @param version
 * @param versions
 */
function decoration(
  editor: TextEditor,
  item: Item,
  versions: string[],
  compatibleDecorator: string,
  incompatibleDecorator: string,
  errorDecorator: string,
  error?: string,
): DecorationOptions {
  // Also handle json valued dependencies

  const start = item.start;
  const endofline = editor.document.lineAt(editor.document.positionAt(item.end)).range.end;
  const decoPosition = editor.document.offsetAt(endofline);
  const end = item.end;
  const currentVersion = completeVersion(item.value);
  const semDiff = versionInfo(item.value, versions[0]);

  const hoverMessage = error ? new MarkdownString(`**${error}**`) : new MarkdownString(`#### Versions`);
  hoverMessage.appendMarkdown(` _( [Check Reviews](https://web.crev.dev/rust-reviews/crate/${item.key.replace(/"/g, "")}) )_`);
  hoverMessage.isTrusted = true;

  if (versions.length > 0) {
    status.replaceItems.push({
      item: `"${versions[0]}"`,
      start,
      end,
    });
  }

  for (let i = 0; i < versions.length; i++) {
    const version = versions[i];
    const replaceData: ReplaceItem = {
      item: `"${version}"`,
      start,
      end,
    };
    const isCurrent = version === currentVersion;
    const encoded = encodeURI(JSON.stringify(replaceData));
    const docs = (i === 0 || isCurrent) ? `[(docs)](https://docs.rs/crate/${item.key}/${version})` : "";
    const command = `${isCurrent ? "**" : ""}[${version}](command:crates.replaceVersion?${encoded})${docs}${isCurrent ? "**" : ""}`;
    hoverMessage.appendMarkdown("\n * ");
    hoverMessage.appendMarkdown(command);
  }

  let latestText = compatibleDecorator.replace("${version}","");
  if (semDiff === "patch") {
    latestText = compatibleDecorator.replace("${version}", versions[0]);
  } else if (semDiff === "minor") {
    latestText = incompatibleDecorator.replace("${version}", versions[0]);

  } else if (semDiff === "major") {
    latestText = incompatibleDecorator.replace("${version}", versions[0]);

  }
  const contentText = error ? errorDecorator :  latestText;

  const deco = {
    range: new Range(
      editor.document.positionAt(start),
      editor.document.positionAt(decoPosition),
    ),
    hoverMessage,
    renderOptions: {
      after: {},
    },
  };
  if (contentText.length > 0) {
    deco.renderOptions.after = { contentText };
  }
  return deco;
}

/**
 *
 * @param editor Takes crate info and editor. Decorates the editor.
 * @param dependencies
 */
export function decorate(
  editor: TextEditor,
  dependencies: Array<Dependency>,
): TextEditorDecorationType {
  const config = workspace.getConfiguration("", editor.document.uri);
  const compatibleDecorator = config.get<string>("crates.compatibleDecorator") ?? "";
  const incompatibleDecorator = config.get<string>("crates.incompatibleDecorator") ?? "";
  const errorText = config.get<string>("crates.errorDecorator");
  const errorDecorator = errorText ? errorText + "" : "";
  const options: DecorationOptions[] = [];

  for (let i = dependencies.length - 1; i > -1; i--) {
    const dependency: Dependency = dependencies[i];
    const decor = decoration(
      editor,
      dependency.item,
      dependency.versions || [],
      compatibleDecorator,
      incompatibleDecorator,
      errorDecorator,
      dependency.error,
    );
    if (decor) {
      options.push(decor);
    }
  }
  const lastVerDeco = latestVersion("VERSION");
  editor.setDecorations(lastVerDeco, options);
  return lastVerDeco;
}



export default {
  decorate,
};
