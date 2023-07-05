import * as util from "util";
import * as http from 'http';
const exec = util.promisify(require("child_process").exec);
const execSync = require("child_process").execSync;

export const versions = (name: string) => {
  name = name.replace(/"/g, "");
  return new Promise(function (resolve, reject) {
    var req = http.request({
      host: 'localhost',
      port: 3000,
      path: `/versions/${name}`,
      method: 'GET'
    }, function (res) {
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
        let versions = body.versions;
        console.log({ name, versions });
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
