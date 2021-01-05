import { maxSatisfying, satisfies } from "semver";


export function checkVersion(version: string = "0.0.0", versions: string[]): [boolean, string | null] {
  const max = versions[0];
  return [satisfies(max, version), maxSatisfying(versions, version)];
}