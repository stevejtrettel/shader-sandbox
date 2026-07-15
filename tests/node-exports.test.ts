import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as nodeEntry from '../src/node';

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * The `node` export condition serves src/node.ts wherever the browser build
 * serves src/index.ts. Every VALUE export of index.ts must therefore exist in
 * node.ts too, or `import { x } from 'shader-sandbox'` becomes a SyntaxError
 * under Node/SSR. (Audit finding C3/L9.)
 */
function indexValueExports(): string[] {
  const src = readFileSync(join(TESTS_DIR, '..', 'src', 'index.ts'), 'utf8');
  const names: string[] = [];
  // Match `export { a, b, c }` (with or without `from`), skipping `export type {...}`
  const re = /^export \{([^}]+)\}/gm;
  for (const match of src.matchAll(re)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim();
      if (name) names.push(name.split(/\s+as\s+/).pop()!.trim());
    }
  }
  return names;
}

describe('node entry parity', () => {
  it('exports every value that the browser entry exports', () => {
    const expected = indexValueExports();
    expect(expected.length).toBeGreaterThan(5); // sanity: the regex found the barrel
    const actual = new Set(Object.keys(nodeEntry));
    const missing = expected.filter((name) => !actual.has(name));
    expect(missing).toEqual([]);
  });

  it('type guards are the real implementations (shared with the browser build)', async () => {
    const types = await import('../src/project/types');
    expect(nodeEntry.isArrayUniform).toBe(types.isArrayUniform);
    expect(nodeEntry.isStructArrayUniform).toBe(types.isStructArrayUniform);
    expect(nodeEntry.isAnyUBOUniform).toBe(types.isAnyUBOUniform);
  });

  it('browser-only APIs throw a clear error instead of crashing on missing DOM', () => {
    expect(() => nodeEntry.mount(null as any, null as any)).toThrow(/browser-only/);
    expect(() => nodeEntry.loadDemo()).toThrow(/browser-only/);
  });
});
