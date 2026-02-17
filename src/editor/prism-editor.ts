/**
 * Lightweight Prism Editor
 *
 * Simple textarea with Prism syntax highlighting overlay.
 * Uses the existing Prism.js dependency - adds ~0 extra bytes to bundle.
 */

import * as Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

import './prism-editor.css';

export interface EditorInstance {
  getSource: () => string;
  setSource: (source: string) => void;
  destroy: () => void;
}

/**
 * Create a lightweight editor with Prism syntax highlighting.
 */
export function createEditor(
  container: HTMLElement,
  initialSource: string,
  onChange?: (source: string) => void
): EditorInstance {
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'prism-editor-wrapper';

  // Create line numbers
  const lineNumbers = document.createElement('div');
  lineNumbers.className = 'prism-editor-line-numbers';

  // Create editor area (textarea + highlighted overlay)
  const editorArea = document.createElement('div');
  editorArea.className = 'prism-editor-area';

  // Create textarea (user types here)
  const textarea = document.createElement('textarea');
  textarea.className = 'prism-editor-textarea';
  textarea.value = initialSource;
  textarea.spellcheck = false;
  textarea.autocapitalize = 'off';
  textarea.autocomplete = 'off';

  // Create highlighted code overlay (use div, not pre, to prevent Prism.js
  // from adding language-* class and tabindex to the parent, which causes
  // external CSS to add padding/margin that desync the textarea overlay)
  const highlight = document.createElement('div');
  highlight.className = 'prism-editor-highlight';
  const code = document.createElement('code');
  code.className = 'language-cpp';
  highlight.appendChild(code);

  // Assemble
  editorArea.appendChild(textarea);
  editorArea.appendChild(highlight);
  wrapper.appendChild(lineNumbers);
  wrapper.appendChild(editorArea);
  container.appendChild(wrapper);

  // Update highlighting and line numbers
  function update() {
    const source = textarea.value;

    // Update highlighted code
    // Add a trailing newline to prevent layout shift when typing at end
    code.textContent = source + '\n';
    Prism.highlightElement(code);

    // Update line numbers
    const lines = source.split('\n');
    lineNumbers.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');

    // Notify listener
    if (onChange) {
      onChange(source);
    }
  }

  // Sync scroll position
  function syncScroll() {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
    lineNumbers.scrollTop = textarea.scrollTop;
  }

  // Handle tab key for indentation
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Insert 2 spaces
      textarea.value = value.substring(0, start) + '  ' + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      update();
    }
  }

  // Set up event listeners
  textarea.addEventListener('input', update);
  textarea.addEventListener('scroll', syncScroll);
  textarea.addEventListener('keydown', handleKeydown);

  // Initial render
  update();

  return {
    getSource: () => textarea.value,
    setSource: (source: string) => {
      textarea.value = source;
      update();
    },
    destroy: () => {
      textarea.removeEventListener('input', update);
      textarea.removeEventListener('scroll', syncScroll);
      textarea.removeEventListener('keydown', handleKeydown);
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    },
  };
}
