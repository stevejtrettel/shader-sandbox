/**
 * Shared form builders for the Screenshot and Recording panels.
 *
 * Helpers are parameterized by class PREFIX ('screenshot' | 'recording') and
 * emit exactly the class names each panel's stylesheet already targets, so
 * consolidating the TS carries zero visual-regression risk. (Merging the two
 * near-identical stylesheets is deferred until panel styling is revisited.)
 */

// Resolution presets: [label, width, height]
export const RESOLUTION_PRESETS: [string, number, number][] = [
  ['720p', 1280, 720],
  ['1080p', 1920, 1080],
  ['1440p', 2560, 1440],
  ['4K', 3840, 2160],
  ['8K', 7680, 4320],
];

export type PanelPrefix = 'screenshot' | 'recording';

/** Section with a small uppercase label. */
export function createSection(prefix: PanelPrefix, label: string): HTMLElement {
  const section = document.createElement('div');
  section.className = `${prefix}-section`;
  const lbl = document.createElement('div');
  lbl.className = `${prefix}-section-label`;
  lbl.textContent = label;
  section.appendChild(lbl);
  return section;
}

/** Collapsible section (starts collapsed); content div is `${prefix}-section-content`. */
export function createCollapsibleSection(prefix: PanelPrefix, label: string): HTMLElement {
  const section = document.createElement('div');
  section.className = `${prefix}-section ${prefix}-collapsible collapsed`;

  const header = document.createElement('div');
  header.className = `${prefix}-collapsible-header`;
  header.innerHTML = `<span class="${prefix}-collapsible-arrow">&#9654;</span> ${label}`;
  header.addEventListener('click', () => {
    section.classList.toggle('collapsed');
  });

  const content = document.createElement('div');
  content.className = `${prefix}-section-content`;

  section.appendChild(header);
  section.appendChild(content);
  return section;
}

export function createNumberInput(
  prefix: PanelPrefix,
  defaultVal: number,
  min: number,
  max: number,
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.className = `${prefix}-input`;
  input.value = String(Math.round(defaultVal));
  input.min = String(min);
  input.max = String(max);
  return input;
}

/** Panel shell: backdrop, panel, and header with title + close button. */
export function createPanelShell(opts: {
  prefix: PanelPrefix;
  titleHTML: string;
  onClose: () => void;
  /** Called on a click on the bare backdrop (outside the panel). */
  onBackdropClick: () => void;
}): { backdrop: HTMLElement; panel: HTMLElement; header: HTMLElement } {
  const { prefix } = opts;

  const backdrop = document.createElement('div');
  backdrop.className = `${prefix}-panel-backdrop`;
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) opts.onBackdropClick();
  });

  const panel = document.createElement('div');
  panel.className = `${prefix}-panel`;

  const header = document.createElement('div');
  header.className = `${prefix}-panel-header`;
  header.innerHTML = `<div class="${prefix}-panel-title">${opts.titleHTML}</div>`;

  const closeBtn = document.createElement('button');
  closeBtn.className = `${prefix}-panel-close`;
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => opts.onClose());
  header.appendChild(closeBtn);

  panel.appendChild(header);
  backdrop.appendChild(panel);
  return { backdrop, panel, header };
}

export interface ResolutionControls {
  section: HTMLElement;
  presetSelect: HTMLSelectElement;
  widthInput: HTMLInputElement;
  heightInput: HTMLInputElement;
}

/**
 * Full Resolution section: preset dropdown + W×H inputs with aspect lock.
 * Aspect-lock state lives in a closure; callers read the inputs' values.
 */
