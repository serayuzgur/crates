import { test, suite } from "mocha";
import * as assert from "assert";

suite("semver tests", function() {
  test("caret", function() {
    //TODO: handle major, minor, patch, asterix
    assert.equal("a", "1/a");
  });
  test("tilda", function() {
    assert.equal("a", "1/a");
  });
  test("eq", function() {
    assert.equal("a", "1/a");
  });
  test("gt", function() {
    assert.equal("a", "1/a");
  });
  test("lt", function() {
    assert.equal("a", "1/a");
  });
  test("gte", function() {
    assert.equal("a", "1/a");
  });
});
