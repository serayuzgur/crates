/**
 * Helps to manage decorations for the TOML files.
 */
import {
  workspace,
  DecorationOptions,
  Range,
  TextEditor,
  MarkdownString,
} from "vscode";
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
  upToDateDecorator: string,
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
  const currentVersion = isVersionString ? version : version.version;
  const hasLatest =
    versions[0] === currentVersion ||
    versions[0].indexOf(`${currentVersion}.`) === 0;

  const hoverMessage = new MarkdownString(`**Available Versions** \t \n `);
  hoverMessage.isTrusted = true;
  versions.map(item => {
    let template;
    if (isVersionString) {
      template = `"${item}"`;
    } else {
      template = { ...version };
      template["version"] = item;
      template = JSON.stringify({ ...template }).replace(
        /\"([^(\")"]+)\":/g,
        "$1 = ",
      );
    }
    const replaceData = JSON.stringify({
      item: `${crate} = ${template}`,
      start,
      end,
    });
    const command = `[${item}](command:crates.replaceVersion?${encodeURI(
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
    const conf = workspace.getConfiguration("", editor.document.uri);
    const upToDateDecoratorConf = conf.get("crates.upToDateDecorator");

    const upToDateDecorator = upToDateDecoratorConf
      ? upToDateDecoratorConf + ""
      : "";
    const listPreReleases = conf.get("crates.listPreReleases");
    return versions(key)
      .then((json: any) => {
        const versions = json.versions.reduce((result: any[], item: any) => {
          const isPreRelease =
            !listPreReleases &&
            (item.num.indexOf("-alpha") !== -1 ||
              item.num.indexOf("-beta") !== -1||
              item.num.indexOf("-rc") !== -1);
          if (!item.yanked && !isPreRelease) {
            result.push(item.num);
          }
          return result;
        }, []);
        const decor = decoration(
          editor,
          key,
          dependencies[key],
          versions,
          upToDateDecorator,
        );
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
