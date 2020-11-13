import { test, suite } from "mocha";
import * as assert from "assert";
import { convert2Range } from "../../semver/semverUtils";

// suite("semver symbol tests", function () {
//   test("caret", function () {
//     //TODO: handle major, minor, patch, asterix
//     /*For caret ranges, only major version must match. Any minor or patch version greater than or equal to the minimum is valid.
//       For example, a range of ~1.2.3 will only permit versions up to, but not including 1.3.0. However, the caret version, ^1.2.3 permits versions from 1.2.3 all the way up to, but not including, the next major version, 2.0.0.*/
//     assert.strictEqual("a", "1/a");
//   });
//   test("tilda", function () {
//     /*For tilde ranges, major and minor versions must match those specified, but any patch version greater than or equal to the one specified is valid.
//       For example, ~1.2.3 permits versions from 1.2.3 up to, but not including, the next minor, 1.3.0.*/
//     assert.strictEqual("a", "1/a");

//   });
//   test("eq", function () {
//     assert.strictEqual("a", "1/a");
//   });
//   test("gt", function () {
//     assert.strictEqual("a", "1/a");
//   });
//   test("lt", function () {
//     assert.strictEqual("a", "1/a");
//   });
//   test("gte", function () {
//     assert.strictEqual("a", "1/a");
//   });
//   test("lte", function () {
//     assert.strictEqual("a", "1/a");
//   });
//   test("and", function () {
//     assert.strictEqual("a", "1/a");
//   });
//   test("or", function () {
//     assert.strictEqual("a", "1/a");
//   });
// });
suite("semver convert2Range tests", function () {
  test("tilda", function () {
    assert.deepStrictEqual(convert2Range("~1.2.3"), [">=1.2.3", "<1.3.0"]);
    assert.deepStrictEqual(convert2Range("~1.2"), [">=1.2.0", "<1.3.0"]);
    assert.deepStrictEqual(convert2Range("~1"), [">=1.0.0", "<2.0.0"]);
  });
  test("caret", function () {
    assert.deepStrictEqual(convert2Range("^1.2.3"), [">=1.2.3", "<2.0.0"]);
    assert.deepStrictEqual(convert2Range("^1.2"), [">=1.2.0", "<2.0.0"]);
    assert.deepStrictEqual(convert2Range("^1"), [">=1.0.0", "<2.0.0"]);
    assert.deepStrictEqual(convert2Range("^0.2.3"), [">=0.2.3", "<0.3.0"]);
    assert.deepStrictEqual(convert2Range("^0.0.3"), [">=0.0.3", "<0.0.4"]);
    assert.deepStrictEqual(convert2Range("^0.0"), [">=0.0.0", "<0.1.0"]);
    assert.deepStrictEqual(convert2Range("^0"), [">=0.0.0", "<1.0.0"]);
  });
});
