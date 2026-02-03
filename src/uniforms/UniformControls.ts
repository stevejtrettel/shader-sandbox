/**
 * Uniform Controls Component
 *
 * Renders UI controls for custom uniforms defined in config.json.
 * Supports: float, int, bool, vec2 (XY pad), vec3 (color picker or sliders), vec4 (sliders)
 */

import './uniform-controls.css';

import {
  UniformDefinitions,
  UniformDefinition,
  UniformValue,
  UniformValues,
  FloatUniformDefinition,
  IntUniformDefinition,
  BoolUniformDefinition,
  Vec2UniformDefinition,
  Vec3UniformDefinition,
  Vec4UniformDefinition,
  isArrayUniform,
} from '../project/types';

export interface UniformControlsOptions {
  /** Container element to mount controls into */
  container: HTMLElement;
  /** Uniform definitions from project config */
  uniforms: UniformDefinitions;
  /** Callback when a uniform value changes */
  onChange: (name: string, value: UniformValue) => void;
  /** Initial values (optional, defaults to definition values) */
  initialValues?: UniformValues;
}

interface SliderRowResult {
  element: HTMLElement;
  update: (value: number) => void;
}

export class UniformControls {
  private container: HTMLElement;
  private uniforms: UniformDefinitions;
  private onChange: (name: string, value: UniformValue) => void;
  private values: UniformValues = {};
  private updaters: Map<string, (value: UniformValue) => void> = new Map();

  // Track document-level event listeners for cleanup
  private documentListeners: Array<{ type: string; handler: EventListener }> = [];

  constructor(opts: UniformControlsOptions) {
    this.container = opts.container;
    this.uniforms = opts.uniforms;
    this.onChange = opts.onChange;

    // Initialize values
    for (const [name, def] of Object.entries(this.uniforms)) {
      if (isArrayUniform(def) || def.hidden) continue;
      this.values[name] = opts.initialValues?.[name] ?? def.value;
    }

    this.render();
  }

  /**
   * Render all uniform controls.
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'uniform-controls';

    const uniformEntries = Object.entries(this.uniforms);

    if (uniformEntries.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'uniform-controls-empty';
      emptyMsg.textContent = 'No uniforms defined';
      this.container.appendChild(emptyMsg);
      return;
    }

    // Header with reset button
    const header = document.createElement('div');
    header.className = 'uniform-controls-header';

    const resetButton = document.createElement('button');
    resetButton.className = 'uniform-controls-reset';
    resetButton.textContent = 'Reset';
    resetButton.title = 'Reset all uniforms to defaults';
    resetButton.addEventListener('click', () => this.resetToDefaults());

    header.appendChild(resetButton);
    this.container.appendChild(header);

    // Control list
    const controlList = document.createElement('div');
    controlList.className = 'uniform-controls-list';

    for (const [name, def] of uniformEntries) {
      if (isArrayUniform(def) || def.hidden) continue;
      const result = this.createControl(name, def);
      if (result) {
        this.updaters.set(name, result.update);
        controlList.appendChild(result.element);
      }
    }

    this.container.appendChild(controlList);
  }

  /**
   * Create a control element for a uniform.
   */
  private createControl(name: string, def: UniformDefinition): { element: HTMLElement; update: (v: UniformValue) => void } | null {
    if (isArrayUniform(def) || def.hidden) return null;
    switch (def.type) {
      case 'float':
        return this.createFloatSlider(name, def);
      case 'int':
        return this.createIntSlider(name, def);
      case 'bool':
        return this.createBoolToggle(name, def);
      case 'vec2':
        return this.createVec2Pad(name, def);
      case 'vec3':
        return def.color ? this.createColorPicker(name, def) : this.createVecSliders(name, def, 3);
      case 'vec4':
        return def.color ? this.createColorPicker4(name, def) : this.createVecSliders(name, def, 4);
      default:
        console.warn(`Uniform '${name}': unknown type '${(def as any).type}'`);
        return null;
    }
  }

  // ===========================================================================
  // Shared Slider Row Helper
  // ===========================================================================

