import * as https from 'https';
import * as http from 'http';
import { CrateMetadatas } from './crateMetadatas';
import NodeCache from "node-cache";

export const sparseIndexServerURL = "https://index.crates.io";
const cache = new NodeCache({ stdTTL: 60 * 10 });

export const versions = (name: string, indexServerURL?: string, registryToken?: string) => {
  // clean dirty names
  name = name.replace(/"/g, "");

  return new Promise<CrateMetadatas>(function (resolve, reject) {
    const cached = cache.get<CrateMetadatas>(name);
    if (cached) {
      resolve(cached);
      return;
    }
    // compute sparse index prefix
    var prefix;
    var lower_name = name.toLowerCase();
    if (lower_name.length <= 2) {
      prefix = lower_name.length;
    } else if (lower_name.length == 3) {
      prefix = "3/" + lower_name.substring(0, 1);
    } else {
      prefix = lower_name.substring(0, 2) + "/" + lower_name.substring(2, 4);
    }

    // This could happen if crate have an alternate registry, but index was not found.
    // We should not default on sparse index in this case, juste ignore this crate fetch.
    if (indexServerURL === undefined) return;

    // Add a trailing '/', and parse as `URL()`
    let indexServerURLParsed: URL = new URL(`${indexServerURL.replace(/\/$/, "")}/`)
    let options = {
      hostname: indexServerURLParsed.hostname,
      port: indexServerURLParsed.port,
      path: `${indexServerURLParsed.pathname}${prefix}/${lower_name}`,
      headers: {}
    }
    if (registryToken !== undefined) {
      options.headers = {
        Authorization: registryToken
      }
    }
    const requests = indexServerURLParsed.protocol == "https:" ? https : http;
    var req = requests.get(options, function (res) {
      // reject on bad status
      if (!res.statusCode) {
        reject(new Error('statusCode=' + res.statusCode));
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error('statusCode=' + res.statusCode));
      }
      // cumulate data
      var crate_metadatas: CrateMetadatas;
      var body: any = [];
      res.on('data', function (chunk) {
        body.push(chunk);
      });
      // resolve on end
      res.on('end', function () {
        try {
          var body_lines = Buffer.concat(body).toString().split('\n').filter(n => n);
          var body_array: any = [];
          for (var line of body_lines) {
            body_array.push(JSON.parse(line));
          }
          crate_metadatas = {
            name: name,
            versions: body_array.filter((e: any) => e.yanked === false).map((e: any) => e.vers),
            features: Object.keys(body_array.at(-1).features).filter(feature => feature !== "default")
          };
          cache.set(name, crate_metadatas);
        } catch (e) {
          reject(e);
        }
        resolve(crate_metadatas);
      });
    });
    // reject on request error
    req.on('error', function (err) {
      // This is not a "Second reject", just a different sort of failure
      reject(err);
    });
    // IMPORTANT
    req.end();
  });
};
