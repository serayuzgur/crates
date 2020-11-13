import { diff } from "semver";

export function completeVersion(version?: string) {
  if (!version)
    return "0.0.0";
  const parts = version.split(".");
  //Handle wildcards
  let newV = [];
  for (let i = 0; i < 3; i++) {
    newV.push(parts[i] ? parts[i] : "*");
  }
  return newV.join(".");
}
export function versionInfo(version: string = "0.0.0", max: string) {
    
    const current = completeVersion(version).split(" ").join("");
    console.info("CCC",current)

    //TODO: handle operator cases after here

  // Handle wildcards
  const parts = current.split(".");
  if (parts[0] === "*")
    return null;

  if (parts[1] === "*") { // check minor
    const d = diff(parts[0] + ".0.0", max);
    return d === "minor" ? null : d;
  }
  if (parts[2] === "*") { // check patch
    const d = diff(parts[0] + "." + parts[1] + ".0", max);
    return d === "patch" ? null : d;
  }
  let d = diff(current, max);

  return d;
}