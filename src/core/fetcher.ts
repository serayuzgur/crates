import Item from "./Item";
import Dependency from "./Dependency";
import { StatusBar } from "../ui/status-bar";
import {
  versions as ciVersions
} from "../api/crates-index-server";
import compareVersions from "../semver/compareVersions";
import { CompletionItem, CompletionItemKind, CompletionList, workspace, window } from "vscode";
import { sortText } from "../providers/autoCompletion";

export function fetchCrateVersions(dependencies: Item[]): [Promise<Dependency[]>, Map<string, Dependency[]>] {
  StatusBar.setText("Loading", "👀 Fetching crates.io");

  // load config
  const config = workspace.getConfiguration("");
  const shouldListPreRels = !!config.get("crates.listPreReleases");
  const indexServerURL = config.get<string>("crates.indexServerURL");
  let versions = ciVersions;
  let transformer = transformServerResponse(versions, shouldListPreRels);
  if (!indexServerURL) {
    window.setStatusBarMessage("Crates index server URL is not configured. Looking local index", 2000);
  }
  let responsesMap: Map<string, Dependency[]> = new Map();

  const responses = dependencies.map(transformer);

  return [Promise.all(responses), responsesMap];
}


function transformServerResponse(versions: (name: string) => Promise<unknown>, shouldListPreRels: boolean): (i: Item) => Promise<Dependency> {
  return function (item: Item): Promise<Dependency> {
    return versions(item.key).then((crate: any) => {
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
function transformLocalRegistryResponse(versions: (name: string) => Promise<unknown>, shouldListPreRels: boolean): (i: Item) => Promise<Dependency> {
  return function (item: Item): Promise<Dependency> {
    return versions(item.key)
      .then((json: any) => {
        const versions = json.versions
          .reduce((result: any[], item: any) => {
            const isPreRelease = !shouldListPreRels && item.num.indexOf("-") !== -1;
            if (!item.yanked && !isPreRelease)
              result.push(item.num);
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
        json.versions.forEach((item: any) => {
          if (item.features.length > 0) {
            const isPreRelease = !shouldListPreRels && item.num.indexOf("-") !== -1;
            if (!item.yanked && !isPreRelease) {
              featureCompletionItems!.set(item.num, new CompletionList(item.features.map((feature: string) => {
                return new CompletionItem(feature, CompletionItemKind.Class);
              })));
            }
          }
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
