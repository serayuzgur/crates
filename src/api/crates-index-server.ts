import * as https from 'https';
import { workspace } from "vscode";

import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 60 * 10 });

export const versions = (name: string) => {
  const config = workspace.getConfiguration("");
  const indexServerURL = config.get<string>("crates.indexServerURL") ?? "";

  // clean dirty names
  name = name.replace(/"/g, "");

  return new Promise(function (resolve, reject) {
    const cached = cache.get(name);
    if (cached) {
      resolve(cached);
      return;
    }
    var req = https.get(`${indexServerURL}/index/versions/${name}`, function (res) {
      // reject on bad status
      if (!res.statusCode) {
        reject(new Error('statusCode=' + res.statusCode));
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error('statusCode=' + res.statusCode));
      }
      // cumulate data
      var body: any = [];
      res.on('data', function (chunk) {
        body.push(chunk);
      });
      // resolve on end
      res.on('end', function () {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
          cache.set(name, body);
        } catch (e) {
          reject(e);
        }
        resolve(body);
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
