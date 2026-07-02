/**
 * Wraps a Supabase query result into a consistent { data, error } shape.
 * Throws never — always returns the shape so callers can handle errors uniformly.
 *
 * @param {Promise<{data, error}>} queryPromise
 * @returns {Promise<{data: any|null, error: string|null}>}
 */
export async function handleQuery(queryPromise) {
  try {
    const { data, error } = await queryPromise;
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message ?? 'Unexpected error' };
  }
}

/**
 * Pagination helper — converts page/pageSize to Supabase range params.
 * @param {number} page      1-based page number
 * @param {number} pageSize  rows per page
 * @returns {{ from: number, to: number }}
 */
export function pageRange(page = 1, pageSize = 10) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Strips undefined keys from an object so Supabase doesn't receive them as null.
 * @param {object} obj
 * @returns {object}
 */
export function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
