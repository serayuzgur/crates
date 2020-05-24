/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import { TextEditor, TextEditorDecorationType, workspace } from "vscode";
import * as compareVersions from "compare-versions";
import { parse, filterCrates, Item } from "../toml/parser";
import { statusBarItem } from "../ui/indicators";
import { decorate } from "./decorations";
import { status } from "./commands";
import { versions as loVersions, checkCargoRegistry } from "../api/local_registry";
import { versions as ghVersions } from "../api/github";

export interface Dependency {
  item: Item;
  versions?: Array<string>;
  error?: string;
}

let decoration: TextEditorDecorationType;

function parseToml(text: string): Item[] {
  console.log("Parsing...");
  const toml = parse(text);
  const tomlDependencies = filterCrates(toml.values);
  console.log("Parsed");
  statusBarItem.setText("Cargo.toml parsed");
  return tomlDependencies;
}

function fetchCrateVersions(dependencies: Item[], shouldListPreRels: boolean, githubToken?: string, isLocalRegistry?: boolean): Promise<Dependency[]> {
  statusBarItem.setText("👀 Fetching crates.io");
  const responses = dependencies.map(
    (item: Item): Promise<Dependency> => {
      // Check settings and if local registry enabled control cargo home. Fallback is the github index.
      const isLocalRegistryAvailable   = isLocalRegistry && checkCargoRegistry();
      const versions = isLocalRegistryAvailable ? loVersions : ghVersions;

      return versions(item.key, githubToken)
        .then((json: any) => {
          return {
            item,
            versions: json.versions
              .reduce((result: any[], item: any) => {
                const isPreRelease = !shouldListPreRels && item.num.indexOf("-") !== -1;
                if (!item.yanked && !isPreRelease) {
                  result.push(item.num);
                }
                return result;
              }, [])
              .sort(compareVersions)
              .reverse(),
          };
        })
        .catch((error: Error) => {
          console.error(error);
          return {
            item,
            error: item.key + ": " + error
          };
        });
    },
  );
  return Promise.all(responses);
}

function decorateVersions(editor: TextEditor, dependencies: Array<Dependency>) {
  if (decoration) {
    decoration.dispose();
  }
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
  decoration = decorate(editor, filtered);
  if (errors.length) {
    statusBarItem.setText("⚠️ Completed with errors");
  } else {
    statusBarItem.setText("OK");
  }
}

function parseAndDecorate(editor: TextEditor) {
  const text = editor.document.getText();
  const config = workspace.getConfiguration("", editor.document.uri);
  const shouldListPreRels = config.get("crates.listPreReleases");
  const basicAuth = config.get<string>("crates.githubAuthBasic");
  const isLocalRegistery = config.get<boolean>("crates.useLocalCargoIndex");
  const githubToken = basicAuth ? `Basic ${Buffer.from(basicAuth).toString("base64")}` : undefined;
  try {
    // Parse
    const dependencies = parseToml(text);

    // Fetch Versions
    fetchCrateVersions(dependencies,
      !!shouldListPreRels,
      githubToken, isLocalRegistery)
      .then(decorateVersions.bind(undefined, editor));
  } catch (e) {
    console.error(e);
    statusBarItem.setText("Cargo.toml is not valid!");
    if (decoration) {
      decoration.dispose();
    }
  }
}

export default function (editor: TextEditor | undefined): void {
  if (editor) {
    const { fileName } = editor.document;
    if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
      status.inProgress = true;
      status.replaceItems = [];
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