export function createResolutionSection(opts: {
  prefix: PanelPrefix;
  canvasWidth: number;
  canvasHeight: number;
  /** Called after any resolution change (preset or manual input). */
  onChange?: () => void;
}): ResolutionControls {
  const { prefix, canvasWidth, canvasHeight } = opts;
  const section = createSection(prefix, 'Resolution');

  let aspectLocked = true;
  let aspectRatio = canvasWidth / canvasHeight;

  // Preset dropdown
  const presetSelect = document.createElement('select');
  presetSelect.className = `${prefix}-input ${prefix}-select`;
  const currentOpt = document.createElement('option');
  currentOpt.value = 'current';
  currentOpt.textContent = `Current (${canvasWidth}×${canvasHeight})`;
  presetSelect.appendChild(currentOpt);

  for (const [label, w, h] of RESOLUTION_PRESETS) {
    const opt = document.createElement('option');
    opt.value = `${w}x${h}`;
    opt.textContent = `${label} (${w}×${h})`;
    presetSelect.appendChild(opt);
  }

  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = 'Custom';
  presetSelect.appendChild(customOpt);
  section.appendChild(presetSelect);

  // W × H row with aspect lock
  const row = document.createElement('div');
  row.className = `${prefix}-res-row`;

  const widthInput = createNumberInput(prefix, canvasWidth, 1, 7680);
  const heightInput = createNumberInput(prefix, canvasHeight, 1, 4320);

  presetSelect.addEventListener('change', () => {
    const val = presetSelect.value;
    if (val === 'current') {
      widthInput.value = String(canvasWidth);
      heightInput.value = String(canvasHeight);
      aspectRatio = canvasWidth / canvasHeight;
    } else if (val !== 'custom') {
      const [w, h] = val.split('x').map(Number);
      widthInput.value = String(w);
      heightInput.value = String(h);
      aspectRatio = w / h;
    }
    opts.onChange?.();
  });

  widthInput.addEventListener('input', () => {
    presetSelect.value = 'custom';
    if (aspectLocked) {
      const w = parseInt(widthInput.value) || 1;
      heightInput.value = String(Math.round(w / aspectRatio));
    }
    opts.onChange?.();
  });
  heightInput.addEventListener('input', () => {
    presetSelect.value = 'custom';
    if (aspectLocked) {
      const h = parseInt(heightInput.value) || 1;
      widthInput.value = String(Math.round(h * aspectRatio));
    }
    opts.onChange?.();
  });

  const xLabel = document.createElement('span');
  xLabel.className = `${prefix}-dim-separator`;
  xLabel.textContent = '×';

  const lockButton = document.createElement('button');
  lockButton.className = `${prefix}-aspect-lock active`;
  lockButton.title = 'Lock aspect ratio';
  lockButton.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
  </svg>`;
  lockButton.addEventListener('click', () => {
    aspectLocked = !aspectLocked;
    lockButton.classList.toggle('active', aspectLocked);
    if (aspectLocked) {
      const w = parseInt(widthInput.value) || 1;
      const h = parseInt(heightInput.value) || 1;
      aspectRatio = w / h;
    }
  });

  row.appendChild(widthInput);
  row.appendChild(xLabel);
  row.appendChild(heightInput);
  row.appendChild(lockButton);
  section.appendChild(row);

  return { section, presetSelect, widthInput, heightInput };
}

export interface ProgressBar {
  el: HTMLElement;
  bar: HTMLElement;
  text: HTMLElement;
  show(text: string): void;
  hide(): void;
  update(frame: number, total: number, label?: string): void;
  fail(message: string): void;
}

export function createProgressBar(prefix: PanelPrefix): ProgressBar {
  const el = document.createElement('div');
  el.className = `${prefix}-progress`;
  el.innerHTML = `
    <div class="${prefix}-progress-bar-bg"><div class="${prefix}-progress-bar"></div></div>
    <div class="${prefix}-progress-text">Preparing...</div>
  `;
  const bar = el.querySelector<HTMLElement>(`.${prefix}-progress-bar`)!;
  const text = el.querySelector<HTMLElement>(`.${prefix}-progress-text`)!;

  return {
    el,
    bar,
    text,
    show(msg: string): void {
      el.classList.add('active');
      bar.style.width = '0%';
      bar.style.background = '';
      text.textContent = msg;
    },
    hide(): void {
      el.classList.remove('active');
    },
    update(frame: number, total: number, label = 'Frame'): void {
      const pct = (frame / total) * 100;
      bar.style.width = `${pct}%`;
      text.textContent = `${label} ${frame} / ${total} (${Math.round(pct)}%)`;
    },
    fail(message: string): void {
      text.textContent = message;
      bar.style.background = '#c62828';
    },
  };
}
