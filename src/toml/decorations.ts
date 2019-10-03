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
import { satisfies } from "semver";

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
  upToDateDecorator: string,
  latestDecorator: string,
): DecorationOptions {
  // Also handle json valued dependencies

  const start = item.start;
  const end = item.end;
  const currentVersion = item.value;
  const hasLatest = satisfies(versions[0], currentVersion || "0.0.0");

  const hoverMessage = new MarkdownString(`**Available Versions**`);
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
    const encoded = encodeURI(JSON.stringify(replaceData));
    const command = `[${version}](command:crates.replaceVersion?${encoded})`;
    hoverMessage.appendMarkdown("\n * ");
    hoverMessage.appendMarkdown(command);
  }

  const latestText = latestDecorator.replace("${version}", versions[0]);
  const contentText = hasLatest ? upToDateDecorator : latestText;

  const deco = {
    range: new Range(
      editor.document.positionAt(start),
      editor.document.positionAt(end),
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
  const upToDateChar = config.get("crates.upToDateDecorator");
  const latestText = config.get("crates.latestDecorator");
  const upToDateDecorator = upToDateChar ? upToDateChar + "" : "";
  const latestDecorator = latestText ? latestText + "" : "";
  const options: DecorationOptions[] = [];

  for (let i = dependencies.length - 1; i > -1; i--) {
    const dependency: Dependency = dependencies[i];
    const decor = decoration(
      editor,
      dependency.item,
      dependency.versions,
      upToDateDecorator,
      latestDecorator,
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
