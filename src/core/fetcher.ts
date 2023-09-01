import Item from "./Item";
import Dependency from "./Dependency";
import { StatusBar } from "../ui/status-bar";
import {
  isSparseCompatible,
  sparseIndexServerURL,
  versions as sparseVersions
} from "../api/sparse-index-server";
import {
  versions as cratesVersions
} from "../api/crates-index-server";
import compareVersions from "../semver/compareVersions";
import { CompletionItem, CompletionItemKind, CompletionList, workspace, window } from "vscode";
import { sortText } from "../providers/autoCompletion";
import { CrateMetadatas } from "../api/crateMetadatas";

export async function fetchCrateVersions(dependencies: Item[]): Promise<[Promise<Dependency[]>, Map<string, Dependency[]>]> {
  // load config
  const config = workspace.getConfiguration("");
  const shouldListPreRels = !!config.get("crates.listPreReleases");
  var indexServerURL = config.get<string>("crates.indexServerURL") ?? sparseIndexServerURL;

  var versions;
  try {
    if (await isSparseCompatible(indexServerURL)) {
      console.log("Using sparse compatible index " + indexServerURL);
      versions = sparseVersions;
    } else {
      console.log("Using cis index " + indexServerURL);
      versions = cratesVersions;
    }
  } catch (e) {
    console.error(`Could not check index compatibility for url "${indexServerURL}" (using sparse instead) : ${e}`);
    indexServerURL = sparseIndexServerURL;
    versions = sparseVersions;
  }

  StatusBar.setText("Loading", "👀 Fetching " + indexServerURL.replace(/^https?:\/\//, ''));

  let transformer = transformServerResponse(versions, shouldListPreRels, indexServerURL);
  let responsesMap: Map<string, Dependency[]> = new Map();
  const responses = dependencies.map(transformer);
  return [Promise.all(responses), responsesMap];
}


function transformServerResponse(versions: (name: string, indexServerURL: string) => Promise<CrateMetadatas>, shouldListPreRels: boolean, indexServerURL: string): (i: Item) => Promise<Dependency> {
  return function (item: Item): Promise<Dependency> {
    return versions(item.key, indexServerURL).then((crate: any) => {
      const versions = crate.versions.reduce((result: any[], item: string) => {
        const isPreRelease = !shouldListPreRels && item.indexOf("-") !== -1;
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