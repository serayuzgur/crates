/**
 * Helps to manage decorations for the TOML files.
 */
import { DecorationOptions, Range, TextEditor, MarkdownString } from "vscode";
import { versions } from "../api";
import { statusBarItem } from "../ui/indicators";

/**
 * Create a decoration for the given crate.
 * @param editor
 * @param crate
 * @param version
 * @param versions
 */
function decoration(
  editor: TextEditor,
  crate: string,
  version: string | any,
  versions: string[],
) {
  // Also handle json valued dependencies
  const regex = new RegExp(`${crate}.*=.*`, "g");
  const matches = regex.exec(editor.document.getText());
  if (!matches || matches.length === 0 || !versions) {
    return;
  }
  const match = matches[0];
  const end = regex.lastIndex;
  const start = regex.lastIndex - match.length;
  const isVersionString = typeof version === "string";
  const hasLatest =
    versions[0] === (isVersionString ? version : version.version);
  const versionLinks = versions.map(item => {
    let template;
    if (isVersionString) {
      template = `"${item}"`;
    } else {
      template = { ...version };
      template["version"] = item;
      template = JSON.stringify({ ...template }).replace(/\"([^(\")"]+)\":/g, "$1 = ");
    }
    return `[${item}](command:crates.replaceVersion?${JSON.stringify({
      item: `${crate} = ${template}`,
      start,
      end,
    })})`;
  });
  const hoverMessage = new MarkdownString(
    `**Available Versions** \t \n * ${versionLinks.join("\n * ")}`,
  );
  hoverMessage.isTrusted = true;

  return {
    range: new Range(
      editor.document.positionAt(start),
      editor.document.positionAt(end),
    ),
    hoverMessage,
    renderOptions: {
      after: {
        contentText: hasLatest ? "👍" : `Latest: ${versions[0]}`,
      },
    },
  };
}

/**
 * Takes parsed dependencies object, fetches all the versions and creates necessary decorations.
 * @param editor
 * @param dependencies
 * @param finalize
 */
export function dependencies(
  editor: TextEditor,
  dependencies: any,
  finalize: (result: DecorationOptions[]) => void,
): void {
  const options: DecorationOptions[] = [];
  const responses = Object.keys(dependencies).map((key: string) => {
    console.log("Fetching dependency: ", key);
    return versions(key)
      .then((json: any) => {
        const versions = json.versions.map((item: any) => item["num"]);
        const decor = decoration(editor, key, dependencies[key], versions);
        if (decor) {
          options.push(decor);
        }
      })
      .catch((err: Error) => {
        console.error(err);
      });
  });
  Promise.all(responses).then(() => {
    console.log("All fetched! 👏");
    finalize(options);
    statusBarItem.setText();
  });
}

export default {
  dependencies,
};
