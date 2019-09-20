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
import { parse } from "path";
import { version } from "bluebird";
import * as compareVersions from "compare-versions";

export const latestVersion = (text: string) =>
  window.createTextEditorDecorationType({
    after: {
      margin: "2em",
    },
  });

function parseSemVer(str : string): RegExpMatchArray {
  var regex = /^(=|\^|>|<|>=|<=)?(0|[1-9]\d*)\.?(?:(0|[1-9]\d*)\.?)?(0|[1-9]\d*)?(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)?(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  var matches = str.match(regex);
  return matches ? matches.slice(1) : [];
};

function checkHasLatest(
  versions: string[],
  currentVersion: string
): boolean {

  var semver = parseSemVer(currentVersion);
  if (semver.length === 0){ return false; }
  var v = semver.slice(1,4).map((v) => (v) ? v : "0" ); // Get rid of undefined for partial versions like: x or x.0

  switch (semver[0]) {
    case null:{
      return (
        versions[0] === currentVersion ||
        versions[0].indexOf(`${currentVersion}.`) === 0
      );
    }
    case "^":
      var check = true;
      v = v.map((s) => {
        if (!check || s === "0"){return "0";}
        var n = +s;
        check = false;
        return "" + (n + 1);
      });
      var vmax = v.join(".");
      if (vmax === "0.0.0"){vmax = "1.0.0";} // Exception for versions with all zeroes
      return compareVersions(vmax, versions[0]) >= 0;
    //TODO: implement for tilde
    //TODO: implement for wildcard
    //TODO: implement for comparison requirements
    default:
  }
  return false;
}

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

  const hasLatest = (currentVersion) ? checkHasLatest(versions, currentVersion) : false;

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
