/**
 * Listener for TOML files.
 * Filters active editor files according to the extension.
 */
import { Position, Range, TextDocument, TextEditor } from "vscode";
import { parse, filterCrates, parseAlternateRegistries } from "../toml/parser";
import { StatusBar } from "../ui/status-bar";
import { status } from "../toml/commands";
import Item from "./Item";
import decorate, { decorationHandle } from "../ui/decorator";
import { fetchCrateVersions } from "./fetcher";
import Dependency from "./Dependency";
import path from "path";
import { homedir } from "os";
import { promises as async_fs } from 'fs';
import fs from 'fs';
import { AlternateRegistry } from "./AlternateRegistry";

function parseToml(cargoTomlContent: string, alternateRegistries?: AlternateRegistry[]): Item[] {
  console.log("Parsing...");
  const toml = parse(cargoTomlContent);
  var tomlDependencies = filterCrates(toml.values);
  // Filter out crates that have an alternate registry we don't know.
  tomlDependencies = tomlDependencies.filter((crate) =>
    crate.registry === undefined || alternateRegistries?.find((registry) => crate.registry == registry.name && registry.index !== undefined) !== undefined
  );
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

  // Parse credentials if any
  let credentialTokens = undefined;
  try {
    const file = path.join(homedir(), '.cargo', 'credentials.toml');
    if (fs.existsSync(file)) {
      const credentialsTomlContent = await async_fs.readFile(file, 'utf-8');
      credentialTokens = parseAlternateRegistries(credentialsTomlContent);
    }
  } catch (error) {
    console.error(error);
  }

  // Parse alternate registries if any
  let alternateRegistries = undefined;
  try {
    const legacyFile = path.join(homedir(), '.cargo', 'config');
    const file = path.join(homedir(), '.cargo', 'config.toml');
    const confFile = fs.existsSync(file) ? file : legacyFile;
    if (fs.existsSync(confFile)) {
      const configTomlContent = await async_fs.readFile(confFile, 'utf-8');
      alternateRegistries = parseAlternateRegistries(configTomlContent);
    }
  } catch (error) {
    console.error(error);
  }

  // Merge credential tokens into registries
  alternateRegistries?.map((registry) => {
    if (registry.token === undefined) {
      registry.token = credentialTokens?.find((credential) => credential.name == registry.name)?.token;
      return registry;
    } else {
      return registry
    }
  });

  try {
    // Parse crates
    const cargoTomlContent = editor.document.getText();
    StatusBar.setText("Loading", "Parsing Cargo.toml");
    dependencies = parseToml(cargoTomlContent, alternateRegistries);
    if (fetchDeps || !fetchedDeps || !fetchedDepsMap) {
      const data = await fetchCrateVersions(dependencies, alternateRegistries);
      fetchedDeps = await data[0];
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
