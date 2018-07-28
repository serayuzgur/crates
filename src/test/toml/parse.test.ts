import { test, suite } from "mocha";
import * as assert from "assert";
import * as fs from "fs";

import { parse, filterCrates } from "../../toml/parser";

suite("parser Tests", function() {
  const tomlFile = Buffer.from(
    fs.readFileSync("./src/test/full.toml"),
  ).toString();
  // Defines a Mocha unit test
  test("Read File", function() {
    assert.notEqual(tomlFile, undefined);
  });
  test("Read Tables", function() {
    const doc = parse(tomlFile);
    const expected = [
      "package",
      "package.metadata.docs.rs",
      "features",
      "dependencies",
      "dev-dependencies",
      "build-dependencies",
      "target.'cfg(target_os = \"android\")'.dependencies.android_glue",
      "target.'cfg(target_os = \"ios\")'.dependencies",
      "target.'cfg(target_os = \"macos\")'.dependencies",
      "target.'cfg(unix)'.dev-dependencies",
      "target.'cfg(target_os = \"windows\")'.dependencies.winapi",
      'target.\'cfg(any(target_os = "linux", target_os = "dragonfly", target_os = "freebsd", target_os = "openbsd"))\'.dependencies',
      "dependencies.libc",
    ];

    assert.equal(doc.values.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
      const item = doc.values[i];
      assert.equal(item.key, expected[i].replace(/\s/g, ""));
      assert.strictEqual(
        tomlFile
          .substring(item.start+1, item.start+1 + expected[i].length),
        expected[i],
        `Start index error for "${doc.values[i].key}"`,
      );
    }
    {
      const item = doc.values[0];
      const section = tomlFile.substring(item.start, item.end);
      const desiredSection = tomlFile.substring(0, 67);
      assert.equal(section, desiredSection);
    }
    {
      const item = doc.values[11];
      const section = tomlFile.substring(item.start, item.end);
      const desiredSection = tomlFile.substring(1037, 1333);
      assert.equal(section, desiredSection);
    }
  });

  test("Read Values", function() {
    const doc = parse(tomlFile);
    const expected = [3, 1, 1, 5, 1, 1, 1, 1, 5, 1, 2, 5,1];

    assert.equal(doc.values.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
      assert.equal(
        doc.values[i].values.length,
        expected[i],
        `Value count is wrong for table: ${doc.values[i].key}`,
      );
    }
  });

  test("Test Start & end", function () {
    const doc = parse(tomlFile);
    {
      const item = doc.values[0].values[0];
      const section = tomlFile.substring(item.start, item.end);
      const desiredSection = tomlFile.substring(17, 25);
      assert.equal(section, desiredSection);
    }
  });

  test("FilterCrates", function() {
    const doc = parse(tomlFile);
    const expected = [
      'lazy_static = "1.0.1"',
      'libc = "0.2.42"',
      'image = "0.19.0"',
      'futures = "0.1.21"',
      'futures-await = "0.1.0"',
      'tempdir = "0.3.7"',
      'gcc = "0.3"',
      'android_glue = "0.2"',
      'objc = "0.2.1"',
      'objc = "0.2"',
      'cocoa = "0.16.0"',
      'core-foundation = "0.6.0"',
      'core-graphics = "0.5.0"',
      'futures = ""',
      'mio = "0.6"',
      'winapi = "0.3"',
      'wayland-client = "0.10.3"',
      'smithay-client-toolkit = "0.2.4"',
      'x11-dl = "2"',
      'parking_lot = "0.6.2"',
      'percent-encoding = "1.0.1"',
      'libc = "0.2.42"',
    ];

    const actual = filterCrates(doc.values);

    assert.equal(actual.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
      assert.equal(
        `${actual[i].key}="${actual[i].value}"`,
        expected[i].replace(/\s/g, ""),
      );
    }
  });
});
