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

export async function fetchCrateVersions(dependencies: Item[]): Promise<[Dependency[], Map<string, Dependency[]>]> {
  // load config
  const config = workspace.getConfiguration("");
  const shouldListPreRels = !!config.get("crates.listPreReleases");
  const indexServerURL = config.get<string>("crates.indexServerURL") ?? sparseIndexServerURL;
  const otherIndexServerURLs = config.get<string[]>("crates.otherIndexServerURLs") ?? [];
  const allServerUrls = [indexServerURL, ...otherIndexServerURLs];

  let responsesMap: Map<string, Dependency[]> = new Map();
  const responses = await Promise.all(allServerUrls.map(url => fetchCrateVersionsFromIndex(dependencies, shouldListPreRels, url)));

  let resolvedDeps: Dependency[] = responses[0]; // start with the dependencies from the first server (probably crates.io)
  for (let server = 1; server < responses.length; server++) {
    // if there are other servers, accumulate by replacing dependencies that still are errors
    for (let d = 0; d < resolvedDeps.length; d++) {
      if (resolvedDeps[d].error) {
        // this dependency failed so far, replace by the last response
        resolvedDeps[d] = responses[server][d];
      }
    }
  }
  return [resolvedDeps, responsesMap];
}

async function fetchCrateVersionsFromIndex(dependencies: Item[], shouldListPreRels: boolean, indexServerURL: string): Promise<Dependency[]> {
  var versions;
  try {
    versions = sparseVersions;
  } catch (e) {
    console.error(`Could not check index compatibility for url "${indexServerURL}" (using sparse instead) : ${e}`);
    indexServerURL = sparseIndexServerURL;
    versions = sparseVersions;
  }

  StatusBar.setText("Loading", "👀 Fetching " + indexServerURL.replace(/^https?:\/\//, ''));

  let transformer = transformServerResponse(versions, shouldListPreRels, indexServerURL);
  
  const responses = dependencies.map(transformer);
  return Promise.all(responses);
}


function transformServerResponse(versions: (name: string, indexServerURL: string) => Promise<CrateMetadatas>, shouldListPreRels: boolean, indexServerURL: string): (i: Item) => Promise<Dependency> {
  return function (item: Item): Promise<Dependency> {
    return versions(item.key, indexServerURL).then((crate: any) => {
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