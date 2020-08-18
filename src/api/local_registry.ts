// Please note that the internal structure of the Cargo home is not stabilized and may be subject to change at any time.
//
// Nevertheless, this api depends on there being a headless crates.io-index git repo at:
// CARGO_HOME/registry/index/github.com-1ecc6299db9ec823/.git/
// The repo isn't updated, and is instead assumed to be updated by cargo reasonably recently.
//
// Furthermore, this api depends on 'git' command being in PATH

import * as os from "os";
import * as path from "path";
import * as util from "util";
import * as fs from "fs";
import { decidePath, parseVersions } from "./index-utils";
const exec = util.promisify(require('child_process').exec);

// check for the crates index. If none found switch to github and show error
const cargoHome = getCargoPath()

function getCargoPath() {
  // Trailing slash on macos (does not want / at the end) and windows (needs / at end)
  if (process.env.CARGO_HOME)
    return process.env.CARGO_HOME;
  if (os.platform() === "win32")
    return path.resolve(os.homedir(), "/.cargo/");
  return path.resolve(os.homedir(), ".cargo/");
}



const gitDir = path.resolve(cargoHome, "registry/index/github.com-1ecc6299db9ec823/.git/");



export function checkCargoRegistry() {
  return fs.existsSync(gitDir);
}

export const versions = (name: string) => {
  return exec(
    `git --no-pager --git-dir="${gitDir}" show origin/master:${decidePath(name)}`,
    { maxBuffer: 8 * 1024 * 1024 }  // "8M ought to be enough for anyone."
  )
    .then((buf: { stdout: Buffer, stderr: Buffer; }) => {
      const response = buf.stdout.toString();
      return parseVersions(response, name);
    })
    .catch((resp: any) => {
      console.error(resp);
      throw resp;
    });
};
