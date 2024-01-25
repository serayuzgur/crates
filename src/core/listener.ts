/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import { Position, Range, TextDocument, TextEditor } from "vscode";
import { parse, filterCrates } from "../toml/parser";
import { StatusBar } from "../ui/status-bar";
import { status } from "../toml/commands";
import Item from "./Item";
import decorate, { decorationHandle } from "../ui/decorator";
import { fetchCrateVersions } from "./fetcher";
import Dependency from "./Dependency";

function parseToml(text: string): Item[] {
  console.log("Parsing...");
  const toml = parse(text);
  const tomlDependencies = filterCrates(toml.values);
  console.log("Parsed");
  return tomlDependencies;
}

var dependencies: Item[];
var fetchedDeps: Dependency[];
var fetchedDepsMap: Map<string, Dependency[]>;
export { dependencies, fetchedDeps, fetchedDepsMap };

export function getFetchedDependency(document: TextDocument, crate: string, position: Position): Dependency | undefined {
  const fetchedDep = fetchedDepsMap.get(crate);
  if (!fetchedDep) return;
  if (fetchedDep.length === 1) {
    return fetchedDep[0];
  } else {
    for (let i = 0; i < fetchedDep.length; i++) {
      const range = new Range(
        document.positionAt(fetchedDep[i].item.start + 1),
        document.positionAt(fetchedDep[i].item.end - 1)
      );
      if (range.contains(position)) {
        return fetchedDep[i];
      }
    }
  }
}

export async function parseAndDecorate(
  editor: TextEditor,
  _wasSaved: boolean = false,
  fetchDeps: boolean = true
) {
  const text = editor.document.getText();
  try {
    // Parse
    StatusBar.setText("Loading", "Parsing Cargo.toml");
    dependencies = parseToml(text);
    if (fetchDeps || !fetchedDeps || !fetchedDepsMap) {
      const data = await fetchCrateVersions(dependencies);
      fetchedDeps = data[0];
      fetchedDepsMap = data[1];
    }

    decorate(editor, fetchedDeps);
    // StatusBar.setText("Info", "Done");

  } catch (e) {
    console.error(e);
    StatusBar.setText("Error", "Cargo.toml is not valid!");
    if (decorationHandle) {
      decorationHandle.dispose();
    }
  }
}

export default async function listener(editor: TextEditor | undefined): Promise<void> {
  if (editor) {
    const { fileName } = editor.document;
    if (fileName.toLocaleLowerCase().endsWith("cargo.toml")) {
      status.inProgress = true;
      status.replaceItems = [];
      StatusBar.show();
      await parseAndDecorate(editor);
    } else {
      StatusBar.hide();
    }
    status.inProgress = false;
  } else {
    console.log("No active editor found.");
  }
  return Promise.resolve();
}
