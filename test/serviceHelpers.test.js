import { test } from "node:test";
import assert from "node:assert/strict";
import { pageRange, clean } from "../src/services/config/serviceHelpers.js";

test("pageRange computes Supabase range bounds (1-based pages)", () => {
    assert.deepEqual(pageRange(1, 10), { from: 0, to: 9 });
    assert.deepEqual(pageRange(2, 10), { from: 10, to: 19 });
    assert.deepEqual(pageRange(3, 25), { from: 50, to: 74 });
});

test("pageRange uses sensible defaults", () => {
    assert.deepEqual(pageRange(), { from: 0, to: 9 });
});

test("clean strips undefined keys but keeps null/false/0", () => {
    assert.deepEqual(
        clean({ a: undefined, b: null, c: false, d: 0, e: "x" }),
        { b: null, c: false, d: 0, e: "x" },
    );
    assert.deepEqual(clean({}), {});
});
