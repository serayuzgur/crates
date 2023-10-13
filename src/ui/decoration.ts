/**
 * Helps to manage decorations for the TOML files.
 */
import {
  window,
  DecorationOptions,
  Range,
  TextEditor,
  MarkdownString,
} from "vscode";

import { checkVersion } from "../semver/semverUtils";
import Item from "../core/Item";
import { status, ReplaceItem } from "../toml/commands";
import { validRange } from "semver";

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
export default function decoration(
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
  let endofline = editor.document.lineAt(editor.document.positionAt(item.end)).range.end;
  const end = item.end;
  const version = item.value?.replace(",", "");
  const [satisfies, maxSatisfying] = checkVersion(version, versions);

  const formatError = (error: string) => {
    // Markdown does not like newlines in middle of emphasis, or spaces next to emphasis characters.
    const error_parts = error.split('\n');
    const markdown = new MarkdownString("#### Errors ");
    markdown.appendMarkdown("\n");
    // Ignore empty strings
    error_parts.filter(s => s).forEach(part => {
      markdown.appendMarkdown("* ");
      markdown.appendText(part.trim()); // Gets rid of Markdown-breaking spaces, then append text safely escaped.
      markdown.appendMarkdown("\n"); // Put the newlines back
    });
    return markdown;
  };
  let hoverMessage = new MarkdownString();
  let contentText = "";
  if (error) {
    hoverMessage = formatError(error);
    // errorDecorator.replace("${version}", versions[0]);
    contentText = errorDecorator;
  } else {
    hoverMessage.appendMarkdown(`[View Crate](https://crates.io/crates/${item.key.replace(/"/g, "")})`);
    hoverMessage.appendMarkdown("#### Versions");
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
      const isCurrent = version === maxSatisfying;
      const encoded = encodeURI(JSON.stringify(replaceData));
      const docs = (i === 0 || isCurrent) ? `[(docs)](https://docs.rs/crate/${item.key.replace(/"/g, "")}/${version})` : "";
      const command = `${isCurrent ? "**" : ""}[${version}](command:crates.replaceVersion?${encoded})${docs}${isCurrent ? "**" : ""}`;
      hoverMessage.appendMarkdown("\n * ");
      hoverMessage.appendMarkdown(command);
    }
    if (version == "?") {
      const version = versions[0];
      const info: ReplaceItem = {
        item: `"${version}"`,
        start,
        end,
      };
      // decoPositon = + version.length;
      editor.edit((edit) => {
        edit.replace(
          new Range(
            editor.document.positionAt(info.start + 1),
            editor.document.positionAt(info.end - 1),
          ),
          info.item.substr(1, info.item.length - 2),
        );
      });
      editor.document.save();
    }

    let latestText = compatibleDecorator.replace("${version}", versions[0]);
    if (!validRange(version))
      latestText = errorDecorator.replace("${version}", versions[0]);
    else if (versions[0] !== maxSatisfying)
      if (satisfies) {
        latestText = compatibleDecorator.replace("${version}", versions[0]);
      } else {
        latestText = incompatibleDecorator.replace("${version}", versions[0]);
      }
    contentText = latestText;
  }

  const deco = {
    range: new Range(
      editor.document.positionAt(start),
      endofline,
    ),
    hoverMessage,
    renderOptions: {
      after: {},
    },
  };
  if (version != "?" && contentText.length > 0) {
    deco.renderOptions.after = { contentText };
  }
  return deco;
}
