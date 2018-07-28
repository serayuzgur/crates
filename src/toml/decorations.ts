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

export const latestVersion = (text: string) =>
  window.createTextEditorDecorationType({
    after: {
      contentText: text,
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
): DecorationOptions {
  // Also handle json valued dependencies

  const start = item.start;
  const end = item.end;
  const currentVersion = item.value;
 
  const hasLatest =
    versions[0] === currentVersion ||
    versions[0].indexOf(`${currentVersion}.`) === 0;

  const hoverMessage = new MarkdownString(`**Available Versions**`);
  hoverMessage.isTrusted = true;
  versions.map(version => {
    const replaceData = JSON.stringify({
      item: `"${version}"`,
      start,
      end,
    });

    const command = `[${version}](command:crates.replaceVersion?${encodeURI(
      replaceData,
    )})`;
    hoverMessage.appendMarkdown("\n * ");
    hoverMessage.appendMarkdown(command);
  });

  return {
    range: new Range(
      editor.document.positionAt(start),
      editor.document.positionAt(end),
    ),
    hoverMessage,
    renderOptions: {
      after: {
        contentText: hasLatest ? upToDateDecorator : `Latest: ${versions[0]}`,
      },
    },
  };
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
  const upToDateDecorator = upToDateChar ? upToDateChar + "" : "";
  const options: DecorationOptions[] = [];

  dependencies.map((dependency: Dependency) => {
    const decor = decoration(
      editor,
      dependency.item,
      dependency.versions,
      upToDateDecorator,
    );
    if (decor) {
      options.push(decor);
    }
  });
  const lastVerDeco = latestVersion("VERSION");
  editor.setDecorations(lastVerDeco, options);
  return lastVerDeco;
}

export default {
  decorate,
};