  private createSliderRow(opts: {
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    format: (v: number) => string;
    onInput: (v: number) => void;
  }): SliderRowResult {
    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = opts.label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = opts.format(opts.value);

    wrapper.appendChild(labelEl);
    wrapper.appendChild(valueDisplay);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'uniform-control-slider';
    slider.min = String(opts.min);
    slider.max = String(opts.max);
    slider.step = String(opts.step);
    slider.value = String(opts.value);

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      opts.onInput(v);
      valueDisplay.textContent = opts.format(v);
    });

    const container = document.createElement('div');
    container.appendChild(wrapper);
    container.appendChild(slider);

    const update = (v: number) => {
      slider.value = String(v);
      valueDisplay.textContent = opts.format(v);
    };

    return { element: container, update };
  }

  // ===========================================================================
  // Float Slider
  // ===========================================================================

  private createFloatSlider(name: string, def: FloatUniformDefinition): { element: HTMLElement; update: (v: UniformValue) => void } {
    const step = def.step ?? 0.01;
    const { element, update: sliderUpdate } = this.createSliderRow({
      label: def.label ?? name,
      min: def.min ?? 0,
      max: def.max ?? 1,
      step,
      value: this.values[name] as number,
      format: (v) => this.formatNumber(v, step),
      onInput: (v) => {
        this.values[name] = v;
        this.onChange(name, v);
      },
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-float';
    wrapper.appendChild(element);

    return {
      element: wrapper,
      update: (v) => sliderUpdate(v as number),
    };
  }

  // ===========================================================================
  // Int Slider
  // ===========================================================================

  private createIntSlider(name: string, def: IntUniformDefinition): { element: HTMLElement; update: (v: UniformValue) => void } {
    const { element, update: sliderUpdate } = this.createSliderRow({
      label: def.label ?? name,
      min: def.min ?? 0,
      max: def.max ?? 10,
      step: def.step ?? 1,
      value: this.values[name] as number,
      format: (v) => String(Math.round(v)),
      onInput: (v) => {
        const intVal = Math.round(v);
        this.values[name] = intVal;
        this.onChange(name, intVal);
      },
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-int';
    wrapper.appendChild(element);

    return {
      element: wrapper,
      update: (v) => sliderUpdate(v as number),
    };
  }

  // ===========================================================================
  // Bool Toggle
  // ===========================================================================

  private createBoolToggle(name: string, def: BoolUniformDefinition): { element: HTMLElement; update: (v: UniformValue) => void } {
    const value = this.values[name] as boolean;
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-bool';

    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const toggleWrapper = document.createElement('label');
    toggleWrapper.className = 'uniform-control-toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = value;

    const slider = document.createElement('span');
    slider.className = 'uniform-control-toggle-slider';

    checkbox.addEventListener('change', () => {
      const newValue = checkbox.checked;
      this.values[name] = newValue;
      this.onChange(name, newValue);
    });

    toggleWrapper.appendChild(checkbox);
    toggleWrapper.appendChild(slider);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(toggleWrapper);

    wrapper.appendChild(labelRow);

    return {
      element: wrapper,
      update: (v) => { checkbox.checked = v as boolean; },
    };
  }

  // ===========================================================================
  // Vec2 XY Pad
  // ===========================================================================

  private createVec2Pad(name: string, def: Vec2UniformDefinition): { element: HTMLElement; update: (v: UniformValue) => void } {
    const value = this.values[name] as number[];
    const min = def.min ?? [0, 0];
    const max = def.max ?? [1, 1];
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-vec2';

    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = this.formatVec2(value);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueDisplay);

    const padContainer = document.createElement('div');
    padContainer.className = 'uniform-control-xy-pad';

    const handle = document.createElement('div');
    handle.className = 'uniform-control-xy-handle';

    padContainer.appendChild(handle);

    const positionHandle = (v: number[]) => {
      const xPercent = ((v[0] - min[0]) / (max[0] - min[0])) * 100;
      const yPercent = (1 - (v[1] - min[1]) / (max[1] - min[1])) * 100;
      handle.style.left = `${xPercent}%`;
      handle.style.top = `${yPercent}%`;
    };
    positionHandle(value);

    let isDragging = false;

    const updateFromEvent = (e: MouseEvent | TouchEvent) => {
      const rect = padContainer.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      let xPercent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let yPercent = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      const newX = min[0] + xPercent * (max[0] - min[0]);
      const newY = min[1] + (1 - yPercent) * (max[1] - min[1]);

      const newValue = [newX, newY];
      this.values[name] = newValue;

      handle.style.left = `${xPercent * 100}%`;
      handle.style.top = `${yPercent * 100}%`;
      valueDisplay.textContent = this.formatVec2(newValue);

      this.onChange(name, newValue);
    };

    const onMouseDown = (e: MouseEvent) => { isDragging = true; updateFromEvent(e); e.preventDefault(); };
    const onMouseMove = (e: Event) => { if (isDragging) updateFromEvent(e as MouseEvent); };
    const onMouseUp = () => { isDragging = false; };

    padContainer.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    this.documentListeners.push({ type: 'mousemove', handler: onMouseMove });
    this.documentListeners.push({ type: 'mouseup', handler: onMouseUp });

    const onTouchStart = (e: TouchEvent) => { isDragging = true; updateFromEvent(e); e.preventDefault(); };
    const onTouchMove = (e: TouchEvent) => { if (isDragging) updateFromEvent(e); };

    padContainer.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove as EventListener);
    document.addEventListener('touchend', onMouseUp);
    this.documentListeners.push({ type: 'touchmove', handler: onTouchMove as EventListener });
    this.documentListeners.push({ type: 'touchend', handler: onMouseUp });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(padContainer);

    return {
      element: wrapper,
      update: (v) => {
        const vec = v as number[];
        positionHandle(vec);
        valueDisplay.textContent = this.formatVec2(vec);
      },
    };
  }

  // ===========================================================================
  // Vec3 Color Picker
  // ===========================================================================

  private createColorPicker(name: string, def: Vec3UniformDefinition): { element: HTMLElement; update: (v: UniformValue) => void } {
    const value = this.values[name] as number[];
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-color';

    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = this.rgbToHex(value);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueDisplay);

    const colorWrapper = document.createElement('div');
    colorWrapper.className = 'uniform-control-color-wrapper';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'uniform-control-color-input';
    colorInput.value = this.rgbToHex(value);

    const swatch = document.createElement('div');
    swatch.className = 'uniform-control-color-swatch';
    swatch.style.backgroundColor = this.rgbToHex(value);

    colorInput.addEventListener('input', () => {
      const newValue = this.hexToRgb(colorInput.value);
      this.values[name] = newValue;
      valueDisplay.textContent = colorInput.value;
      swatch.style.backgroundColor = colorInput.value;
      this.onChange(name, newValue);
    });

    swatch.addEventListener('click', () => colorInput.click());

    colorWrapper.appendChild(swatch);
    colorWrapper.appendChild(colorInput);

    wrapper.appendChild(labelRow);
    wrapper.appendChild(colorWrapper);

    return {
      element: wrapper,
      update: (v) => {
        const hex = this.rgbToHex(v as number[]);
        colorInput.value = hex;
        swatch.style.backgroundColor = hex;
        valueDisplay.textContent = hex;
      },
    };
  }

  // ===========================================================================
  // Vec4 Color Picker (with alpha)
  // ===========================================================================

  private createColorPicker4(name: string, def: Vec4UniformDefinition): { element: HTMLElement; update: (v: UniformValue) => void } {
    // Build RGB color picker + alpha slider from scratch (no cloneNode hacks)
    const value = this.values[name] as number[];
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-color';

    // Label row
    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = this.rgbToHex(value);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueDisplay);

    // Color picker for RGB
    const colorWrapper = document.createElement('div');
    colorWrapper.className = 'uniform-control-color-wrapper';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'uniform-control-color-input';
    colorInput.value = this.rgbToHex(value);

    const swatch = document.createElement('div');
    swatch.className = 'uniform-control-color-swatch';
    swatch.style.backgroundColor = this.rgbToHex(value);

    colorInput.addEventListener('input', () => {
      const rgb = this.hexToRgb(colorInput.value);
      const current = this.values[name] as number[];
      current[0] = rgb[0]; current[1] = rgb[1]; current[2] = rgb[2];
      valueDisplay.textContent = colorInput.value;
      swatch.style.backgroundColor = colorInput.value;
      this.onChange(name, [...current]);
    });

    swatch.addEventListener('click', () => colorInput.click());

    colorWrapper.appendChild(swatch);
    colorWrapper.appendChild(colorInput);

    // Alpha slider
    const alphaStep = def.step?.[3] ?? 0.01;
    const { element: alphaEl, update: alphaUpdate } = this.createSliderRow({
      label: 'Alpha',
      min: def.min?.[3] ?? 0,
      max: def.max?.[3] ?? 1,
      step: alphaStep,
      value: value[3],
      format: (v) => this.formatNumber(v, alphaStep),
      onInput: (v) => {
        const current = this.values[name] as number[];
        current[3] = v;
        this.onChange(name, [...current]);
      },
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(colorWrapper);
    wrapper.appendChild(alphaEl);

    return {
      element: wrapper,
      update: (v) => {
        const vec = v as number[];
        const hex = this.rgbToHex(vec);
        colorInput.value = hex;
        swatch.style.backgroundColor = hex;
        valueDisplay.textContent = hex;
        alphaUpdate(vec[3]);
      },
    };
  }

  // ===========================================================================
  // Vec3/Vec4 Component Sliders
  // ===========================================================================

  private createVecSliders(name: string, def: Vec3UniformDefinition | Vec4UniformDefinition, count: 3 | 4): { element: HTMLElement; update: (v: UniformValue) => void } {
    const value = this.values[name] as number[];
    const label = def.label ?? name;
    const components = count === 3 ? ['X', 'Y', 'Z'] : ['X', 'Y', 'Z', 'W'];

    const wrapper = document.createElement('div');
    wrapper.className = `uniform-control uniform-control-vec${count}`;

    const labelEl = document.createElement('div');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);

    const sliderUpdaters: Array<(v: number) => void> = [];

    components.forEach((comp, i) => {
      const step = def.step?.[i] ?? 0.01;
      const { element: row, update: rowUpdate } = this.createSliderRow({
        label: comp,
        min: def.min?.[i] ?? 0,
        max: def.max?.[i] ?? 1,
        step,
        value: value[i],
        format: (v) => this.formatNumber(v, step),
        onInput: (v) => {
          const currentValue = this.values[name] as number[];
          currentValue[i] = v;
          this.onChange(name, [...currentValue]);
        },
      });

      // Style the row for vec component layout
      const labelRow = row.querySelector('.uniform-control-label-row');
      if (labelRow) {
        labelRow.classList.add('uniform-control-vec-slider-row');
        const lbl = labelRow.querySelector('.uniform-control-label');
        if (lbl) {
          lbl.classList.add('uniform-control-vec-component');
        }
        const val = labelRow.querySelector('.uniform-control-value');
        if (val) {
          val.classList.add('uniform-control-vec-value');
        }
      }
      const slider = row.querySelector('.uniform-control-slider');
      if (slider) {
        slider.classList.add('uniform-control-vec-slider');
      }

      sliderUpdaters.push(rowUpdate);
      wrapper.appendChild(row);
    });

    return {
      element: wrapper,
      update: (v) => {
        const vec = v as number[];
        sliderUpdaters.forEach((upd, i) => upd(vec[i]));
      },
    };
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private formatNumber(value: number, step: number): string {
    const stepStr = String(step);
    const decimalIndex = stepStr.indexOf('.');
    const decimals = decimalIndex === -1 ? 0 : stepStr.length - decimalIndex - 1;
    return value.toFixed(decimals);
  }

  private formatVec2(value: number[]): string {
    return `(${value[0].toFixed(2)}, ${value[1].toFixed(2)})`;
  }

  private rgbToHex(rgb: number[]): string {
    const r = Math.round(rgb[0] * 255);
    const g = Math.round(rgb[1] * 255);
    const b = Math.round(rgb[2] * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Update a uniform value externally (e.g., from reset).
   */
  setValue(name: string, value: UniformValue): void {
    if (!(name in this.uniforms)) return;
    this.values[name] = value;
    this.updaters.get(name)?.(value);
  }

  /**
   * Reset all uniforms to their default values.
   */
  resetToDefaults(): void {
    for (const [name, def] of Object.entries(this.uniforms)) {
      if (isArrayUniform(def) || def.hidden) continue;
      this.setValue(name, def.value);
      this.onChange(name, def.value);
    }
  }

  /**
   * Destroy the controls and clean up.
   */
  destroy(): void {
    for (const { type, handler } of this.documentListeners) {
      document.removeEventListener(type, handler);
    }
    this.documentListeners = [];

    this.container.innerHTML = '';
    this.updaters.clear();
  }
}
