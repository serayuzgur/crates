import Item from "./Item";
import Dependency from "./Dependency";
import { statusBarItem } from "../ui/indicators";
import { versions as loVersions, checkCargoRegistry } from "../api/local_registry";
import { versions as ghVersions } from "../api/github";
import compareVersions from "../semver/compareVersions";

export function fetchCrateVersions(
  dependencies: Item[],
  shouldListPreRels: boolean,
  githubToken?: string,
  useLocalIndex?: boolean,
  localIndexHash?: string
): Promise<Dependency[]> {
  statusBarItem.setText("👀 Fetching crates.io");
  const isLocalIndexAvailable = useLocalIndex && checkCargoRegistry(localIndexHash);
  const versions = isLocalIndexAvailable ? loVersions : ghVersions;

  const responses = dependencies.map(
    (item: Item): Promise<Dependency> => {
      // Check settings and if local registry enabled control cargo home. Fallback is the github index.
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
