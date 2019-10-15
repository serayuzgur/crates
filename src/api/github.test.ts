import { test, suite } from "mocha";
import * as assert from "assert";
import { decidePath } from "./github";

suite("GithubAPI Tests", function() {
  test("decidePath", function() {
    assert.equal(decidePath("a"), "1/a");
    assert.equal(decidePath('"a"'), "1/a");
    assert.equal(decidePath("a1"), "2/a1");
    assert.equal(decidePath("aac"), "3/a/aac");
    assert.equal(decidePath("weld"), "we/ld/weld");
    assert.equal(decidePath("weldmock"), "we/ld/weldmock");
    assert.equal(decidePath("e2fslibs-sys"), "e2/fs/e2fslibs-sys");
    assert.equal(decidePath('"e2fslibs-sys"'), "e2/fs/e2fslibs-sys");
    assert.equal(decidePath('"Inflector"'), "in/fl/inflector");
  });
});
