import * as http from 'http';
import { workspace } from "vscode";

export const versions = (name: string) => {
  const config = workspace.getConfiguration("");
  const indexServerURL = config.get<string>("crates.indexServerURL") ?? "";

  // clean dirty names
  name = name.replace(/"/g, "");

  return new Promise(function (resolve, reject) {
    var req = http.get(`${indexServerURL}/index/versions/${name}`, function (res) {
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
