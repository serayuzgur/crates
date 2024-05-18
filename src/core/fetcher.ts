import Item from "./Item";
import Dependency from "./Dependency";
import { StatusBar } from "../ui/status-bar";
import {
  sparseIndexServerURL,
  versions as sparseVersions
} from "../api/sparse-index-server";
import compareVersions from "../semver/compareVersions";
import { CompletionItem, CompletionItemKind, CompletionList, workspace } from "vscode";
import { sortText } from "../providers/autoCompletion";
import { CrateMetadatas } from "../api/crateMetadatas";
import { AlternateRegistry } from "./AlternateRegistry";

export async function fetchCrateVersions(dependencies: Item[], alternateRegistries?: AlternateRegistry[]): Promise<[Promise<Dependency[]>, Map<string, Dependency[]>]> {
  // load config
  const config = workspace.getConfiguration("");
  const shouldListPreRels = !!config.get("crates.listPreReleases");
  var indexServerURL = config.get<string>("crates.indexServerURL") ?? sparseIndexServerURL;

  StatusBar.setText("Loading", "👀 Fetching " + indexServerURL.replace(/^https?:\/\//, ''));

  let transformer = transformServerResponse(sparseVersions, shouldListPreRels, indexServerURL, alternateRegistries);
  let responsesMap: Map<string, Dependency[]> = new Map();
  const responses = dependencies.map(transformer);
  return [Promise.all(responses), responsesMap];
}


function transformServerResponse(versions: (name: string, indexServerURL?: string, registryToken?: string) => Promise<CrateMetadatas>, shouldListPreRels: boolean, indexServerURL: string, alternateRegistries?: AlternateRegistry[]): (i: Item) => Promise<Dependency> {
  return function (item: Item): Promise<Dependency> {
    // Use the sparse index if (and only if) the crate does not use an alternate registry
    const alternateRegistry = alternateRegistries?.find((registry) => item.registry == registry.name);
    var thisCrateRegistry = item.registry !== undefined ? alternateRegistry?.index : indexServerURL;
    var thisCrateToken = item.registry !== undefined ? alternateRegistry?.token : undefined;
    return versions(item.key, thisCrateRegistry, thisCrateToken).then((crate: any) => {
      const versions = crate.versions.reduce((result: any[], item: string) => {
        const isPreRelease = !shouldListPreRels && (item.indexOf("-alpha") !== -1 || item.indexOf("-beta") !== -1 || item.indexOf("-rc") !== -1 || item.indexOf("-pre") !== -1);
        if (!isPreRelease)
          result.push(item);
        return result;
      }, [])
        .sort(compareVersions)
        .reverse();

      let i = 0;
      const versionCompletionItems = new CompletionList(
        versions.map((version: string) => {
          const completionItem = new CompletionItem(
            version,
            CompletionItemKind.Class
          );
          completionItem.preselect = i === 0;
          completionItem.sortText = sortText(i++);
          return completionItem;
        }),
        true
      );

      let featureCompletionItems: Map<string, CompletionList> = new Map();
      crate.features?.forEach((feature: string) => {
        // TODO: Add feature completion items according to the different versions.
        featureCompletionItems!.set(feature, new CompletionList(crate.features.map((feature: string) => {
          return new CompletionItem(feature, CompletionItemKind.Class);
        })));
      });
      return {
        item,
        versions,
        versionCompletionItems,
        featureCompletionItems,
      };
    }).catch((error: Error) => {
      console.error(error);
      return {
        item,
        error: item.key + ": " + error,
      };
    });
  };
};