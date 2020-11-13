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
  console.info("CCC", current);

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

export function convert2Range(v: string) {
  const op = v.charAt(0);
  switch (op) {
    case "~": {
      const ver = new Version(v);
      return [`>=${ver.toString()}`, `<${ver.maxTilda()}`];
    }
    case "^": {
      const ver = new Version(v);
      return [`>=${ver.toString()}`, `<${ver.maxCaret()}`];
    }
    default: // asterix or number
      // const single = v.split(".").length < 4;
  }

}


class Version {
  major: number;
  minor: number;
  patch: number;
  length: number;
  constructor(v: string) {
    const clean = v.replace(/[^\d.-]/g, '');
    const parts = clean.split(".");
    this.length = parts.length;
    this.major = (parseInt(parts[0], 10) || 0) ?? 0;
    this.minor = (parseInt(parts[1], 10) || 0) ?? 0;

    this.patch = (parseInt(parts[2], 10) || 0) ?? 0;
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
  maxPatch() {
    return `${this.major}.${this.minor + 1}.0`;
  }
  maxMinor() {
    return `${this.major + 1}.0.0`;
  }
  maxTilda() {
    switch (this.length) {
      case 3:
      case 2:
        return this.maxPatch();
      case 1:
        return this.maxMinor();

    }
  }
  maxCaret() {
  
    switch (this.length) {
      case 3:
        if(!this.major){
          if(!this.minor){ // 0.0.x
            return `0.0.${this.patch+1}`
          }
          // 0.x.x
          return this.maxPatch();
        }
        return this.maxMinor();
      case 2:
        if(!this.major){
          if(!this.minor){ // 0.0
            return this.maxPatch()
          }
          // 0.x
          return this.maxPatch();
        }
        return this.maxMinor();
      case 1:
        return this.maxMinor();

    }
  }
} 