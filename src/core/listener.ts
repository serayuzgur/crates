/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import { TextEditor, workspace } from "vscode";
import { parse, filterCrates } from "../toml/parser";
import { statusBarItem } from "../ui/indicators";
import { status } from "../toml/commands";
import Item from "./Item";
import decorate, { decorationHandle } from "../ui/decorator";
import { fetchCrateVersions } from "./fetcher";

function parseToml(text: string): Item[] {
  console.log("Parsing...");
  const toml = parse(text);
  const tomlDependencies = filterCrates(toml.values);
  console.log("Parsed");
  statusBarItem.setText("Cargo.toml parsed");
  return tomlDependencies;
}



function parseAndDecorate(editor: TextEditor) {
  const text = editor.document.getText();
  const config = workspace.getConfiguration("", editor.document.uri);
  const shouldListPreRels = config.get("crates.listPreReleases");
  const basicAuth = config.get<string>("crates.githubAuthBasic");
  const isLocalRegistery = config.get<boolean>("crates.useLocalCargoIndex");
  const githubToken = basicAuth ? `Basic ${Buffer.from(basicAuth).toString("base64")}` : undefined;
  // Handle Promise's catch and normal try/catch the same way with an async closure.
  (async () => {
    try {
      // Parse
      const dependencies = parseToml(text);
      const fetchedDeps = await fetchCrateVersions(dependencies, !!shouldListPreRels, githubToken, isLocalRegistery);

      decorate(editor, fetchedDeps);
    } catch (e) {
      console.error(e);
      statusBarItem.setText("Cargo.toml is not valid!");
      if (decorationHandle) {
        decorationHandle.dispose();
      }
    }
  })();
}

export default function listener (editor: TextEditor | undefined): void {
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
