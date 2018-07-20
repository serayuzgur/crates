/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import {
  TextEditor,
  TextEditorDecorationType,
  window,
  workspace,
} from "vscode";
import { parse, filterCrates, Item } from "../toml/parser";
import { statusBarItem } from "../ui/indicators";
import { decorate } from "./decorations";
import { status } from "./commands";
import { versions } from "../api";

let decoration: TextEditorDecorationType;

function parseToml(text: string): Item[] {
  console.log("Parsing...");
  const toml = parse(text);
  const tomlDependencies = filterCrates(toml.values);
  statusBarItem.setText("Cargo.toml parsed");
  return tomlDependencies;
}

function fetchCrateVersions(
  dependencies: Item[],
  shouldListPreRels: boolean,
): Promise<any> {
  statusBarItem.setText("Fetching crates.io");
  const responses = dependencies.map((item: Item) => {
    return versions(item.key)
      .then((json: any) => {
        return {
          item,
          versions: json.versions.reduce((result: any[], item: any) => {
            const isPreRelease =
              !shouldListPreRels && item.num.indexOf("-") !== -1;
            if (!item.yanked && !isPreRelease) {
              result.push(item.num);
            }
            return result;
          }, []),
        };
      })
      .catch((err: Error) => {
        console.error(err);
      });
  });
  return Promise.all(responses);
}

function decorateVersions(
  editor: TextEditor,
  items: Array<{ item: Item; versions: Array<string> }>,
) {
  if (decoration) {
    decoration.dispose();
  }
  decoration = decorate(editor, items);
  statusBarItem.setText("OK");
}

function parseAndDecorate(editor: TextEditor) {
  const text = editor.document.getText();
  const config = workspace.getConfiguration("", editor.document.uri);
  const shouldListPreRels = config.get("crates.listPreReleases");

  try {
    // Parse
    const dependencies = parseToml(text);

    // Fetch Versions
    fetchCrateVersions(dependencies, !!shouldListPreRels).then(
      decorateVersions.bind(undefined,editor),
    );
  } catch (e) {
    console.error(e);
    statusBarItem.setText("Cargo.toml is not valid!");
    window.showErrorMessage(`Cargo.toml is not valid! ${JSON.stringify(e)}`);
    if (decoration) {
      decoration.dispose();
    }
  }
}

export default function(editor: TextEditor | undefined): void {
  if (editor) {
    const { fileName } = editor.document;
    if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
      status.inProgress = true;
      statusBarItem.show();
      parseAndDecorate(editor);
    } else {
      statusBarItem.hide();
    }
    status.inProgress = false;
  } else {
    console.log("No active editor found.");
  }
}
