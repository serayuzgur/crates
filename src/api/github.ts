// repo
// https://api.github.com/repos/rust-lang/crates.io-index
// master
// https://api.github.com/repos/rust-lang/crates.io-index/branches/master
//commit.tree.url
// tree , find by path. go in

/**
 * Holds important api calls for the crates.io.
 */
import { get } from "request-promise";

const API = "https://api.github.com/repos/rust-lang/crates.io-index";

const data: any = {};

function cache(key: string, func: any, url: string) {
  if (!data[key] || data[key].isRejected()) {
    console.log("Fetching dependency: ", key);
    data[key] = func(url, {
      headers: {
        "User-Agent":
          "VSCode.Crates (https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates)",
        Accept: "application/vnd.github.VERSION.raw",
      },
    })
      .then((response: string) => {
        const conv = response.split("\n");
        console.log("Fetching DONE: ", key, conv.length);
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
  }
  return data[key];
}

export const versions = (name: string) => {
  return cache(name, get, `${API}/contents/${decidePath(name)}`);
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
