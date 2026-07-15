import { describe, it, expect } from 'vitest';
import { parseShaderError } from '../src/app/ErrorOverlay';

// Compiled-shader layout for these tests:
//   common.glsl occupies compiled lines 30..34 (5 lines)
//   user code starts at compiled line 40
const MAPPING = { commonStartLine: 30, commonLines: 5, userCodeStartLine: 40 };

describe('parseShaderError line translation', () => {
  it('translates a user-code error to a user-relative line', () => {
    const out = parseShaderError("ERROR: 0:45: 'foo' : undeclared identifier", MAPPING);
    expect(out).toContain('Line 6:'); // 45 - 40 + 1
    expect(out).not.toContain('45');
  });

  it('translates a common.glsl error to a common-relative line (never negative)', () => {
    const out = parseShaderError("ERROR: 0:32: 'bar' : syntax error", MAPPING);
    expect(out).toContain('common.glsl line 3:'); // 32 - 30 + 1
    expect(out).not.toMatch(/-\d/);
  });

  it('translates each error line independently in multi-error messages', () => {
    const out = parseShaderError(
      "ERROR: 0:31: 'a' : syntax error\nERROR: 0:50: 'b' : undeclared identifier",
      MAPPING,
    );
    expect(out).toContain('common.glsl line 2:');
    expect(out).toContain('Line 11:'); // 50 - 40 + 1
  });

  it('labels preamble errors instead of producing bogus user lines', () => {
    const out = parseShaderError("ERROR: 0:10: 'iTime' : redefinition", MAPPING);
    expect(out).toContain('Generated preamble line 10:');
  });

  it('handles the no-common-code mapping', () => {
    const out = parseShaderError(
      "ERROR: 0:25: 'x' : syntax error",
      { commonStartLine: 0, commonLines: 0, userCodeStartLine: 20 },
    );
    expect(out).toContain('Line 6:');
  });
});
