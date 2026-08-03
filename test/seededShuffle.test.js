import { test } from "node:test";
import assert from "node:assert/strict";
import { seededShuffle } from "../src/utils/seededShuffle.js";

const base = [1, 2, 3, 4, 5, 6, 7, 8];

test("seededShuffle returns a permutation of the input", () => {
    const out = seededShuffle(base, "attempt-abc123");
    assert.deepEqual([...out].sort((a, b) => a - b), [...base].sort((a, b) => a - b));
    assert.equal(out.length, base.length);
});

test("seededShuffle is deterministic for the same seed", () => {
    const a = seededShuffle(base, "attempt-abc123");
    const b = seededShuffle(base, "attempt-abc123");
    assert.deepEqual(a, b);
});

test("seededShuffle does not mutate the input array", () => {
    const input = [...base];
    seededShuffle(input, "attempt-xyz");
    assert.deepEqual(input, base);
});

test("different seeds generally produce different orders", () => {
    const orders = new Set(
        ["a", "b", "c", "d", "e", "f"].map((s) => seededShuffle(base, `attempt-${s}`).join(",")),
    );
    assert.ok(orders.size > 1, "expected different seeds to yield multiple orderings");
});

test("seededShuffle handles empty and single-element arrays", () => {
    assert.deepEqual(seededShuffle([], "x"), []);
    assert.deepEqual(seededShuffle([42], "x"), [42]);
});

test("same seed produces same ordering across a longer string seed", () => {
    const seed = "f6b1bb2-fix-project-logic-and-styling-bugs";
    assert.deepEqual(
        seededShuffle(base, seed),
        seededShuffle(base, seed),
    );
});
