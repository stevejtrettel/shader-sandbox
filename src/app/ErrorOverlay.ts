/**
 * ErrorOverlay - Shader compilation error display
 *
 * Shows shader compilation errors in a dismissible overlay with
 * source context, user-friendly error messages, and line mapping.
 */

import type { LineMapping } from '../engine/ShaderEngine';
import type { ShaderProject } from '../project/types';

/** Error info as provided by the engine. */
export interface CompilationError {
  passName: string;
  error: string;
  source: string;
  isFromCommon: boolean;
  originalLine: number | null;
  lineMapping: LineMapping;
}

export class ErrorOverlay {
  private container: HTMLElement;
  private overlay: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Display shader compilation errors in an overlay.
   */
  show(errors: CompilationError[], project: ShaderProject): void {
    // Create overlay if it doesn't exist
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'shader-error-overlay';
      this.container.appendChild(this.overlay);
    }

    // Group errors: separate common.glsl errors from pass-specific errors
    const commonErrors = errors.filter(e => e.isFromCommon);
    const passErrors = errors.filter(e => !e.isFromCommon);

    // Deduplicate common errors (same error reported for multiple passes)
    const uniqueCommonErrors = commonErrors.length > 0 ? [commonErrors[0]] : [];

    // Combine: show common errors first, then pass-specific errors
    const allErrors = [...uniqueCommonErrors, ...passErrors];

    // Parse and format errors with source context.
    // The engine stores the RAW compiler message (compiled-source line
    // numbers); parseShaderError translates each error line exactly once
    // via the line mapping. originalLine (pre-translated by the engine for
    // the first error) is used only to anchor the code-context box.
    const formattedErrors = allErrors.map(({passName, error, isFromCommon, originalLine, lineMapping}) => {
      const glslError = error.replace('Shader compilation failed:\n', '');

      // Get user's original source for code context
      let userSource: string | null = null;
      if (isFromCommon) {
        userSource = project.commonSource;
      } else {
        const pass = project.passes[passName as 'Image' | 'BufferA' | 'BufferB' | 'BufferC' | 'BufferD'];
        userSource = pass?.glslSource ?? null;
      }

      return {
        passName: isFromCommon ? 'common.glsl' : passName,
        error: parseShaderError(glslError, lineMapping),
        codeContext: originalLine !== null && userSource
          ? buildCodeContext(userSource, originalLine)
          : null,
      };
    });

    // Build error HTML
    const errorHTML = formattedErrors.map(({passName, error, codeContext}) => `
      <div class="error-section">
        <div class="error-pass-name">${passName}</div>
        <pre class="error-content">${escapeHTML(error)}</pre>
        ${codeContext ? `<pre class="error-code-context">${codeContext}</pre>` : ''}
      </div>
    `).join('');

    this.overlay.innerHTML = `
      <div class="error-overlay-content">
        <div class="error-header">
          <span class="error-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM3.5 7.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9z"/>
            </svg>
            Shader Compilation Failed
          </span>
          <button class="error-close" title="Dismiss">×</button>
        </div>
        <div class="error-body">
          ${errorHTML}
        </div>
      </div>
    `;

    // Add close button handler
    const closeButton = this.overlay.querySelector('.error-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
  }

  /**
   * Hide the error overlay.
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.hide();
  }
}

/**
 * Parse WebGL error messages into user-friendly format with correct line numbers.
 *
 * Each ERROR line carries a compiled-source line number; classify it per
 * line (common range / user range / generated preamble) so multi-error
 * messages spanning common.glsl and pass code all translate correctly.
 */
export function parseShaderError(error: string, lineMapping: LineMapping): string {
  const { commonStartLine, commonLines, userCodeStartLine } = lineMapping;

  return error.split('\n').map(line => {
    const match = line.match(/^ERROR:\s*(\d+):(\d+):\s*(.+)$/);
    if (match) {
      const [, , rawLineStr, message] = match;
      const rawLine = parseInt(rawLineStr, 10);

      const inCommon = commonStartLine > 0 && commonLines > 0 &&
        rawLine >= commonStartLine && rawLine < commonStartLine + commonLines;

      if (inCommon) {
        return `common.glsl line ${rawLine - commonStartLine + 1}: ${friendlyGLSLError(message)}`;
      }
      if (userCodeStartLine > 0 && rawLine >= userCodeStartLine) {
        return `Line ${rawLine - userCodeStartLine + 1}: ${friendlyGLSLError(message)}`;
      }
      // Error in engine-generated code (e.g. an injected uniform declaration)
      return `Generated preamble line ${rawLine}: ${friendlyGLSLError(message)}`;
    }
    return line;
  }).join('\n');
}

/**
 * Add helpful hints to common GLSL error messages.
 */
function friendlyGLSLError(msg: string): string {
  if (msg.includes('no matching overloaded function found'))
    return msg + ' (check function name spelling and argument types)';
  if (msg.includes('undeclared identifier'))
    return msg + ' (variable not declared — check spelling)';
  if (msg.includes('syntax error'))
    return msg + ' (check for missing semicolons, brackets, or commas)';
  if (msg.includes('is not a function'))
    return msg + ' (identifier exists but is not callable)';
  if (msg.includes('wrong operand types'))
    return msg + ' (type mismatch — check vec/float/int types)';
  return msg;
}

/**
 * Build code context HTML around an error line (±3 lines) from source.
 */
function buildCodeContext(source: string, errorLine: number): string | null {
  const lines = source.split('\n');
  if (errorLine < 1 || errorLine > lines.length) return null;

  const contextRange = 3;
  const startLine = Math.max(0, errorLine - contextRange - 1);
  const endLine = Math.min(lines.length, errorLine + contextRange);

  const contextLines = lines.slice(startLine, endLine);

  return contextLines.map((line, idx) => {
    const lineNum = startLine + idx + 1;
    const isError = lineNum === errorLine;
    const lineNumPadded = String(lineNum).padStart(4, ' ');
    const escapedLine = escapeHTML(line);

    if (isError) {
      return `<span class="error-line-highlight">${lineNumPadded} │ ${escapedLine}</span>`;
    } else {
      return `<span class="context-line">${lineNumPadded} │ ${escapedLine}</span>`;
    }
  }).join('');
}

/**
 * Escape HTML to prevent XSS.
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
