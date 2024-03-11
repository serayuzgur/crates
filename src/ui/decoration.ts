/**
 * Helps to manage decorations for the TOML files.
 */
import {
  window,
  DecorationOptions,
  Range,
  TextEditor,
  MarkdownString,
  DecorationInstanceRenderOptions
} from "vscode";

import { checkVersion } from "../semver/semverUtils";
import Item from "../core/Item";
import { status, ReplaceItem } from "../toml/commands";
import { validRange } from "semver";
import DecorationPreferences from "../core/DecorationText";

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
  decorationPreferences: DecorationPreferences,
  error?: string,
): DecorationOptions {
  // Also handle json valued dependencies

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
  let contentCss = {} as DecorationInstanceRenderOptions;
  if (error) {
    hoverMessage = formatError(error);
    contentCss = decorationPreferences.errorDecoratorCss;
  } else {
    hoverMessage.appendMarkdown("#### Versions");
    hoverMessage.appendMarkdown(` _( [View Crate](https://crates.io/crates/${item.key.replace(/"/g, "")}) | [Check Reviews](https://web.crev.dev/rust-reviews/crate/${item.key.replace(/"/g, "")}) )_`);
    hoverMessage.isTrusted = true;

    if (versions.length > 0) {
      status.replaceItems.push({
        value: versions[0],
        range: item.range,
      });
    }

    // Build markdown hover text
    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      const replaceData: ReplaceItem = {
        value: version,
        range: {
          start: { line: item.range.start.line, character: item.range.start.character },
          end: { line: item.range.end.line, character: item.range.end.character },
        }

      };
      const isCurrent = version === maxSatisfying;
      const encoded = encodeURI(JSON.stringify(replaceData));
      const docs = (i === 0 || isCurrent) ? `[(docs)](https://docs.rs/crate/${item.key}/${version})` : "";
      const command = `${isCurrent ? "**" : ""}[${version}](command:crates.replaceVersion?${encoded})${docs}${isCurrent ? "**" : ""}`;
      hoverMessage.appendMarkdown("\n * ");
      hoverMessage.appendMarkdown(command);
    }
    if (version == "?") {
      const version = versions[0];
      const info: ReplaceItem = {
        value: version,
        range: item.range,

      };
      // decoPositon = + version.length;
      editor.edit((edit) => {
        edit.replace(
          item.range,
          info.value.substr(1, info.value.length - 2),
        );
      });
      editor.document.save();
    }
    contentCss = decorationPreferences.compatibleDecoratorCss;
    if (!validRange(version)) {
      contentCss = decorationPreferences.errorDecoratorCss;
    }
    else if (versions[0] !== maxSatisfying) {
      if (satisfies) {
        contentCss = decorationPreferences.compatibleDecoratorCss;
      } else {
        contentCss = decorationPreferences.incompatibleDecoratorCss;
      }
    }

    contentCss.after!.contentText = contentCss.after!.contentText!.replace("${version}", versions[0]);
  }

  const deco = {
    range: item.decoRange,
    hoverMessage,
    renderOptions: {},
  };
  if (version != "?" && contentCss.after!.contentText!.length > 0) {
    deco.renderOptions = contentCss;
  }

  return deco;
}
