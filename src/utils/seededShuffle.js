// Deterministic seeded shuffle (LCG-based) so option/question order stays
// consistent across page reloads for the same attempt.
// Uses unsigned right shifts (>>> 0) to avoid negative values from JS %.
export function seededShuffle(array, seed) {
    let m = 0x80000000; // 2^31
    let a = 1103515245;
    let c = 12345;

    // Hash the seed string into a positive integer
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) >>> 0; // unsigned
    }
    let state = hash;

    const nextRandom = () => {
        state = ((a * state + c) >>> 0) % m; // unsigned to prevent negative values
        return Math.abs(state) / m;
    };

    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(nextRandom() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
