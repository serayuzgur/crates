import os = require('os');
import path = require("path");
import util = require('util');
const exec = util.promisify(require('child_process').exec);

const gitDir = path.resolve(os.homedir(), ".cargo/registry/index/github.com-1ecc6299db9ec823/.git/");

export const versions = (name: string, githubToken?: string) => {
  return exec(`git --no-pager --git-dir=${gitDir} show origin/master:${decidePath(name)}`)
  .then((buf: {stdout: Buffer, stderr: Buffer}) => {
    const response = buf.stdout.toString();
    const conv = response.split("\n");
    console.log("Fetching DONE: ", name, conv.length);
    const versions = [];
    for (const rec of conv) {
      try {
        if (rec.trim().length > 0) {
          const parsed = JSON.parse(rec);
          versions.push({ num: parsed.vers, yanked: parsed.yanked });
        }
      } catch (er) {
        console.log(er, rec);
      }
    }
    return { versions: versions.sort().reverse() };
  })
  .catch((resp: any) => {
    console.error(resp);
    throw resp;
  });
};

export function decidePath(name: string) {
  name = name.toLowerCase();
  if (name.startsWith('"') && name.endsWith('"')) {
    name = name.substring(1, name.length - 1);
  }
  if (name.length === 1) {
    return `1/${name}`;
  }
  if (name.length === 2) {
    return `2/${name}`;
  }
  if (name.length === 3) {
    return `3/${name.charAt(0)}/${name}`;
  }

  return `${name.substring(0, 2)}/${name.substring(2, 4)}/${name}`;
}
