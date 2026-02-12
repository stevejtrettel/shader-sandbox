(function(){"use strict";try{if(typeof document<"u"){var o=document.createElement("style");o.appendChild(document.createTextNode(':root,[data-theme=light]{--bg-primary: #f5f5f5;--bg-secondary: #ffffff;--bg-tertiary: #f8f8f8;--bg-canvas: #000000;--text-primary: #000000;--text-secondary: #333333;--text-muted: #666666;--text-disabled: #999999;--border-primary: #e0e0e0;--border-secondary: #cccccc;--accent-primary: #4a9eff;--accent-primary-hover: #3a8eef;--accent-primary-active: #2a7edf;--accent-secondary: #7c4dff;--error-bg: #fff0f0;--error-text: #cc0000;--error-border: #ffcccc;--success-bg: #e8f5e9;--success-text: #4caf50;--success-border: #4caf50;--overlay-bg: rgba(0, 0, 0, .75);--overlay-backdrop: rgba(0, 0, 0, .95);--shadow-sm: 0 2px 8px rgba(0, 0, 0, .1);--shadow-md: 0 10px 30px rgba(0, 0, 0, .2);--shadow-lg: 0 20px 60px rgba(0, 0, 0, .25);--code-bg: #ffffff;--code-text: #000000;--code-line-number: #999999;--code-line-border: #e0e0e0;--code-selection: rgba(173, 214, 255, .4);--syntax-comment: #6a9955;--syntax-keyword: #0000ff;--syntax-string: #a31515;--syntax-number: #098658;--syntax-operator: #000000;--syntax-function: #795e26;--syntax-class: #267f99;--syntax-punctuation: #000000;--tab-bg: #f8f8f8;--tab-text: #666666;--tab-text-hover: #333333;--tab-text-active: #000000;--tab-border-active: #4a9eff;--button-bg: transparent;--button-border: #cccccc;--button-text: #666666;--button-bg-hover: #f0f0f0;--button-border-hover: #999999;--button-text-hover: #333333;--recompile-bg: #e8e8e8;--recompile-text: #333333;--recompile-bg-hover: #d8d8d8;--recompile-bg-active: #c8c8c8;--image-viewer-bg: #f5f5f5;--pane-radius: 8px;--pane-shadow: var(--shadow-lg), var(--shadow-sm)}[data-theme=dark]{--bg-primary: #1a1a1a;--bg-secondary: #252525;--bg-tertiary: #2a2a2a;--bg-canvas: #000000;--text-primary: #ffffff;--text-secondary: #e0e0e0;--text-muted: #a0a0a0;--text-disabled: #666666;--border-primary: #3a3a3a;--border-secondary: #4a4a4a;--accent-primary: #4a9eff;--accent-primary-hover: #5aadff;--accent-primary-active: #3a8eef;--accent-secondary: #9c7cff;--error-bg: #3a1a1a;--error-text: #ff6b6b;--error-border: #5a2a2a;--success-bg: #1a3a1a;--success-text: #6bcf6b;--success-border: #2a5a2a;--overlay-bg: rgba(0, 0, 0, .85);--overlay-backdrop: rgba(0, 0, 0, .98);--shadow-sm: 0 2px 8px rgba(0, 0, 0, .3);--shadow-md: 0 10px 30px rgba(0, 0, 0, .4);--shadow-lg: 0 20px 60px rgba(0, 0, 0, .5);--code-bg: #1e1e1e;--code-text: #d4d4d4;--code-line-number: #858585;--code-line-border: #3a3a3a;--code-selection: rgba(38, 79, 120, .6);--syntax-comment: #6a9955;--syntax-keyword: #569cd6;--syntax-string: #ce9178;--syntax-number: #b5cea8;--syntax-operator: #d4d4d4;--syntax-function: #dcdcaa;--syntax-class: #4ec9b0;--syntax-punctuation: #d4d4d4;--tab-bg: #2a2a2a;--tab-text: #a0a0a0;--tab-text-hover: #d0d0d0;--tab-text-active: #ffffff;--tab-border-active: #4a9eff;--button-bg: transparent;--button-border: #4a4a4a;--button-text: #a0a0a0;--button-bg-hover: #3a3a3a;--button-border-hover: #5a5a5a;--button-text-hover: #e0e0e0;--recompile-bg: #3a3a3a;--recompile-text: #e0e0e0;--recompile-bg-hover: #4a4a4a;--recompile-bg-active: #5a5a5a;--image-viewer-bg: #2a2a2a;--pane-radius: 8px;--pane-shadow: var(--shadow-lg), var(--shadow-sm)}[data-theme=system]{--bg-primary: #f5f5f5;--bg-secondary: #ffffff;--bg-tertiary: #f8f8f8;--bg-canvas: #000000;--text-primary: #000000;--text-secondary: #333333;--text-muted: #666666;--text-disabled: #999999;--border-primary: #e0e0e0;--border-secondary: #cccccc;--accent-primary: #4a9eff;--accent-primary-hover: #3a8eef;--accent-primary-active: #2a7edf;--accent-secondary: #7c4dff;--error-bg: #fff0f0;--error-text: #cc0000;--error-border: #ffcccc;--success-bg: #e8f5e9;--success-text: #4caf50;--success-border: #4caf50;--overlay-bg: rgba(0, 0, 0, .75);--overlay-backdrop: rgba(0, 0, 0, .95);--shadow-sm: 0 2px 8px rgba(0, 0, 0, .1);--shadow-md: 0 10px 30px rgba(0, 0, 0, .2);--shadow-lg: 0 20px 60px rgba(0, 0, 0, .25);--code-bg: #ffffff;--code-text: #000000;--code-line-number: #999999;--code-line-border: #e0e0e0;--code-selection: rgba(173, 214, 255, .4);--syntax-comment: #6a9955;--syntax-keyword: #0000ff;--syntax-string: #a31515;--syntax-number: #098658;--syntax-operator: #000000;--syntax-function: #795e26;--syntax-class: #267f99;--syntax-punctuation: #000000;--tab-bg: #f8f8f8;--tab-text: #666666;--tab-text-hover: #333333;--tab-text-active: #000000;--tab-border-active: #4a9eff;--button-bg: transparent;--button-border: #cccccc;--button-text: #666666;--button-bg-hover: #f0f0f0;--button-border-hover: #999999;--button-text-hover: #333333;--recompile-bg: #e8e8e8;--recompile-text: #333333;--recompile-bg-hover: #d8d8d8;--recompile-bg-active: #c8c8c8;--image-viewer-bg: #f5f5f5;--pane-radius: 8px;--pane-shadow: var(--shadow-lg), var(--shadow-sm)}@media (prefers-color-scheme: dark){[data-theme=system]{--bg-primary: #1a1a1a;--bg-secondary: #252525;--bg-tertiary: #2a2a2a;--bg-canvas: #000000;--text-primary: #ffffff;--text-secondary: #e0e0e0;--text-muted: #a0a0a0;--text-disabled: #666666;--border-primary: #3a3a3a;--border-secondary: #4a4a4a;--accent-primary: #4a9eff;--accent-primary-hover: #5aadff;--accent-primary-active: #3a8eef;--accent-secondary: #9c7cff;--error-bg: #3a1a1a;--error-text: #ff6b6b;--error-border: #5a2a2a;--success-bg: #1a3a1a;--success-text: #6bcf6b;--success-border: #2a5a2a;--overlay-bg: rgba(0, 0, 0, .85);--overlay-backdrop: rgba(0, 0, 0, .98);--shadow-sm: 0 2px 8px rgba(0, 0, 0, .3);--shadow-md: 0 10px 30px rgba(0, 0, 0, .4);--shadow-lg: 0 20px 60px rgba(0, 0, 0, .5);--code-bg: #1e1e1e;--code-text: #d4d4d4;--code-line-number: #858585;--code-line-border: #3a3a3a;--code-selection: rgba(38, 79, 120, .6);--syntax-comment: #6a9955;--syntax-keyword: #569cd6;--syntax-string: #ce9178;--syntax-number: #b5cea8;--syntax-operator: #d4d4d4;--syntax-function: #dcdcaa;--syntax-class: #4ec9b0;--syntax-punctuation: #d4d4d4;--tab-bg: #2a2a2a;--tab-text: #a0a0a0;--tab-text-hover: #d0d0d0;--tab-text-active: #ffffff;--tab-border-active: #4a9eff;--button-bg: transparent;--button-border: #4a4a4a;--button-text: #a0a0a0;--button-bg-hover: #3a3a3a;--button-border-hover: #5a5a5a;--button-text-hover: #e0e0e0;--recompile-bg: #3a3a3a;--recompile-text: #e0e0e0;--recompile-bg-hover: #4a4a4a;--recompile-bg-active: #5a5a5a;--image-viewer-bg: #2a2a2a;--pane-radius: 8px;--pane-shadow: var(--shadow-lg), var(--shadow-sm)}}.unstyled{--pane-radius: 0 !important;--pane-shadow: none !important}:root{--glass-bg: rgba(30, 30, 35, .65);--glass-bg-hover: rgba(30, 30, 35, .8);--glass-border: 1px solid rgba(255, 255, 255, .1);--glass-shadow: 0 4px 16px rgba(0, 0, 0, .25), 0 2px 4px rgba(0, 0, 0, .15), inset 0 1px 0 rgba(255, 255, 255, .1);--glass-shadow-sm: 0 2px 8px rgba(0, 0, 0, .25), inset 0 1px 0 rgba(255, 255, 255, .08);--glass-blur: blur(20px);--glass-radius: 6px;--glass-radius-sm: 6px;--glass-text: rgba(255, 255, 255, .9);--glass-text-muted: rgba(255, 255, 255, .6)}.stats-container{position:absolute;bottom:12px;left:12px;z-index:1000;display:flex;flex-direction:column;align-items:flex-start;gap:6px}.fps-counter{padding:6px 10px;background:var(--glass-bg);color:var(--glass-text);font-family:Monaco,Menlo,Courier New,monospace;font-size:11px;font-weight:500;border-radius:var(--glass-radius-sm);border:var(--glass-border);cursor:pointer;-webkit-user-select:none;user-select:none;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm);transition:all .2s ease}.fps-counter:hover{background:var(--glass-bg-hover)}.stats-grid{display:flex;flex-direction:row;gap:6px;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease,visibility .2s;pointer-events:none}.stats-grid.open{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}.stat-item{padding:6px 10px;background:var(--glass-bg);border-radius:var(--glass-radius-sm);border:var(--glass-border);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm);display:flex;flex-direction:column;align-items:center;gap:2px;min-width:48px}.stat-value{color:var(--glass-text);font-family:Monaco,Menlo,Courier New,monospace;font-size:11px;font-weight:600;white-space:nowrap}.stat-label{color:var(--glass-text-muted);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}.playback-controls{position:absolute;bottom:12px;right:12px;z-index:1000}.controls-menu-button{padding:6px 8px;background:var(--glass-bg);color:var(--glass-text);border:var(--glass-border);border-radius:var(--glass-radius-sm);cursor:pointer;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm);transition:all .2s ease;display:flex;align-items:center;justify-content:center;width:44px;height:44px;font-size:20px;font-weight:300;line-height:1}.controls-menu-button:hover{background:var(--glass-bg-hover);transform:scale(1.05)}.controls-menu-button:active{transform:scale(.95)}.controls-grid{position:absolute;bottom:0;right:0;display:grid;grid-template-columns:44px 44px 44px 44px;grid-template-rows:44px 44px;gap:6px;opacity:0;visibility:hidden;transform:scale(.8);transform-origin:bottom right;transition:opacity .2s ease,transform .2s ease,visibility .2s;pointer-events:none}.controls-grid.open{opacity:1;visibility:visible;transform:scale(1);pointer-events:auto}.control-button{padding:6px 8px;background:var(--glass-bg);color:var(--glass-text);border:var(--glass-border);border-radius:var(--glass-radius-sm);cursor:pointer;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm);transition:all .2s ease;display:flex;align-items:center;justify-content:center;width:44px;height:44px}.control-button:hover{background:var(--glass-bg-hover);transform:scale(1.05)}.control-button:active{transform:scale(.95)}.control-button svg{width:16px;height:16px;fill:currentColor}.playback-controls .controls-menu-button{position:relative;z-index:1}.playback-controls.open>.controls-menu-button{opacity:0;pointer-events:none}.shader-error-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:#000000f2;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:60px;overflow-y:auto}.error-overlay-content{background:#1a1a1a;border-radius:6px;max-width:900px;width:100%;display:flex;flex-direction:column;box-shadow:0 20px 60px #000c,0 0 1px #ffffff1a;border:1px solid #2a2a2a;max-height:calc(100vh - 120px)}.error-header{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;background:linear-gradient(135deg,#c62828,#b71c1c);color:#fff;border-radius:6px 6px 0 0;border-bottom:1px solid rgba(0,0,0,.3);box-shadow:0 2px 8px #0003}.error-title{font-size:15px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;display:flex;align-items:center;gap:8px;letter-spacing:-.01em}.error-close{background:transparent;border:none;color:#ffffffe6;font-size:24px;line-height:1;cursor:pointer;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:all .2s ease;opacity:.8}.error-close:hover{background:#ffffff26;opacity:1;transform:scale(1.05)}.error-body{padding:24px;overflow-y:auto;flex:1}.error-section{margin-bottom:24px}.error-section:last-child{margin-bottom:0}.error-pass-name{font-size:13px;font-weight:600;color:#ffa726;font-family:Monaco,Menlo,Courier New,monospace;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #2a2a2a;letter-spacing:.02em}.error-content{margin:0;padding:14px 16px;background:#0f0f0f;border-radius:4px;color:#ff6b6b;font-size:13px;font-family:Monaco,Menlo,Courier New,monospace;line-height:1.6;overflow-x:auto;border:1px solid #2a2a2a;white-space:pre-wrap;word-break:break-word}.error-code-context{margin:12px 0 0;padding:14px 16px;background:#0d0d0d;border-radius:4px;color:#b0b0b0;font-size:12px;font-family:Monaco,Menlo,Courier New,monospace;line-height:1.6;overflow-x:auto;border:1px solid #2a2a2a;white-space:pre}.error-code-context .context-line{color:#666;display:block}.error-code-context .error-line-highlight{color:#fff;background:#c6282840;display:block;font-weight:600;border-left:3px solid #c62828;margin-left:-16px;padding-left:13px}.context-lost-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:#000000e6;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:3000}.context-lost-content{text-align:center;color:#fff;padding:40px}.context-lost-icon{margin-bottom:16px;opacity:.8}.context-lost-spinner{width:48px;height:48px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;margin:0 auto 16px;animation:context-lost-spin 1s linear infinite}@keyframes context-lost-spin{to{transform:rotate(360deg)}}.context-lost-title{font-size:18px;font-weight:600;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.context-lost-message{font-size:14px;opacity:.7;margin-bottom:20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.context-lost-reload{background:#fff;color:#000;border:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;transition:transform .2s,box-shadow .2s;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.context-lost-reload:hover{transform:scale(1.02);box-shadow:0 4px 12px #fff3}.context-lost-reload:active{transform:scale(.98)}.recording-indicator{position:absolute;top:12px;right:12px;z-index:1000;display:flex;align-items:center;gap:6px;padding:6px 10px;background:#dc2626d9;border-radius:var(--glass-radius-sm);border:1px solid rgba(255,100,100,.3);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm)}.recording-dot{width:8px;height:8px;background:#fff;border-radius:50%;animation:recording-pulse 1s ease-in-out infinite}@keyframes recording-pulse{0%,to{opacity:1}50%{opacity:.4}}.recording-text{color:#fff;font-family:Monaco,Menlo,Courier New,monospace;font-size:11px;font-weight:600;letter-spacing:.5px}.control-button.recording{background:#dc2626b3;border-color:#ff64644d}.control-button.recording:hover{background:#dc2626d9}.control-button.recording svg{fill:#fff}.media-permission-banner{position:absolute;bottom:48px;left:50%;transform:translate(-50%);background:var(--glass-bg);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:var(--glass-border);box-shadow:var(--glass-shadow);color:#ffffffe6;padding:8px 16px;border-radius:6px;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;gap:12px;z-index:100;white-space:nowrap}.media-banner-button{background:#4a9effcc;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:13px;font-family:inherit}.media-banner-button:hover{background:#4a9eff}.script-error-overlay{position:absolute;bottom:48px;left:12px;right:12px;z-index:1500;pointer-events:auto}.script-error-content{background:#1a1a1a;border-radius:6px;box-shadow:0 8px 32px #0009,0 0 1px #ffffff1a;border:1px solid #2a2a2a;overflow:hidden}.script-error-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:linear-gradient(135deg,#e65100,#bf360c);color:#fff;border-bottom:1px solid rgba(0,0,0,.3)}.script-error-header.disabled{background:linear-gradient(135deg,#6d4c41,#4e342e)}.script-error-header.warning{background:linear-gradient(135deg,#f9a825,#f57f17);color:#1a1a1a}.script-error-header.warning .script-error-close{color:#000000b3}.script-error-header.warning .script-error-close:hover{background:#00000026;color:#000000e6}.script-error-title{font-size:13px;font-weight:600;font-family:Monaco,Menlo,Courier New,monospace;display:flex;align-items:center;gap:6px}.script-error-close{background:transparent;border:none;color:#ffffffe6;font-size:20px;line-height:1;cursor:pointer;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;opacity:.8;transition:all .2s ease}.script-error-close:hover{background:#ffffff26;opacity:1}.script-error-message{margin:0;padding:10px 14px;color:#ffab91;font-size:12px;font-family:Monaco,Menlo,Courier New,monospace;line-height:1.5;white-space:pre-wrap;word-break:break-word;max-height:80px;overflow-y:auto}.script-error-stack{margin:0;padding:6px 14px 10px;color:#888;font-size:11px;font-family:Monaco,Menlo,Courier New,monospace;line-height:1.4;white-space:pre-wrap;word-break:break-word;max-height:60px;overflow-y:auto;border-top:1px solid #2a2a2a}.script-overlay{position:absolute;z-index:500;padding:6px 10px;background:var(--glass-bg);color:var(--glass-text);font-family:Monaco,Menlo,Courier New,monospace;font-size:11px;border-radius:var(--glass-radius-sm);border:var(--glass-border);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm);pointer-events:none;white-space:pre;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis}.script-overlay.hidden{display:none}.script-overlay.top-left{top:12px;left:12px}.script-overlay.top-right{top:12px;right:12px}.script-overlay.bottom-left{bottom:12px;left:12px}.script-overlay.bottom-right{bottom:12px;right:12px}@media (prefers-reduced-motion: reduce){*,*:before,*:after{transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}@media (max-width: 428px){.stats-container{bottom:8px;left:8px}.playback-controls{bottom:8px;right:8px}.script-error-overlay{left:8px;right:8px;bottom:40px}.script-overlay.top-left{top:8px;left:8px}.script-overlay.top-right{top:8px;right:8px}.script-overlay.bottom-left{bottom:8px;left:8px}.script-overlay.bottom-right{bottom:8px;right:8px}}.uniforms-panel-wrapper{position:absolute;top:16px;right:16px;z-index:100;display:flex;flex-direction:column;align-items:flex-end}.uniforms-toggle-button{width:44px;height:44px;padding:6px;background:var(--glass-bg);border:var(--glass-border);border-radius:var(--glass-radius-sm);color:var(--glass-text);cursor:pointer;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm);transition:all .2s ease,opacity .15s ease;display:flex;align-items:center;justify-content:center}.uniforms-toggle-button:hover{background:var(--glass-bg-hover);transform:scale(1.05)}.uniforms-toggle-button:active{transform:scale(.95)}.uniforms-toggle-button svg{width:16px;height:16px}.uniforms-toggle-button.hidden{opacity:0;transform:scale(.8);pointer-events:none;position:absolute}.uniforms-panel{width:175px;max-height:calc(100vh - 100px);background:var(--glass-bg);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);border-radius:var(--glass-radius);border:var(--glass-border);box-shadow:var(--glass-shadow);overflow:hidden;display:flex;flex-direction:column;transform-origin:top right;transition:opacity .2s ease,transform .2s ease,max-height .2s ease}.uniforms-panel.closed{opacity:0;transform:scale(.25) translate(0);transform-origin:top right;pointer-events:none;max-height:0;padding:0}.uniforms-panel-header{padding:10px 14px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--glass-text-muted);background:#ffffff08;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;display:flex;justify-content:space-between;align-items:center}.uniforms-panel-close{background:transparent;border:none;color:var(--glass-text-muted);font-size:18px;line-height:1;cursor:pointer;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:all .15s ease}.uniforms-panel-close:hover{background:#ffffff1a;color:var(--glass-text)}.uniforms-panel-content{flex:1;overflow-y:auto;overflow-x:hidden}.uniforms-panel .uniform-controls{padding:12px;gap:12px;background:transparent}.uniforms-panel .uniform-controls-header{display:none}.uniforms-panel .uniform-controls-list{gap:14px}.uniforms-panel .uniform-control{gap:6px}.uniforms-panel .uniform-control-label{font-size:11px;color:var(--glass-text)}.uniforms-panel .uniform-control-value{font-size:10px;padding:1px 4px;min-width:40px;color:var(--glass-text-muted);background:#0003;border-radius:3px}.uniforms-panel .uniform-control-slider{height:4px;background:#ffffff26}.uniforms-panel .uniform-control-slider::-webkit-slider-runnable-track{height:4px;background:#ffffff26}.uniforms-panel .uniform-control-slider::-webkit-slider-thumb{width:12px;height:12px;margin-top:-4px;background:#ffffffe6;box-shadow:0 1px 4px #0000004d}.uniforms-panel .uniform-control-slider::-moz-range-track{height:4px;background:#ffffff26}.uniforms-panel .uniform-control-slider::-moz-range-thumb{width:12px;height:12px;background:#ffffffe6;box-shadow:0 1px 4px #0000004d}.uniforms-panel .uniform-control-toggle{width:34px;height:18px}.uniforms-panel .uniform-control-toggle-slider{border-radius:18px}.uniforms-panel .uniform-control-toggle-slider:before{width:12px;height:12px;left:3px;bottom:3px}.uniforms-panel .uniform-control-toggle input:checked+.uniform-control-toggle-slider:before{transform:translate(16px)}.uniforms-panel .uniform-control-xy-pad{height:100px}.uniforms-panel .uniform-control-xy-handle{width:12px;height:12px}.uniforms-panel .uniform-control-color-swatch{height:28px}.uniforms-panel .uniform-control-vec-slider-row{gap:6px}.uniforms-panel .uniform-control-vec-component{font-size:9px;width:12px;color:var(--glass-text-muted)}.uniforms-panel .uniform-control-vec-value{font-size:9px;min-width:32px;color:var(--glass-text-muted);background:#0003;border-radius:3px}.uniforms-panel .uniform-control-xy-pad{background:#00000040;border:1px solid rgba(255,255,255,.1)}.uniforms-panel .uniform-control-xy-handle{background:#ffffffe6;box-shadow:0 1px 4px #0006}.uniforms-panel-content::-webkit-scrollbar{width:6px}.uniforms-panel-content::-webkit-scrollbar-track{background:transparent}.uniforms-panel-content::-webkit-scrollbar-thumb{background:#fff3;border-radius:3px}.uniforms-panel-content::-webkit-scrollbar-thumb:hover{background:#ffffff59}.uniform-controls{display:flex;flex-direction:column;gap:16px;padding:16px;height:100%;overflow-y:auto;background:var(--bg-secondary)}.uniform-controls-empty{color:var(--text-muted);font-size:13px;text-align:center;padding:20px}.uniform-controls-header{display:flex;justify-content:flex-end;padding-bottom:8px;border-bottom:1px solid var(--border-primary);margin-bottom:8px}.uniform-controls-reset{font-family:inherit;font-size:11px;padding:4px 10px;background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border-primary);border-radius:4px;cursor:pointer;transition:background .15s ease,color .15s ease}.uniform-controls-reset:hover{background:var(--border-primary);color:var(--text-primary)}.uniform-controls-reset:active{transform:translateY(1px)}.uniform-controls-list{display:flex;flex-direction:column;gap:16px}.uniform-control{display:flex;flex-direction:column;gap:8px}.uniform-control-label-row{display:flex;justify-content:space-between;align-items:center}.uniform-control-label{font-family:Monaco,Menlo,Courier New,monospace;font-size:12px;font-weight:500;color:var(--text-primary)}.uniform-control-value{font-family:Monaco,Menlo,Courier New,monospace;font-size:11px;color:var(--text-muted);background:var(--bg-tertiary);padding:2px 6px;border-radius:3px;min-width:50px;text-align:right}.uniform-control-slider{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:100%;height:6px;background:var(--border-primary);border-radius:3px;outline:none;cursor:pointer}.uniform-control-slider::-webkit-slider-runnable-track{height:6px;background:var(--border-primary);border-radius:3px}.uniform-control-slider::-webkit-slider-thumb{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:14px;height:14px;background:var(--accent-primary);border-radius:50%;cursor:pointer;margin-top:-4px;transition:transform .15s ease,box-shadow .15s ease}.uniform-control-slider::-webkit-slider-thumb:hover{transform:scale(1.1);box-shadow:0 2px 6px #0003}.uniform-control-slider::-webkit-slider-thumb:active{transform:scale(.95)}.uniform-control-slider::-moz-range-track{height:6px;background:var(--border-primary);border-radius:3px}.uniform-control-slider::-moz-range-thumb{width:14px;height:14px;background:var(--accent-primary);border:none;border-radius:50%;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}.uniform-control-slider::-moz-range-thumb:hover{transform:scale(1.1);box-shadow:0 2px 6px #0003}.uniform-control-slider::-moz-range-thumb:active{transform:scale(.95)}.uniform-control-slider:focus{outline:none}.uniform-control-slider:focus::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--code-selection)}.uniform-control-slider:focus::-moz-range-thumb{box-shadow:0 0 0 3px var(--code-selection)}.uniform-control-toggle{position:relative;display:inline-block;width:40px;height:22px;cursor:pointer}.uniform-control-toggle input{opacity:0;width:0;height:0}.uniform-control-toggle-slider{position:absolute;top:0;left:0;right:0;bottom:0;background:var(--border-primary);border-radius:22px;transition:background .2s ease}.uniform-control-toggle-slider:before{content:"";position:absolute;width:16px;height:16px;left:3px;bottom:3px;background:var(--text-muted);border-radius:50%;transition:transform .2s ease,background .2s ease}.uniform-control-toggle input:checked+.uniform-control-toggle-slider{background:var(--accent-primary)}.uniform-control-toggle input:checked+.uniform-control-toggle-slider:before{transform:translate(18px);background:#fff}.uniform-control-toggle input:focus+.uniform-control-toggle-slider{box-shadow:0 0 0 2px var(--code-selection)}.uniform-control-xy-pad{position:relative;width:100%;height:120px;background:var(--bg-tertiary);border:1px solid var(--border-primary);border-radius:4px;cursor:crosshair;overflow:hidden}.uniform-control-xy-pad:before,.uniform-control-xy-pad:after{content:"";position:absolute;background:var(--border-primary);opacity:.5}.uniform-control-xy-pad:before{left:50%;top:0;bottom:0;width:1px}.uniform-control-xy-pad:after{top:50%;left:0;right:0;height:1px}.uniform-control-xy-handle{position:absolute;width:14px;height:14px;background:var(--accent-primary);border:2px solid white;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 2px 4px #0000004d;pointer-events:none;z-index:1}.uniform-control-color-wrapper{display:flex;align-items:center;gap:8px}.uniform-control-color-swatch{width:100%;height:32px;border-radius:4px;border:1px solid var(--border-primary);cursor:pointer;transition:box-shadow .15s ease}.uniform-control-color-swatch:hover{box-shadow:0 0 0 2px var(--accent-primary)}.uniform-control-color-input{position:absolute;width:0;height:0;opacity:0;pointer-events:none}.uniform-control-vec3{gap:6px}.uniform-control-vec-slider-row{display:flex;align-items:center;gap:8px}.uniform-control-vec-component{font-family:Monaco,Menlo,Courier New,monospace;font-size:10px;font-weight:600;color:var(--text-muted);width:14px;text-align:center}.uniform-control-vec-slider{flex:1}.uniform-control-vec-value{min-width:40px;font-size:10px}.render-dialog-backdrop{position:absolute;top:0;left:0;right:0;bottom:0;background:#000000b3;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:4000}.render-dialog{background:#1a1a1f;border:1px solid rgba(255,255,255,.1);border-radius:10px;box-shadow:0 20px 60px #0009;width:360px;max-width:calc(100% - 32px);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#e0e0e0}.render-dialog-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:linear-gradient(135deg,#1565c0,#0d47a1);color:#fff;border-bottom:1px solid rgba(0,0,0,.3)}.render-dialog-title{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}.render-dialog-close{background:transparent;border:none;color:#fffc;font-size:20px;line-height:1;cursor:pointer;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:all .15s ease}.render-dialog-close:hover{background:#ffffff26;color:#fff}.render-dialog-body{padding:18px;display:flex;flex-direction:column;gap:14px}.render-field{display:flex;flex-direction:column;gap:5px}.render-field-label{font-size:12px;font-weight:500;color:#fff9;text-transform:uppercase;letter-spacing:.5px}.render-field-row{display:flex;gap:8px;align-items:center}.render-field-row span{color:#fff6;font-size:13px}.render-input{flex:1;background:#0f0f14;border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#e0e0e0;font-family:Monaco,Menlo,monospace;font-size:13px;padding:7px 10px;outline:none;transition:border-color .15s}.render-input:focus{border-color:#648cff80}.render-input[type=number]{-moz-appearance:textfield}.render-input[type=number]::-webkit-inner-spin-button,.render-input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.render-format-group{display:flex;gap:8px}.render-format-option{flex:1;position:relative}.render-format-option input[type=radio]{position:absolute;opacity:0;pointer-events:none}.render-format-option label{display:block;text-align:center;padding:8px 12px;background:#0f0f14;border:1px solid rgba(255,255,255,.1);border-radius:5px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s}.render-format-option input[type=radio]:checked+label{background:#648cff26;border-color:#648cff80;color:#8ab4ff}.render-format-option label:hover{border-color:#fff3}.render-estimate{font-size:11px;color:#fff6;font-family:Monaco,Menlo,monospace;text-align:center;padding:4px 0}.render-dialog-actions{display:flex;gap:8px;padding:0 18px 18px}.render-btn{flex:1;padding:9px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all .15s;font-family:inherit}.render-btn-primary{background:linear-gradient(135deg,#1565c0,#0d47a1);color:#fff}.render-btn-primary:hover{filter:brightness(1.1)}.render-btn-primary:disabled{opacity:.5;cursor:not-allowed;filter:none}.render-btn-cancel{background:#ffffff14;color:#ffffffb3;border:1px solid rgba(255,255,255,.1)}.render-btn-cancel:hover{background:#ffffff1f}.render-progress{display:none;flex-direction:column;gap:8px;padding:18px}.render-progress.active{display:flex}.render-progress-bar-bg{height:6px;background:#0f0f14;border-radius:3px;overflow:hidden}.render-progress-bar{height:100%;background:linear-gradient(90deg,#1565c0,#42a5f5);border-radius:3px;width:0%;transition:width .1s ease}.render-progress-text{font-size:12px;color:#ffffff80;font-family:Monaco,Menlo,monospace;text-align:center}.multi-view-controls-wrapper{position:absolute;top:16px;right:16px;z-index:100;display:flex;flex-direction:column;align-items:flex-end}.multi-view-controls-toggle{width:44px;height:44px;padding:6px;background:var(--glass-bg);border:var(--glass-border);border-radius:var(--glass-radius-sm);color:var(--glass-text);cursor:pointer;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow-sm);transition:all .2s ease,opacity .15s ease;display:flex;align-items:center;justify-content:center}.multi-view-controls-toggle:hover{background:var(--glass-bg-hover);transform:scale(1.05)}.multi-view-controls-toggle:active{transform:scale(.95)}.multi-view-controls-toggle svg{width:16px;height:16px}.multi-view-controls-toggle.hidden{opacity:0;transform:scale(.8);pointer-events:none;position:absolute}.multi-view-controls-panel{width:175px;max-height:calc(100vh - 100px);background:var(--glass-bg);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);border-radius:var(--glass-radius);border:var(--glass-border);box-shadow:var(--glass-shadow);overflow:hidden;display:flex;flex-direction:column;transform-origin:top right;transition:opacity .2s ease,transform .2s ease,max-height .2s ease}.multi-view-controls-panel.closed{opacity:0;transform:scale(.25) translate(0);transform-origin:top right;pointer-events:none;max-height:0;padding:0}.multi-view-controls-header{padding:10px 14px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--glass-text-muted);background:#ffffff08;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;display:flex;justify-content:space-between;align-items:center}.multi-view-controls-close{background:transparent;border:none;color:var(--glass-text-muted);font-size:18px;line-height:1;cursor:pointer;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:all .15s ease}.multi-view-controls-close:hover{background:#ffffff1a;color:var(--glass-text)}.controls-section{display:flex;flex-direction:column;gap:8px;padding:12px}.controls-section+.controls-section{padding-top:0}.section-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--glass-text-muted);padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:4px}.playback-controls{flex-direction:row;gap:8px;padding:12px}.control-btn{width:44px;height:44px;border:none;border-radius:var(--glass-radius-sm);background:#ffffff1a;color:var(--glass-text);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s ease}.control-btn:hover{background:#fff3}.control-btn:active{transform:scale(.95)}.control-btn svg{width:16px;height:16px}.uniforms-section{border-top:1px solid rgba(255,255,255,.06)}.uniforms-container{display:flex;flex-direction:column;gap:8px}.multi-view-controls-panel .uniform-controls{padding:0;gap:12px;background:transparent}.multi-view-controls-panel .uniform-controls-header{display:none}.multi-view-controls-panel .uniform-controls-list{gap:14px}.multi-view-controls-panel .uniform-control{gap:6px}.multi-view-controls-panel .uniform-control-label{font-size:11px;color:var(--glass-text)}.multi-view-controls-panel .uniform-control-value{font-size:10px;padding:1px 4px;min-width:40px;color:var(--glass-text-muted);background:#0003;border-radius:3px}.multi-view-controls-panel .uniform-control-slider{height:4px;background:#ffffff26}.multi-view-controls-panel .uniform-control-slider::-webkit-slider-runnable-track{height:4px;background:#ffffff26}.multi-view-controls-panel .uniform-control-slider::-webkit-slider-thumb{width:12px;height:12px;margin-top:-4px;background:#ffffffe6;box-shadow:0 1px 4px #0000004d}.multi-view-controls-panel .uniform-control-slider::-moz-range-track{height:4px;background:#ffffff26}.multi-view-controls-panel .uniform-control-slider::-moz-range-thumb{width:12px;height:12px;background:#ffffffe6;box-shadow:0 1px 4px #0000004d}.multi-view-controls-panel .uniform-control-toggle{width:34px;height:18px}.multi-view-controls-panel .uniform-control-toggle-slider{border-radius:18px}.multi-view-controls-panel .uniform-control-toggle-slider:before{width:12px;height:12px;left:3px;bottom:3px}.multi-view-controls-panel .uniform-control-toggle input:checked+.uniform-control-toggle-slider:before{transform:translate(16px)}.layout-fullscreen{width:100%;height:100%}.layout-fullscreen .canvas-container{position:relative;width:100%;height:100%;background:#000}.layout-default{width:100%;height:100%}.layout-default .canvas-container{position:relative;width:100%;height:100%;background:var(--bg-canvas);border-radius:var(--pane-radius);box-shadow:var(--pane-shadow);overflow:hidden}.layout-split{width:100%;height:100%;display:flex;gap:24px}.layout-split .canvas-container{position:relative;flex:1;background:var(--bg-canvas);border-radius:var(--pane-radius);box-shadow:var(--pane-shadow);overflow:hidden}.layout-split .code-panel{position:relative;flex:1;display:flex;flex-direction:column;background:var(--bg-secondary);border-radius:var(--pane-radius);box-shadow:var(--pane-shadow);overflow:hidden}.tab-bar{display:flex;background:var(--tab-bg);border-bottom:1px solid var(--border-primary);padding:8px 8px 0;gap:4px}.tab-button{padding:8px 16px;background:transparent;border:none;border-radius:6px 6px 0 0;font-size:13px;font-family:Monaco,Menlo,Courier New,monospace;cursor:pointer;transition:background .2s,color .2s;color:var(--tab-text)}.tab-button:hover{background:var(--button-bg-hover);color:var(--tab-text-hover)}.tab-button.active{background:var(--bg-secondary);color:var(--tab-text-active);font-weight:500}.copy-button{position:absolute;top:12px;right:12px;padding:6px;background:var(--button-bg);border:none;border-radius:4px;color:var(--button-text);cursor:pointer;transition:all .2s;z-index:10;display:flex;align-items:center;justify-content:center}.copy-button:hover{background:var(--button-bg-hover);color:var(--button-text-hover)}.copy-button:active{transform:scale(.9)}.copy-button.copied{color:var(--success-text)}.code-viewer{flex:1;min-height:0;overflow:auto;position:relative;background:var(--code-bg)}.code-viewer pre{margin:0;padding:16px;font-size:13px;line-height:1.5;font-family:Monaco,Menlo,Courier New,monospace;background:var(--code-bg);color:var(--code-text)}.code-viewer code{font-family:inherit;font-size:inherit}.token.comment{color:var(--syntax-comment)}.token.keyword{color:var(--syntax-keyword)}.token.string{color:var(--syntax-string)}.token.number{color:var(--syntax-number)}.token.operator{color:var(--syntax-operator)}.token.function{color:var(--syntax-function)}.token.class-name{color:var(--syntax-class)}.token.punctuation{color:var(--syntax-punctuation)}.tab-button.image-tab,.tab-button.image-tab.active{color:var(--accent-secondary)}.image-viewer{display:flex;align-items:center;justify-content:center;height:100%;padding:16px;background:var(--image-viewer-bg)}.image-viewer img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:var(--shadow-sm)}@media (max-width: 800px){.layout-split{flex-direction:column}}.layout-tabbed{width:100%;height:100%;display:flex;flex-direction:column;box-sizing:border-box}.tabbed-wrapper{display:flex;flex-direction:column;width:100%;height:100%;border-radius:var(--pane-radius);box-shadow:var(--pane-shadow);overflow:hidden}.tabbed-toolbar{display:flex;align-items:center;flex-shrink:0;background:var(--tab-bg);border-bottom:1px solid var(--border-primary);padding-right:8px}.tabbed-tab-bar{display:flex;flex:1;gap:4px;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}.tabbed-tab-bar::-webkit-scrollbar{height:4px}.tabbed-tab-bar::-webkit-scrollbar-thumb{background:var(--border-secondary);border-radius:2px}.tabbed-tab-button{padding:10px 16px;background:transparent;border:none;border-bottom:2px solid transparent;font-size:12px;font-family:Monaco,Menlo,Courier New,monospace;cursor:pointer;transition:color .15s,border-color .15s;color:var(--tab-text);white-space:nowrap;flex-shrink:0}.tabbed-tab-button:hover{color:var(--tab-text-hover)}.tabbed-tab-button.active{color:var(--tab-text-active);border-bottom-color:var(--tab-border-active)}.tabbed-tab-button.shader-tab{font-family:system-ui,-apple-system,sans-serif}.tabbed-tab-button.image-tab{color:var(--accent-secondary)}.tabbed-tab-button.image-tab.active{color:var(--accent-secondary);border-bottom-color:var(--accent-secondary)}.tabbed-tab-button.uniforms-tab{color:var(--accent-tertiary, var(--accent-primary));padding:8px 12px}.tabbed-tab-button.uniforms-tab.active{color:var(--accent-tertiary, var(--accent-primary));border-bottom-color:var(--accent-tertiary, var(--accent-primary))}.tabbed-tab-button .uniforms-icon{width:18px;height:18px;display:block}.tabbed-content{flex:1;min-height:0;position:relative;background:var(--bg-canvas);overflow:hidden}.tabbed-canvas-container{position:absolute;top:0;left:0;width:100%;height:100%}.tabbed-code-viewer{position:absolute;top:0;left:0;width:100%;height:100%;overflow:auto;background:var(--code-bg)}.tabbed-code-viewer pre{margin:0;padding:16px 16px 16px 0;font-size:13px;line-height:1.6;font-family:Monaco,Menlo,Courier New,monospace;background:var(--code-bg);color:var(--code-text);display:flex}.tabbed-code-viewer code{font-family:inherit;font-size:inherit}.tabbed-line-numbers{text-align:right;padding-right:16px;margin-right:16px;border-right:1px solid var(--code-line-border);color:var(--code-line-number);-webkit-user-select:none;user-select:none;flex-shrink:0;padding-left:16px}.tabbed-code-content{flex:1;overflow-x:auto}.tabbed-image-viewer{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--image-viewer-bg);padding:20px;box-sizing:border-box}.tabbed-image-viewer img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:var(--shadow-sm)}.tabbed-code-viewer .token.comment{color:var(--syntax-comment)}.tabbed-code-viewer .token.keyword{color:var(--syntax-keyword)}.tabbed-code-viewer .token.string{color:var(--syntax-string)}.tabbed-code-viewer .token.number{color:var(--syntax-number)}.tabbed-code-viewer .token.operator{color:var(--syntax-operator)}.tabbed-code-viewer .token.function{color:var(--syntax-function)}.tabbed-code-viewer .token.class-name{color:var(--syntax-class)}.tabbed-code-viewer .token.punctuation{color:var(--syntax-punctuation)}@media (max-width: 600px){.tabbed-tab-button{padding:8px 12px;font-size:12px}}.tabbed-editor-container{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;background:var(--code-bg)}.tabbed-button-container{display:flex;align-items:center;gap:6px;flex-shrink:0}.tabbed-copy-button{display:flex;align-items:center;justify-content:center;background:var(--button-bg);border:1px solid var(--button-border);color:var(--button-text);width:44px;height:44px;border-radius:4px;cursor:pointer;transition:background .15s,border-color .15s,color .15s}.tabbed-copy-button:hover{background:var(--button-bg-hover);border-color:var(--button-border-hover);color:var(--button-text-hover)}.tabbed-copy-button:active{background:var(--button-bg-hover)}.tabbed-copy-button.copied{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}.tabbed-recompile-button{display:flex;align-items:center;gap:6px;background:var(--recompile-bg);border:none;color:var(--recompile-text);padding:6px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;transition:background .15s,color .15s}.tabbed-recompile-button:hover{background:var(--recompile-bg-hover)}.tabbed-recompile-button:active{background:var(--recompile-bg-active)}.tabbed-recompile-button svg{flex-shrink:0}.tabbed-error-display{position:absolute;bottom:0;left:0;right:0;background:var(--error-bg);color:var(--error-text);padding:10px 14px;font-family:Monaco,Menlo,Courier New,monospace;font-size:12px;white-space:pre-wrap;overflow:auto;max-height:120px;border-top:1px solid var(--error-border);z-index:10}.tabbed-fallback-textarea{width:100%;height:100%;background:var(--code-bg);color:var(--code-text);border:none;padding:12px;font-family:Monaco,Menlo,Courier New,monospace;font-size:13px;resize:none;outline:none}.tabbed-uniforms-container{position:absolute;top:0;left:0;width:100%;height:100%;overflow-y:auto;background:#00000080;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;justify-content:center;padding:20px;box-sizing:border-box}.tabbed-uniforms-container .uniform-controls{max-width:400px;width:100%;background:#1e1e23f2;border-radius:12px;padding:20px;box-shadow:0 4px 20px #0006;height:fit-content}.tabbed-uniforms-container .uniform-control-label{color:#e0e0e0}.tabbed-uniforms-container .uniform-control-value{color:#a0a0a0;background:#0000004d}.tabbed-uniforms-container .uniform-controls-header{color:#909090;border-bottom-color:#ffffff1a}.tabbed-uniforms-container .uniform-control-slider{background:#ffffff1a}.tabbed-uniforms-container .uniform-control-slider::-webkit-slider-thumb{background:#fff}.tabbed-uniforms-container .uniform-control-slider::-moz-range-thumb{background:#fff}.tabbed-uniforms-container .uniform-control-vec-component{color:#909090}.tabbed-uniforms-container .uniform-control-vec-value{color:#a0a0a0;background:#0000004d}.layout-multi-view{position:relative;width:100%;height:100%;box-sizing:border-box;background:var(--bg-primary)}.multi-view-canvas{position:relative;background:var(--bg-canvas);border-radius:var(--pane-radius);box-shadow:var(--pane-shadow);overflow:hidden}.multi-view-label{position:absolute;top:12px;left:12px;padding:4px 10px;background:#0009;color:#fff;font-family:var(--font-mono);font-size:12px;font-weight:500;border-radius:4px;text-transform:capitalize;z-index:5;pointer-events:none}.multi-view-info{position:absolute;bottom:12px;left:12px;padding:6px 10px;background:#0009;color:#fff;font-family:var(--font-mono);font-size:11px;border-radius:4px;z-index:5;pointer-events:none}.layout-grid-view{display:grid;gap:16px}.layout-grid-view .multi-view-canvas{min-height:0;min-width:0}.layout-grid-view[data-view-count="2"].grid-horizontal{grid-template-columns:1fr 1fr;grid-template-rows:1fr}.layout-grid-view[data-view-count="2"].grid-vertical{grid-template-columns:1fr;grid-template-rows:1fr 1fr}.layout-grid-view[data-view-count="3"].grid-horizontal{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}.layout-grid-view[data-view-count="3"].grid-horizontal .multi-view-canvas:last-child{grid-column:1 / -1}.layout-grid-view[data-view-count="3"].grid-vertical{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}.layout-grid-view[data-view-count="3"].grid-vertical .multi-view-canvas:first-child{grid-column:1 / -1}.layout-grid-view[data-view-count="4"]{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}.layout-inset-view .multi-view-canvas.inset-main{width:100%;height:100%}.layout-inset-view .multi-view-canvas.inset-overlay{position:absolute;bottom:40px;right:40px;width:25%;min-width:200px;aspect-ratio:16 / 9;z-index:10;transition:all .2s ease}.layout-inset-view .multi-view-canvas.inset-overlay.minimized{width:48px;height:48px;min-width:unset;aspect-ratio:unset;cursor:pointer;opacity:.8}.layout-inset-view .multi-view-canvas.inset-overlay.minimized:hover{opacity:1}.inset-minimize-btn{position:absolute;top:8px;right:8px;width:24px;height:24px;border:none;border-radius:4px;background:#00000080;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;z-index:11;transition:background .2s}.inset-minimize-btn:hover{background:#000000b3}.editor-toolbar{display:flex;align-items:center;background:var(--tab-bg);border-bottom:1px solid var(--border-primary);padding-right:8px}.editor-tab-bar{display:flex;flex:1;overflow-x:auto;scrollbar-width:thin}.editor-tab-button{background:transparent;border:none;color:var(--tab-text);padding:10px 16px;cursor:pointer;font-family:Monaco,Menlo,Courier New,monospace;font-size:12px;white-space:nowrap;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}.editor-tab-button:hover{color:var(--tab-text-hover)}.editor-tab-button.active{color:var(--tab-text-active);border-bottom-color:var(--tab-border-active)}.editor-tab-button.image-tab{color:var(--accent-secondary)}.editor-tab-button.image-tab.active{color:var(--accent-secondary);border-bottom-color:var(--accent-secondary)}.editor-tab-button.uniforms-tab{color:var(--accent-tertiary, var(--accent-primary));padding:8px 12px}.editor-tab-button.uniforms-tab.active{color:var(--accent-tertiary, var(--accent-primary));border-bottom-color:var(--accent-tertiary, var(--accent-primary))}.editor-tab-button .uniforms-icon{width:18px;height:18px;display:block}.editor-copy-button{display:flex;align-items:center;justify-content:center;background:var(--button-bg);border:1px solid var(--button-border);color:var(--button-text);width:32px;height:32px;border-radius:4px;cursor:pointer;transition:background .15s,border-color .15s,color .15s;flex-shrink:0;margin-right:6px}.editor-copy-button:hover{background:var(--button-bg-hover);border-color:var(--button-border-hover);color:var(--button-text-hover)}.editor-copy-button:active{background:var(--button-bg-hover)}.editor-copy-button.copied{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}.editor-copy-button svg{flex-shrink:0}.editor-recompile-button{display:flex;align-items:center;gap:6px;background:var(--recompile-bg);border:none;color:var(--recompile-text);padding:6px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;transition:background .15s,color .15s;flex-shrink:0}.editor-recompile-button:hover{background:var(--recompile-bg-hover)}.editor-recompile-button:active{background:var(--recompile-bg-active)}.editor-recompile-button svg{flex-shrink:0}.editor-content-area{flex:1;overflow:hidden;position:relative;background:var(--code-bg)}.editor-prism-container{height:100%;width:100%}.editor-fallback-textarea{width:100%;height:100%;background:var(--code-bg);color:var(--code-text);border:none;padding:12px;font-family:Monaco,Menlo,Courier New,monospace;font-size:13px;resize:none;outline:none}.editor-image-viewer{display:flex;align-items:center;justify-content:center;height:100%;background:var(--image-viewer-bg);padding:20px}.editor-uniforms-container{height:100%;overflow-y:auto;background:var(--bg-secondary)}.editor-image-viewer img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:var(--shadow-sm)}.editor-error-display{background:var(--error-bg);color:var(--error-text);padding:10px 14px;font-family:Monaco,Menlo,Courier New,monospace;font-size:12px;white-space:pre-wrap;overflow:auto;max-height:120px;border-top:1px solid var(--error-border)}.prism-editor-wrapper{display:flex;height:100%;background:var(--code-bg);font-family:Monaco,Menlo,Courier New,monospace;font-size:13px;line-height:1.6}.prism-editor-line-numbers{flex-shrink:0;padding:16px 12px 16px 16px;text-align:right;color:var(--code-line-number);border-right:1px solid var(--code-line-border);-webkit-user-select:none;user-select:none;overflow:hidden}.prism-editor-line-numbers span{display:block}.prism-editor-area{flex:1;position:relative;overflow:hidden}.prism-editor-textarea,.prism-editor-highlight{position:absolute;top:0;left:0;width:100%;height:100%;padding:16px;margin:0;border:none;outline:none;font-family:inherit;font-size:inherit;line-height:inherit;white-space:pre-wrap;word-wrap:break-word;overflow:auto;box-sizing:border-box}.prism-editor-textarea{background:transparent;color:transparent;caret-color:var(--code-text);resize:none;z-index:1;-webkit-text-fill-color:transparent}.prism-editor-textarea::selection{background:var(--code-selection)}.prism-editor-textarea::-moz-selection{background:var(--code-selection)}.prism-editor-highlight{background:var(--code-bg);color:var(--code-text);pointer-events:none;z-index:0}.prism-editor-highlight code{font-family:inherit;font-size:inherit;background:none;padding:0}.prism-editor-highlight .token.comment{color:var(--syntax-comment)}.prism-editor-highlight .token.keyword{color:var(--syntax-keyword)}.prism-editor-highlight .token.string{color:var(--syntax-string)}.prism-editor-highlight .token.number{color:var(--syntax-number)}.prism-editor-highlight .token.operator{color:var(--syntax-operator)}.prism-editor-highlight .token.function{color:var(--syntax-function)}.prism-editor-highlight .token.class-name{color:var(--syntax-class)}.prism-editor-highlight .token.punctuation{color:var(--syntax-punctuation)}')),document.head.appendChild(o)}}catch(r){console.error("vite-plugin-css-injected-by-js",r)}})();
var He = Object.defineProperty;
var Ve = (i, e, t) => e in i ? He(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var l = (i, e, t) => Ve(i, typeof e != "symbol" ? e + "" : e, t);
function L(i) {
  return "count" in i && typeof i.count == "number";
}
function se(i) {
  return !L(i) && !i.hidden;
}
function Re(i) {
  return "views" in i && Array.isArray(i.views);
}
function ue(i, e, t) {
  const n = i.createShader(e);
  if (!n)
    throw new Error("Failed to create shader object");
  if (i.shaderSource(n, t), i.compileShader(n), !i.getShaderParameter(n, i.COMPILE_STATUS)) {
    const r = i.getShaderInfoLog(n);
    throw i.deleteShader(n), new Error(`Shader compilation failed:
${r}`);
  }
  return n;
}
function de(i, e, t) {
  const n = ue(i, i.VERTEX_SHADER, e), s = ue(i, i.FRAGMENT_SHADER, t), r = i.createProgram();
  if (!r)
    throw new Error("Failed to create program object");
  if (i.attachShader(r, n), i.attachShader(r, s), i.linkProgram(r), !i.getProgramParameter(r, i.LINK_STATUS)) {
    const o = i.getProgramInfoLog(r);
    throw i.deleteProgram(r), i.deleteShader(n), i.deleteShader(s), new Error(`Program linking failed:
${o}`);
  }
  return i.detachShader(r, n), i.detachShader(r, s), i.deleteShader(n), i.deleteShader(s), r;
}
function Xe(i) {
  const e = i.createVertexArray();
  if (!e)
    throw new Error("Failed to create VAO");
  i.bindVertexArray(e);
  const t = new Float32Array([
    -1,
    -1,
    // Bottom-left
    3,
    -1,
    // Bottom-right (extends beyond viewport)
    -1,
    3
    // Top-left (extends beyond viewport)
  ]), n = i.createBuffer();
  if (!n)
    throw new Error("Failed to create VBO");
  return i.bindBuffer(i.ARRAY_BUFFER, n), i.bufferData(i.ARRAY_BUFFER, t, i.STATIC_DRAW), i.enableVertexAttribArray(0), i.vertexAttribPointer(
    0,
    // attribute location
    2,
    // size (vec2)
    i.FLOAT,
    // type
    !1,
    // normalized
    0,
    // stride
    0
    // offset
  ), i.bindVertexArray(null), i.bindBuffer(i.ARRAY_BUFFER, null), e;
}
function Y(i, e, t) {
  const n = i.createTexture();
  if (!n)
    throw new Error("Failed to create texture");
  return i.bindTexture(i.TEXTURE_2D, n), i.texImage2D(
    i.TEXTURE_2D,
    0,
    // mip level
    i.RGBA32F,
    // internal format (32-bit float per channel)
    e,
    t,
    0,
    // border (must be 0)
    i.RGBA,
    // format
    i.FLOAT,
    // type
    null
    // no data (allocate only)
  ), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.bindTexture(i.TEXTURE_2D, null), n;
}
function he(i, e) {
  const t = i.createFramebuffer();
  if (!t)
    throw new Error("Failed to create framebuffer");
  i.bindFramebuffer(i.FRAMEBUFFER, t), i.framebufferTexture2D(
    i.FRAMEBUFFER,
    i.COLOR_ATTACHMENT0,
    i.TEXTURE_2D,
    e,
    0
    // mip level
  );
  const n = i.checkFramebufferStatus(i.FRAMEBUFFER);
  if (n !== i.FRAMEBUFFER_COMPLETE)
    throw i.deleteFramebuffer(t), new Error(`Framebuffer incomplete: ${Ze(i, n)}`);
  return i.bindFramebuffer(i.FRAMEBUFFER, null), t;
}
function je(i) {
  const e = i.createTexture();
  if (!e)
    throw new Error("Failed to create black texture");
  i.bindTexture(i.TEXTURE_2D, e);
  const t = new Float32Array([0, 0, 0, 1]);
  return i.texImage2D(
    i.TEXTURE_2D,
    0,
    i.RGBA32F,
    1,
    1,
    0,
    i.RGBA,
    i.FLOAT,
    t
  ), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.bindTexture(i.TEXTURE_2D, null), e;
}
function Ke(i) {
  const e = i.createTexture();
  if (!e)
    throw new Error("Failed to create keyboard texture");
  i.bindTexture(i.TEXTURE_2D, e);
  const t = 256, n = 3, s = new Float32Array(t * n * 4);
  return i.texImage2D(
    i.TEXTURE_2D,
    0,
    i.RGBA32F,
    t,
    n,
    0,
    i.RGBA,
    i.FLOAT,
    s
  ), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.bindTexture(i.TEXTURE_2D, null), e;
}
function Ye(i, e, t, n) {
  const a = new Float32Array(3072);
  for (let o = 0; o < 256; o++) {
    const c = t.get(o) || !1, u = n.get(o) || 0, d = (0 * 256 + o) * 4;
    a[d + 0] = c ? 1 : 0, a[d + 1] = c ? 1 : 0, a[d + 2] = c ? 1 : 0, a[d + 3] = 1;
    const h = (2 * 256 + o) * 4;
    a[h + 0] = u, a[h + 1] = u, a[h + 2] = u, a[h + 3] = 1;
  }
  i.bindTexture(i.TEXTURE_2D, e), i.texSubImage2D(
    i.TEXTURE_2D,
    0,
    0,
    0,
    // x, y offset
    256,
    3,
    i.RGBA,
    i.FLOAT,
    a
  ), i.bindTexture(i.TEXTURE_2D, null);
}
function ze(i) {
  const e = i.createTexture();
  if (!e) throw new Error("Failed to create audio texture");
  i.bindTexture(i.TEXTURE_2D, e);
  const t = 512, n = 2, s = new Uint8Array(t * n);
  return i.texImage2D(i.TEXTURE_2D, 0, i.R8, t, n, 0, i.RED, i.UNSIGNED_BYTE, s), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.bindTexture(i.TEXTURE_2D, null), e;
}
function Ge(i, e, t, n) {
  i.bindTexture(i.TEXTURE_2D, e), i.texSubImage2D(i.TEXTURE_2D, 0, 0, 0, 512, 1, i.RED, i.UNSIGNED_BYTE, t), i.texSubImage2D(i.TEXTURE_2D, 0, 0, 1, 512, 1, i.RED, i.UNSIGNED_BYTE, n), i.bindTexture(i.TEXTURE_2D, null);
}
function me(i) {
  const e = i.createTexture();
  if (!e) throw new Error("Failed to create video texture");
  return i.bindTexture(i.TEXTURE_2D, e), i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, 1, 1, 0, i.RGBA, i.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.bindTexture(i.TEXTURE_2D, null), e;
}
function We(i, e, t) {
  i.bindTexture(i.TEXTURE_2D, e), i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, !0), i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, i.RGBA, i.UNSIGNED_BYTE, t), i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, !1), i.bindTexture(i.TEXTURE_2D, null);
}
function qe(i, e, t, n, s) {
  const r = e ?? i.createTexture();
  if (!r) throw new Error("Failed to create script texture");
  return i.bindTexture(i.TEXTURE_2D, r), s instanceof Float32Array ? i.texImage2D(i.TEXTURE_2D, 0, i.RGBA32F, t, n, 0, i.RGBA, i.FLOAT, s) : i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, t, n, 0, i.RGBA, i.UNSIGNED_BYTE, s), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.NEAREST), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.bindTexture(i.TEXTURE_2D, null), r;
}
function Ze(i, e) {
  switch (e) {
    case i.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
    case i.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
    case i.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return "FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
    case i.FRAMEBUFFER_UNSUPPORTED:
      return "FRAMEBUFFER_UNSUPPORTED";
    case i.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE";
    default:
      return `Unknown status: ${e}`;
  }
}
const Ce = {
  float: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
  mat3: 9,
  mat4: 16
}, re = {
  float: 4,
  // 1 float + 3 padding
  vec2: 4,
  // 2 floats + 2 padding
  vec3: 4,
  // 3 floats + 1 padding
  vec4: 4,
  // 4 floats, naturally aligned
  mat3: 12,
  // 3 columns × 4 floats (vec3 padded to vec4)
  mat4: 16
  // 4 columns × 4 floats, no padding
};
function O(i, e) {
  return Ce[i] * e;
}
function Je(i, e) {
  return re[i] * e * 4;
}
function Qe(i, e) {
  return re[i] * e;
}
function et(i, e, t, n) {
  const s = Ce[i], r = re[i];
  if (s === r)
    return t;
  const a = r * e, o = n && n.length >= a ? n : new Float32Array(a);
  if (i === "mat3")
    for (let c = 0; c < e; c++) {
      const u = c * 9, d = c * 12;
      o[d + 0] = t[u + 0], o[d + 1] = t[u + 1], o[d + 2] = t[u + 2], o[d + 3] = 0, o[d + 4] = t[u + 3], o[d + 5] = t[u + 4], o[d + 6] = t[u + 5], o[d + 7] = 0, o[d + 8] = t[u + 6], o[d + 9] = t[u + 7], o[d + 10] = t[u + 8], o[d + 11] = 0;
    }
  else
    for (let c = 0; c < e; c++) {
      const u = c * s, d = c * 4;
      for (let h = 0; h < s; h++)
        o[d + h] = t[u + h];
      for (let h = s; h < 4; h++)
        o[d + h] = 0;
    }
  return o;
}
const pe = `#version 300 es
precision highp float;

layout(location = 0) in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`, tt = `#version 300 es
precision highp float;

// Shadertoy compatibility: equirectangular texture sampling
const float ST_PI = 3.14159265359;
const float ST_TWOPI = 6.28318530718;
vec2 _st_dirToEquirect(vec3 dir) {
  float phi = atan(dir.z, dir.x);
  float theta = asin(dir.y);
  return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);
}
`, nt = `// --- Keyboard helpers (auto-injected) ---
// Letter keys
const int KEY_A = 65; const int KEY_B = 66; const int KEY_C = 67; const int KEY_D = 68;
const int KEY_E = 69; const int KEY_F = 70; const int KEY_G = 71; const int KEY_H = 72;
const int KEY_I = 73; const int KEY_J = 74; const int KEY_K = 75; const int KEY_L = 76;
const int KEY_M = 77; const int KEY_N = 78; const int KEY_O = 79; const int KEY_P = 80;
const int KEY_Q = 81; const int KEY_R = 82; const int KEY_S = 83; const int KEY_T = 84;
const int KEY_U = 85; const int KEY_V = 86; const int KEY_W = 87; const int KEY_X = 88;
const int KEY_Y = 89; const int KEY_Z = 90;

// Digit keys
const int KEY_0 = 48; const int KEY_1 = 49; const int KEY_2 = 50; const int KEY_3 = 51;
const int KEY_4 = 52; const int KEY_5 = 53; const int KEY_6 = 54; const int KEY_7 = 55;
const int KEY_8 = 56; const int KEY_9 = 57;

// Arrow keys
const int KEY_LEFT = 37; const int KEY_UP = 38; const int KEY_RIGHT = 39; const int KEY_DOWN = 40;

// Special keys
const int KEY_SPACE = 32;
const int KEY_ENTER = 13;
const int KEY_TAB = 9;
const int KEY_ESC = 27;
const int KEY_BACKSPACE = 8;
const int KEY_DELETE = 46;
const int KEY_SHIFT = 16;
const int KEY_CTRL = 17;
const int KEY_ALT = 18;

// Function keys
const int KEY_F1 = 112; const int KEY_F2 = 113; const int KEY_F3 = 114; const int KEY_F4 = 115;
const int KEY_F5 = 116; const int KEY_F6 = 117; const int KEY_F7 = 118; const int KEY_F8 = 119;
const int KEY_F9 = 120; const int KEY_F10 = 121; const int KEY_F11 = 122; const int KEY_F12 = 123;

// Returns 1.0 if key is held down, 0.0 otherwise
float keyDown(int key) {
  return textureLod(keyboard, vec2((float(key) + 0.5) / 256.0, 0.25), 0.0).x;
}

// Returns 1.0/0.0, toggling each time the key is pressed
float keyToggle(int key) {
  return textureLod(keyboard, vec2((float(key) + 0.5) / 256.0, 0.75), 0.0).x;
}

// Boolean convenience helpers
bool isKeyDown(int key) { return keyDown(key) > 0.5; }
bool isKeyToggled(int key) { return keyToggle(key) > 0.5; }
`;
function it(i, e, t) {
  const n = [tt];
  if (t.commonSource && (n.push("// Common code"), n.push(t.commonSource), n.push("")), t.namedSamplers && t.namedSamplers.size > 0) {
    if (n.push(`// Core uniforms
uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform bool  iMousePressed;
uniform vec4  iDate;
uniform float iFrameRate;

// Shader Sandbox touch extensions
uniform int   iTouchCount;
uniform vec4  iTouch0;
uniform vec4  iTouch1;
uniform vec4  iTouch2;
uniform float iPinch;
uniform float iPinchDelta;
uniform vec2  iPinchCenter;
`), t.viewNames && t.viewNames.length > 1) {
      n.push("// Cross-view uniforms (multi-view project)");
      for (const h of t.viewNames)
        n.push(`uniform vec4  iMouse_${h};`), n.push(`uniform vec3  iResolution_${h};`), n.push(`uniform bool  iMousePressed_${h};`);
      n.push("");
    }
    n.push("// Named samplers");
    for (const [h] of t.namedSamplers)
      n.push(`uniform sampler2D ${h};`), n.push(`uniform vec3 ${h}_resolution;`);
    n.push(""), t.namedSamplers.has("keyboard") && (n.push(nt), n.push(""));
  } else if (n.push(`// Shadertoy built-in uniforms
uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform bool  iMousePressed;
uniform vec4  iDate;
uniform float iFrameRate;
uniform vec3  iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

// Shader Sandbox touch extensions (not in Shadertoy)
uniform int   iTouchCount;          // Number of active touches (0-10)
uniform vec4  iTouch0;              // Primary touch: (x, y, startX, startY)
uniform vec4  iTouch1;              // Second touch
uniform vec4  iTouch2;              // Third touch
uniform float iPinch;               // Pinch scale factor (1.0 = no pinch)
uniform float iPinchDelta;          // Pinch change since last frame
uniform vec2  iPinchCenter;         // Center point of pinch gesture
`), t.viewNames && t.viewNames.length > 1) {
    n.push("// Cross-view uniforms (multi-view project)");
    for (const h of t.viewNames)
      n.push(`uniform vec4  iMouse_${h};`), n.push(`uniform vec3  iResolution_${h};`), n.push(`uniform bool  iMousePressed_${h};`);
    n.push("");
  }
  for (const h of t.ubos)
    n.push(`// Array uniform: ${h.name} (max ${h.count})`), n.push(`layout(std140) uniform _ub_${h.name} {`), n.push(`  ${h.def.type} ${h.name}[${h.count}];`), n.push("};"), n.push(`uniform int ${h.name}_count;`), n.push("");
  const s = Object.entries(t.uniforms).filter(([, h]) => !L(h));
  if (s.length > 0) {
    n.push("// Custom uniforms");
    for (const [h, T] of s) {
      const _ = T.type === "bool" ? "bool" : T.type;
      n.push(`uniform ${_} ${h};`);
    }
    n.push("");
  }
  const r = st(i, e);
  n.push("// User shader code"), n.push(r), n.push(""), n.push(`// Main wrapper
out vec4 fragColor;

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}`);
  const a = n.join(`
`), o = a.split(`
`);
  let c = 0, u = 0, d = 0;
  for (let h = 0; h < o.length; h++)
    o[h] === "// Common code" && (c = h + 2, u = t.commonSource ? t.commonSource.split(`
`).length : 0), o[h] === "// User shader code" && (d = h + 2);
  return {
    source: a,
    lineMapping: { commonStartLine: c, commonLines: u, userCodeStartLine: d }
  };
}
function st(i, e) {
  const t = /* @__PURE__ */ new Set();
  if (e.forEach((s, r) => {
    s.kind === "texture" && s.cubemap && t.add(`iChannel${r}`);
  }), t.size === 0)
    return i;
  const n = /texture\s*\(\s*(iChannel[0-3])\s*,\s*([^)]+)\)/g;
  return i.replace(n, (s, r, a) => t.has(r) ? `texture(${r}, _st_dirToEquirect(${a}))` : s);
}
class rt {
  constructor(e, t) {
    l(this, "_audioTexture", null);
    l(this, "_needsAudio", !1);
    l(this, "_videoTextures", []);
    const n = this.getAllChannelSources(t);
    n.some((s) => s.kind === "audio") && (this._needsAudio = !0, this._audioTexture = {
      texture: ze(e),
      audioContext: null,
      analyser: null,
      stream: null,
      frequencyData: new Uint8Array(512),
      waveformData: new Uint8Array(512),
      width: 512,
      height: 2,
      initialized: !1
    });
    for (const s of n)
      s.kind === "webcam" ? this._videoTextures.find((a) => a.kind === "webcam") || this._videoTextures.push({
        texture: me(e),
        video: null,
        stream: null,
        width: 1,
        height: 1,
        ready: !1,
        kind: "webcam"
      }) : s.kind === "video" && (this._videoTextures.find((a) => a.kind === "video" && a.src === s.src) || this._videoTextures.push({
        texture: me(e),
        video: null,
        stream: null,
        width: 1,
        height: 1,
        ready: !1,
        kind: "video",
        src: s.src
      }));
  }
  // ===========================================================================
  // Accessors
  // ===========================================================================
  get needsAudio() {
    return this._needsAudio;
  }
  get needsWebcam() {
    return this._videoTextures.some((e) => e.kind === "webcam");
  }
  get videoSources() {
    return this._videoTextures.filter((e) => e.kind === "video" && !e.ready && e.src).map((e) => e.src);
  }
  get audioTexture() {
    return this._audioTexture;
  }
  get videoTextures() {
    return this._videoTextures;
  }
  // ===========================================================================
  // Initialization (require user gesture for audio/webcam)
  // ===========================================================================
  async initAudio() {
    if (!(!this._audioTexture || this._audioTexture.initialized))
      try {
        const e = await navigator.mediaDevices.getUserMedia({ audio: !0 }), t = new AudioContext(), n = t.createMediaStreamSource(e), s = t.createAnalyser();
        s.fftSize = 1024, s.smoothingTimeConstant = 0.8, n.connect(s), this._audioTexture.audioContext = t, this._audioTexture.analyser = s, this._audioTexture.stream = e, this._audioTexture.initialized = !0;
      } catch (e) {
        console.warn("Failed to initialize audio input:", e);
      }
  }
  async initWebcam() {
    const e = this._videoTextures.find((t) => t.kind === "webcam" && !t.ready);
    if (e)
      try {
        const t = await navigator.mediaDevices.getUserMedia({ video: !0 }), n = document.createElement("video");
        n.srcObject = t, n.muted = !0, n.playsInline = !0, await n.play(), e.video = n, e.stream = t, e.width = n.videoWidth, e.height = n.videoHeight, n.addEventListener("loadedmetadata", () => {
          e.width = n.videoWidth, e.height = n.videoHeight;
        }), e.ready = !0;
      } catch (t) {
        console.warn("Failed to initialize webcam:", t);
      }
  }
  async initVideo(e) {
    const t = this._videoTextures.find((s) => s.kind === "video" && s.src === e && !s.ready);
    if (!t) return;
    const n = document.createElement("video");
    n.src = e, n.muted = !0, n.loop = !0, n.playsInline = !0, n.crossOrigin = "anonymous", n.addEventListener("loadedmetadata", () => {
      t.width = n.videoWidth, t.height = n.videoHeight;
    });
    try {
      await n.play(), t.video = n, t.ready = !0;
    } catch (s) {
      console.warn(`Failed to play video '${e}':`, s);
    }
  }
  // ===========================================================================
  // Per-frame updates
  // ===========================================================================
  updateAudioTexture(e) {
    var t;
    (t = this._audioTexture) != null && t.analyser && (this._audioTexture.analyser.getByteFrequencyData(this._audioTexture.frequencyData), this._audioTexture.analyser.getByteTimeDomainData(this._audioTexture.waveformData), Ge(
      e,
      this._audioTexture.texture,
      this._audioTexture.frequencyData,
      this._audioTexture.waveformData
    ));
  }
  updateVideoTextures(e) {
    for (const t of this._videoTextures)
      !t.ready || !t.video || t.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || (We(e, t.texture, t.video), t.video.videoWidth > 0 && (t.width = t.video.videoWidth, t.height = t.video.videoHeight));
  }
  // ===========================================================================
  // Cleanup
  // ===========================================================================
  dispose(e) {
    var t, n, s, r;
    this._audioTexture && ((t = this._audioTexture.stream) == null || t.getTracks().forEach((a) => a.stop()), (n = this._audioTexture.audioContext) == null || n.close(), e.deleteTexture(this._audioTexture.texture));
    for (const a of this._videoTextures)
      (s = a.stream) == null || s.getTracks().forEach((o) => o.stop()), (r = a.video) == null || r.pause(), e.deleteTexture(a.texture);
    this._audioTexture = null, this._videoTextures = [];
  }
  // ===========================================================================
  // Helpers
  // ===========================================================================
  getAllChannelSources(e) {
    const t = [], n = e.passes;
    for (const s of [n.Image, n.BufferA, n.BufferB, n.BufferC, n.BufferD])
      s && (t.push(...s.channels), s.namedSamplers && t.push(...s.namedSamplers.values()));
    return t;
  }
}
class at {
  constructor(e) {
    l(this, "definitions");
    l(this, "values", {});
    this.definitions = e, this.initializeDefaults();
  }
  /**
   * Initialize all values to their definition defaults.
   */
  initializeDefaults() {
    for (const [e, t] of Object.entries(this.definitions))
      L(t) ? this.values[e] = new Float32Array(O(t.type, t.count)) : this.values[e] = this.cloneValue(t.value);
  }
  /**
   * Clone a value to avoid mutation of arrays.
   */
  cloneValue(e) {
    return e instanceof Float32Array ? e.slice() : Array.isArray(e) ? [...e] : e;
  }
  /**
   * Get the definition for a uniform.
   */
  getDefinition(e) {
    return this.definitions[e];
  }
  /**
   * Get all definitions.
   */
  getDefinitions() {
    return this.definitions;
  }
  /**
   * Check if a uniform exists.
   */
  has(e) {
    return e in this.definitions;
  }
  /**
   * Get the current value of a uniform.
   */
  get(e) {
    const t = this.values[e];
    return t !== void 0 ? this.cloneValue(t) : void 0;
  }
  /**
   * Get all current values (returns a shallow copy).
   */
  getAll() {
    const e = {};
    for (const [t, n] of Object.entries(this.values))
      e[t] = this.cloneValue(n);
    return e;
  }
  /**
   * Set the value of a uniform.
   * Returns true if the value was set, false if the uniform doesn't exist.
   */
  set(e, t) {
    return this.has(e) ? (this.values[e] = this.cloneValue(t), !0) : !1;
  }
  /**
   * Set multiple values at once.
   */
  setAll(e) {
    for (const [t, n] of Object.entries(e))
      n !== void 0 && this.set(t, n);
  }
  /**
   * Reset a single uniform to its default value.
   */
  reset(e) {
    const t = this.definitions[e];
    return t ? (L(t) ? this.values[e] = new Float32Array(O(t.type, t.count)) : this.values[e] = this.cloneValue(t.value), !0) : !1;
  }
  /**
   * Reset all uniforms to their default values.
   */
  resetAll() {
    this.initializeDefaults();
  }
  /**
   * Get the default value for a uniform.
   */
  getDefault(e) {
    const t = this.definitions[e];
    if (t)
      return L(t) ? new Float32Array(O(t.type, t.count)) : this.cloneValue(t.value);
  }
  /**
   * Iterate over all uniforms (name, definition, current value).
   */
  *entries() {
    for (const [e, t] of Object.entries(this.definitions))
      yield [e, t, this.values[e]];
  }
  /**
   * Get the number of uniforms.
   */
  get size() {
    return Object.keys(this.definitions).length;
  }
  /**
   * Check if there are any uniforms.
   */
  get isEmpty() {
    return this.size === 0;
  }
}
class ot {
  constructor(e, t) {
    l(this, "_store");
    l(this, "_ubos", []);
    l(this, "_dirtyScalars", /* @__PURE__ */ new Set());
    l(this, "_uniforms");
    this._uniforms = t, this._store = new at(t), this.initUBOs(e);
    for (const [n, s] of Object.entries(t))
      L(s) || this._dirtyScalars.add(n);
  }
  // ===========================================================================
  // Accessors
  // ===========================================================================
  /** UBO metadata needed by shaderSource for building declarations */
  get ubos() {
    return this._ubos;
  }
  /** The underlying uniform store */
  get store() {
    return this._store;
  }
  // ===========================================================================
  // Get / Set
  // ===========================================================================
  get(e) {
    return this._store.get(e);
  }
  getAll() {
    return this._store.getAll();
  }
  /**
   * Set the value of a custom uniform.
   * Validates type, packs UBO data for arrays, marks scalars dirty.
   */
  set(e, t) {
    const n = this._uniforms[e];
    if (!n) {
      console.warn(`setUniformValue('${e}'): uniform not defined in config`);
      return;
    }
    if (!L(n)) {
      const s = n.type;
      if ((s === "float" || s === "int") && typeof t != "number") {
        console.warn(`setUniformValue('${e}'): expected number for ${s}, got ${typeof t}`);
        return;
      }
      if (s === "bool" && typeof t != "boolean") {
        console.warn(`setUniformValue('${e}'): expected boolean, got ${typeof t}`);
        return;
      }
      if (s === "vec2" || s === "vec3" || s === "vec4") {
        if (!Array.isArray(t)) {
          console.warn(`setUniformValue('${e}'): expected array for ${s}, got ${typeof t}`);
          return;
        }
        const r = s === "vec2" ? 2 : s === "vec3" ? 3 : 4;
        if (t.length !== r) {
          console.warn(`setUniformValue('${e}'): expected array of length ${r} for ${s}, got ${t.length}`);
          return;
        }
      }
    }
    if (this._store.set(e, t), L(n)) {
      const s = this._ubos.find((r) => r.name === e);
      if (s) {
        const r = t, a = O(n.type, n.count), o = O(n.type, 1);
        if (r.length > a) {
          console.warn(
            `setUniformValue('${e}'): Float32Array length ${r.length} exceeds max ${a} (${n.count} × ${n.type})`
          );
          return;
        }
        if (r.length % o !== 0) {
          console.warn(
            `setUniformValue('${e}'): Float32Array length ${r.length} is not a multiple of ${o} (components per ${n.type})`
          );
          return;
        }
        const c = r.length / o, u = et(n.type, c, r, s.paddedData);
        u !== s.paddedData && s.paddedData.set(u);
        const d = Qe(n.type, c), h = s.paddedData.length;
        d < h && s.paddedData.fill(0, d), s.activeCount = c, s.dirty = !0;
      }
    } else
      this._dirtyScalars.add(e);
  }
  setMultiple(e) {
    for (const [t, n] of Object.entries(e))
      n !== void 0 && this.set(t, n);
  }
  // ===========================================================================
  // GL Binding
  // ===========================================================================
  /**
   * Bind custom uniform values to the current program.
   * Uploads dirty UBOs and re-binds changed scalar uniforms.
   */
  bindToProgram(e, t) {
    for (const n of this._ubos) {
      n.dirty && (e.bindBuffer(e.UNIFORM_BUFFER, n.buffer), e.bufferSubData(e.UNIFORM_BUFFER, 0, n.paddedData), n.dirty = !1);
      const s = t.custom.get(`${n.name}_count`);
      s && e.uniform1i(s, n.activeCount);
    }
    for (const n of this._dirtyScalars) {
      const s = this._uniforms[n];
      if (!s || L(s)) continue;
      const r = this._store.get(n);
      if (r === void 0) continue;
      const a = t.custom.get(n);
      if (a)
        switch (s.type) {
          case "float":
            e.uniform1f(a, r);
            break;
          case "int":
            e.uniform1i(a, r);
            break;
          case "bool":
            e.uniform1i(a, r ? 1 : 0);
            break;
          case "vec2": {
            const o = r;
            e.uniform2f(a, o[0], o[1]);
            break;
          }
          case "vec3": {
            const o = r;
            e.uniform3f(a, o[0], o[1], o[2]);
            break;
          }
          case "vec4": {
            const o = r;
            e.uniform4f(a, o[0], o[1], o[2], o[3]);
            break;
          }
        }
    }
  }
  /** Clear dirty flags after all passes have been bound. */
  clearDirty() {
    this._dirtyScalars.clear();
  }
  /** Mark all scalar uniforms dirty (e.g., after recompilation). */
  markAllScalarsDirty() {
    for (const [e, t] of Object.entries(this._uniforms))
      L(t) || this._dirtyScalars.add(e);
  }
  /**
   * Bind UBO block indices for a newly compiled program.
   * Also caches _count uniform locations.
   */
  bindUBOsToProgram(e, t, n) {
    for (const s of this._ubos) {
      const r = e.getUniformBlockIndex(t, `_ub_${s.name}`);
      r !== e.INVALID_INDEX && e.uniformBlockBinding(t, r, s.bindingPoint), n.set(`${s.name}_count`, e.getUniformLocation(t, `${s.name}_count`));
    }
  }
  // ===========================================================================
  // Cleanup
  // ===========================================================================
  dispose(e) {
    for (const t of this._ubos)
      e.deleteBuffer(t.buffer);
    this._ubos = [];
  }
  // ===========================================================================
  // Initialization
  // ===========================================================================
  initUBOs(e) {
    const t = e.getParameter(e.MAX_UNIFORM_BLOCK_SIZE), n = e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);
    let s = 0;
    for (const [r, a] of Object.entries(this._uniforms)) {
      if (!L(a)) continue;
      const o = Je(a.type, a.count);
      if (o > t)
        throw new Error(
          `Array uniform '${r}' requires ${o} bytes but GL MAX_UNIFORM_BLOCK_SIZE is ${t}`
        );
      const c = e.createBuffer();
      if (!c) throw new Error(`Failed to create UBO buffer for '${r}'`);
      if (e.bindBuffer(e.UNIFORM_BUFFER, c), e.bufferData(e.UNIFORM_BUFFER, o, e.DYNAMIC_DRAW), e.bindBuffer(e.UNIFORM_BUFFER, null), s >= n)
        throw new Error(
          `Too many array uniforms: binding point ${s} exceeds GL MAX_UNIFORM_BUFFER_BINDINGS (${n})`
        );
      e.bindBufferBase(e.UNIFORM_BUFFER, s, c);
      const u = new Float32Array(o / 4);
      this._ubos.push({
        name: r,
        def: a,
        buffer: c,
        bindingPoint: s,
        byteSize: o,
        dirty: !1,
        paddedData: u,
        activeCount: 0
      }), s++;
    }
  }
}
class fe {
  constructor(e) {
    l(this, "project");
    l(this, "gl");
    l(this, "_width");
    l(this, "_height");
    l(this, "_frame", 0);
    l(this, "_time", 0);
    l(this, "_lastStepTime", null);
    l(this, "_passes", []);
    l(this, "_textures", []);
    l(this, "_keyboardTexture", null);
    l(this, "_blackTexture", null);
    // Keyboard state tracking (Maps keycodes to state)
    l(this, "_keyStates", /* @__PURE__ */ new Map());
    // true = down, false = up
    l(this, "_toggleStates", /* @__PURE__ */ new Map());
    // 0.0 or 1.0
    // Compilation errors (if any occurred during initialization)
    l(this, "_compilationErrors", []);
    // Custom uniforms (scalars + UBO-backed arrays)
    l(this, "_uniformMgr");
    // Media (audio, video, webcam)
    l(this, "_media");
    // Script-uploaded textures
    l(this, "_scriptTextures", /* @__PURE__ */ new Map());
    // Shared VAO for fullscreen triangle (all passes reference this)
    l(this, "_sharedVAO", null);
    // Disposal flag — guards async callbacks (e.g. image loads) after engine is destroyed
    l(this, "_disposed", !1);
    // View names for multi-view projects (enables cross-view uniforms)
    l(this, "_viewNames", []);
    // Asset error callback
    l(this, "_onAssetError");
    this.gl = e.gl, this.project = e.project, this._onAssetError = e.onAssetError, this._width = this.gl.drawingBufferWidth, this._height = this.gl.drawingBufferHeight, this.initExtensions(), this._blackTexture = je(this.gl);
    const t = Ke(this.gl);
    this._keyboardTexture = {
      texture: t,
      width: 256,
      height: 3
    }, this.initProjectTextures(), this._media = new rt(this.gl, e.project), this._uniformMgr = new ot(this.gl, e.project.uniforms), e.viewNames && e.viewNames.length > 1 && (this._viewNames = e.viewNames), this.initRuntimePasses();
  }
  // ===========================================================================
  // Media Delegates (forwarded to MediaManager)
  // ===========================================================================
  async initAudio() {
    return this._media.initAudio();
  }
  updateAudioTexture() {
    this._media.updateAudioTexture(this.gl);
  }
  async initWebcam() {
    return this._media.initWebcam();
  }
  async initVideo(e) {
    return this._media.initVideo(e);
  }
  updateVideoTextures() {
    this._media.updateVideoTextures(this.gl);
  }
  /** Whether this project uses audio channels. */
  get needsAudio() {
    return this._media.needsAudio;
  }
  /** Whether this project uses webcam channels. */
  get needsWebcam() {
    return this._media.needsWebcam;
  }
  /** Get video sources that need initialization. */
  get videoSources() {
    return this._media.videoSources;
  }
  /**
   * Upload or update a named texture from JavaScript (for script channel).
   */
  updateTexture(e, t, n, s) {
    const r = this._scriptTextures.get(e), a = s instanceof Float32Array;
    if (r && r.width === t && r.height === n && r.isFloat === a) {
      const o = this.gl;
      o.bindTexture(o.TEXTURE_2D, r.texture), a ? o.texSubImage2D(o.TEXTURE_2D, 0, 0, 0, t, n, o.RGBA, o.FLOAT, s) : o.texSubImage2D(o.TEXTURE_2D, 0, 0, 0, t, n, o.RGBA, o.UNSIGNED_BYTE, s), o.bindTexture(o.TEXTURE_2D, null);
    } else {
      const o = qe(
        this.gl,
        (r == null ? void 0 : r.texture) ?? null,
        t,
        n,
        s
      );
      this._scriptTextures.set(e, { texture: o, width: t, height: n, isFloat: a });
    }
  }
  /**
   * Read pixels from a buffer pass (reads previous frame's data).
   */
  readPixels(e, t, n, s, r) {
    const a = this._passes.find((u) => u.name === e);
    if (!a)
      return console.warn(`readPixels: pass '${e}' not found`), new Uint8Array(s * r * 4);
    const o = this.gl;
    o.bindFramebuffer(o.FRAMEBUFFER, a.framebuffer), o.framebufferTexture2D(o.FRAMEBUFFER, o.COLOR_ATTACHMENT0, o.TEXTURE_2D, a.previousTexture, 0);
    const c = new Uint8Array(s * r * 4);
    return o.readPixels(t, n, s, r, o.RGBA, o.UNSIGNED_BYTE, c), o.framebufferTexture2D(o.FRAMEBUFFER, o.COLOR_ATTACHMENT0, o.TEXTURE_2D, a.currentTexture, 0), o.bindFramebuffer(o.FRAMEBUFFER, null), c;
  }
  // ===========================================================================
  // Public API
  // ===========================================================================
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get stats() {
    const e = this._lastStepTime === null ? 0 : this._time - this._lastStepTime;
    return {
      frame: this._frame,
      time: this._time,
      deltaTime: e,
      width: this._width,
      height: this._height
    };
  }
  /**
   * Get shader compilation errors (if any occurred during initialization).
   * Returns empty array if all shaders compiled successfully.
   */
  getCompilationErrors() {
    return this._compilationErrors;
  }
  /**
   * Check if there were any compilation errors.
   */
  hasErrors() {
    return this._compilationErrors.length > 0;
  }
  getUniformStore() {
    return this._uniformMgr.store;
  }
  getUniformValue(e) {
    return this._uniformMgr.get(e);
  }
  getUniformValues() {
    return this._uniformMgr.getAll();
  }
  setUniformValue(e, t) {
    this._uniformMgr.set(e, t);
  }
  setUniformValues(e) {
    this._uniformMgr.setMultiple(e);
  }
  /** Export UBO data for HTML export (copies current padded data). */
  getUBOExportData() {
    return this._uniformMgr.ubos.map((e) => ({
      name: e.name,
      type: e.def.type,
      count: e.def.count,
      bindingPoint: e.bindingPoint,
      paddedData: new Float32Array(e.paddedData)
    }));
  }
  /**
   * Get the framebuffer for the Image pass (for presenting to screen).
   */
  getImageFramebuffer() {
    const e = this._passes.find((t) => t.name === "Image");
    return (e == null ? void 0 : e.framebuffer) ?? null;
  }
  /**
   * Bind the Image pass output as the READ_FRAMEBUFFER for blitting to screen.
   *
   * After the ping-pong swap, the rendered output is in previousTexture,
   * but the framebuffer is attached to currentTexture. This method temporarily
   * attaches previousTexture so blitFramebuffer reads the correct data.
   */
  bindImageForRead() {
    const e = this.gl, t = this._passes.find((n) => n.name === "Image");
    return t ? (e.bindFramebuffer(e.READ_FRAMEBUFFER, t.framebuffer), e.framebufferTexture2D(
      e.READ_FRAMEBUFFER,
      e.COLOR_ATTACHMENT0,
      e.TEXTURE_2D,
      t.previousTexture,
      0
    ), !0) : !1;
  }
  /**
   * Restore the Image pass framebuffer to its normal state (attached to currentTexture).
   * Call after blitting to screen.
   */
  unbindImageForRead() {
    const e = this.gl, t = this._passes.find((n) => n.name === "Image");
    t && (e.framebufferTexture2D(
      e.READ_FRAMEBUFFER,
      e.COLOR_ATTACHMENT0,
      e.TEXTURE_2D,
      t.currentTexture,
      0
    ), e.bindFramebuffer(e.READ_FRAMEBUFFER, null));
  }
  /**
   * Run one full frame of all passes.
   *
   * @param timeSeconds - global time in seconds (monotone, from App)
   * @param mouse - iMouse as [x, y, clickX, clickY]
   * @param touch - optional touch state for touch uniforms
   */
  step(e, t, n, s, r) {
    const a = this.gl, o = this._lastStepTime === null ? 0 : e - this._lastStepTime;
    this._lastStepTime = e, this._time = e;
    const c = /* @__PURE__ */ new Date(), u = s ?? {
      count: 0,
      touches: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      pinch: 1,
      pinchDelta: 0,
      pinchCenter: [0, 0]
    }, d = {
      iResolution: [this._width, this._height, 1],
      iTime: this._time,
      iTimeDelta: o,
      iFrame: this._frame,
      iMouse: t,
      iMousePressed: n,
      iDate: [
        c.getFullYear(),
        c.getMonth(),
        // 0-11 (matches Shadertoy)
        c.getDate(),
        // 1-31
        c.getHours() * 3600 + c.getMinutes() * 60 + c.getSeconds() + c.getMilliseconds() / 1e3
      ],
      iFrameRate: o > 0 ? 1 / o : 60,
      iTouchCount: u.count,
      iTouch: u.touches,
      iPinch: u.pinch,
      iPinchDelta: u.pinchDelta,
      iPinchCenter: u.pinchCenter,
      crossViewStates: r
    };
    a.viewport(0, 0, this._width, this._height);
    const h = ["BufferA", "BufferB", "BufferC", "BufferD", "Image"];
    for (const T of h) {
      const _ = this._passes.find((y) => y.name === T);
      _ && (this.executePass(_, d), this.swapPassTextures(_));
    }
    this._uniformMgr.clearDirty(), this._frame += 1;
  }
  /**
   * Resize all internal render targets to new width/height.
   * Does not reset time or frame count.
   */
  resize(e, t) {
    this._width = e, this._height = t;
    const n = this.gl;
    for (const s of this._passes)
      n.deleteTexture(s.currentTexture), n.deleteTexture(s.previousTexture), n.deleteFramebuffer(s.framebuffer), s.currentTexture = Y(n, e, t), s.previousTexture = Y(n, e, t), s.framebuffer = he(n, s.currentTexture);
  }
  /**
   * Reset frame counter and clear all render targets.
   * Used for playback controls to restart shader from frame 0.
   */
  reset() {
    this._frame = 0;
    const e = this.gl;
    for (const t of this._passes)
      e.bindFramebuffer(e.FRAMEBUFFER, t.framebuffer), e.clearColor(0, 0, 0, 0), e.clear(e.COLOR_BUFFER_BIT), e.framebufferTexture2D(
        e.FRAMEBUFFER,
        e.COLOR_ATTACHMENT0,
        e.TEXTURE_2D,
        t.previousTexture,
        0
      ), e.clear(e.COLOR_BUFFER_BIT), e.framebufferTexture2D(
        e.FRAMEBUFFER,
        e.COLOR_ATTACHMENT0,
        e.TEXTURE_2D,
        t.currentTexture,
        0
      );
    e.bindFramebuffer(e.FRAMEBUFFER, null);
  }
  /**
   * Update keyboard key state (called from App on keydown/keyup events).
   *
   * @param keycode ASCII keycode (e.g., 65 for 'A')
   * @param isDown true if key pressed, false if released
   */
  updateKeyState(e, t) {
    const n = this._keyStates.get(e) || !1;
    if (this._keyStates.set(e, t), t && !n) {
      const s = this._toggleStates.get(e) || 0;
      this._toggleStates.set(e, s === 0 ? 1 : 0);
    }
  }
  /**
   * Update keyboard texture with current key states.
   * Should be called once per frame before rendering.
   */
  updateKeyboardTexture() {
    this._keyboardTexture && Ye(
      this.gl,
      this._keyboardTexture.texture,
      this._keyStates,
      this._toggleStates
    );
  }
  /**
   * Recompile a single pass with new GLSL source code.
   * Used for live editing - keeps the old shader running if compilation fails.
   *
   * @param passName - Name of the pass to recompile ('Image', 'BufferA', etc.)
   * @param newSource - New GLSL source code for the pass
   * @returns Object with success status and error message if failed
   */
  recompilePass(e, t) {
    const n = this.gl, s = this._passes.find((o) => o.name === e);
    if (!s)
      return { success: !1, error: `Pass '${e}' not found` };
    const r = this.project.passes[e];
    if (!r)
      return { success: !1, error: `Project pass '${e}' not found` };
    const { source: a } = this.buildFragmentShader(t, r.channels, r.namedSamplers);
    try {
      const o = de(n, pe, a);
      return n.deleteProgram(s.uniforms.program), s.uniforms = this.cacheUniformLocations(o, r.namedSamplers), r.glslSource = t, this._compilationErrors = this._compilationErrors.filter((c) => c.passName !== e), this._uniformMgr.markAllScalarsDirty(), { success: !0 };
    } catch (o) {
      return { success: !1, error: o instanceof Error ? o.message : String(o) };
    }
  }
  /**
   * Recompile common.glsl and all passes that use it.
   * Used for live editing of common code.
   *
   * @param newCommonSource - New GLSL source code for common.glsl
   * @returns Object with success status and errors for each failed pass
   */
  recompileCommon(e) {
    const t = this.project.commonSource;
    this.project.commonSource = e;
    const n = [], s = ["BufferA", "BufferB", "BufferC", "BufferD", "Image"];
    for (const r of s) {
      const a = this.project.passes[r];
      if (!a) continue;
      const o = this.recompilePass(r, a.glslSource);
      o.success || n.push({ passName: r, error: o.error || "Unknown error" });
    }
    if (n.length > 0) {
      this.project.commonSource = t;
      for (const r of s) {
        const a = this.project.passes[r];
        if (!a || n.some((c) => c.passName === r)) continue;
        const o = this.recompilePass(r, a.glslSource);
        o.success || (console.error(`Failed to revert ${r} to old common source:`, o.error), n.push({ passName: r, error: `Revert failed: ${o.error}` }));
      }
      return { success: !1, errors: n };
    }
    return { success: !0, errors: [] };
  }
  /**
   * Delete all GL resources.
   */
  dispose() {
    this._disposed = !0;
    const e = this.gl;
    for (const t of this._passes)
      e.deleteProgram(t.uniforms.program), e.deleteFramebuffer(t.framebuffer), e.deleteTexture(t.currentTexture), e.deleteTexture(t.previousTexture);
    this._sharedVAO && (e.deleteVertexArray(this._sharedVAO), this._sharedVAO = null);
    for (const t of this._textures)
      e.deleteTexture(t.texture);
    this._keyboardTexture && e.deleteTexture(this._keyboardTexture.texture), this._blackTexture && e.deleteTexture(this._blackTexture);
    for (const [, t] of this._scriptTextures)
      e.deleteTexture(t.texture);
    this._scriptTextures.clear(), this._uniformMgr.dispose(e), this._media.dispose(e), this._passes = [], this._textures = [], this._keyboardTexture = null, this._blackTexture = null;
  }
  // ===========================================================================
  // Initialization Helpers
  // ===========================================================================
  initExtensions() {
    const e = this.gl;
    if (!e.getExtension("EXT_color_buffer_float"))
      throw new Error(
        "EXT_color_buffer_float not supported. WebGL2 with float rendering is required."
      );
    e.getExtension("OES_texture_float_linear");
  }
  /**
   * Cache uniform locations for a compiled program.
   * Returns a PassUniformLocations object with all standard and custom uniform locations.
   */
  cacheUniformLocations(e, t) {
    const n = this.gl, s = /* @__PURE__ */ new Map();
    for (const [r, a] of Object.entries(this.project.uniforms))
      L(a) || s.set(r, n.getUniformLocation(e, r));
    return this._uniformMgr.bindUBOsToProgram(n, e, s), {
      program: e,
      iResolution: n.getUniformLocation(e, "iResolution"),
      iTime: n.getUniformLocation(e, "iTime"),
      iTimeDelta: n.getUniformLocation(e, "iTimeDelta"),
      iFrame: n.getUniformLocation(e, "iFrame"),
      iMouse: n.getUniformLocation(e, "iMouse"),
      iMousePressed: n.getUniformLocation(e, "iMousePressed"),
      iDate: n.getUniformLocation(e, "iDate"),
      iFrameRate: n.getUniformLocation(e, "iFrameRate"),
      iChannel: [
        n.getUniformLocation(e, "iChannel0"),
        n.getUniformLocation(e, "iChannel1"),
        n.getUniformLocation(e, "iChannel2"),
        n.getUniformLocation(e, "iChannel3")
      ],
      iChannelResolution: [
        n.getUniformLocation(e, "iChannelResolution[0]"),
        n.getUniformLocation(e, "iChannelResolution[1]"),
        n.getUniformLocation(e, "iChannelResolution[2]"),
        n.getUniformLocation(e, "iChannelResolution[3]")
      ],
      // Touch uniforms
      iTouchCount: n.getUniformLocation(e, "iTouchCount"),
      iTouch: [
        n.getUniformLocation(e, "iTouch0"),
        n.getUniformLocation(e, "iTouch1"),
        n.getUniformLocation(e, "iTouch2")
      ],
      iPinch: n.getUniformLocation(e, "iPinch"),
      iPinchDelta: n.getUniformLocation(e, "iPinchDelta"),
      iPinchCenter: n.getUniformLocation(e, "iPinchCenter"),
      custom: s,
      namedSamplers: (() => {
        const r = /* @__PURE__ */ new Map();
        if (t)
          for (const [a] of t)
            r.set(a, n.getUniformLocation(e, a));
        return r;
      })(),
      namedSamplerResolutions: (() => {
        const r = /* @__PURE__ */ new Map();
        if (t)
          for (const [a] of t)
            r.set(a, n.getUniformLocation(e, `${a}_resolution`));
        return r;
      })(),
      // Cross-view uniforms for multi-view projects
      crossViewMouse: (() => {
        const r = /* @__PURE__ */ new Map();
        if (this._viewNames.length > 1)
          for (const a of this._viewNames)
            r.set(a, n.getUniformLocation(e, `iMouse_${a}`));
        return r;
      })(),
      crossViewResolution: (() => {
        const r = /* @__PURE__ */ new Map();
        if (this._viewNames.length > 1)
          for (const a of this._viewNames)
            r.set(a, n.getUniformLocation(e, `iResolution_${a}`));
        return r;
      })(),
      crossViewMousePressed: (() => {
        const r = /* @__PURE__ */ new Map();
        if (this._viewNames.length > 1)
          for (const a of this._viewNames)
            r.set(a, n.getUniformLocation(e, `iMousePressed_${a}`));
        return r;
      })()
    };
  }
  /**
   * Initialize external textures based on project.textures.
   *
   * NOTE: This function as written assumes that actual image loading
   * is handled elsewhere. For now we just construct an empty array.
   * In a real implementation, you would load images here.
   */
  initProjectTextures() {
    const e = this.gl;
    this._textures = [];
    for (const t of this.project.textures) {
      const n = e.createTexture();
      if (!n)
        throw new Error("Failed to create texture");
      e.bindTexture(e.TEXTURE_2D, n), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, 1, 1, 0, e.RGBA, e.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      const s = {
        name: t.name,
        texture: n,
        width: 1,
        height: 1
      };
      this._textures.push(s);
      const r = new Image();
      r.crossOrigin = "anonymous", r.onload = () => {
        if (this._disposed || e.isContextLost()) return;
        e.bindTexture(e.TEXTURE_2D, n), e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, !0), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, r), e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, !1);
        const a = t.filter !== "nearest";
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, a ? e.LINEAR : e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, a ? e.LINEAR_MIPMAP_LINEAR : e.NEAREST);
        const o = t.wrap === "clamp" ? e.CLAMP_TO_EDGE : e.REPEAT;
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, o), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, o), a && e.generateMipmap(e.TEXTURE_2D), s.width = r.width, s.height = r.height, console.log(`Loaded texture '${t.name}': ${r.width}x${r.height}`);
      }, r.onerror = () => {
        var a;
        console.error(`Failed to load texture '${t.name}' from ${t.source}`), (a = this._onAssetError) == null || a.call(this, { type: "texture", name: t.name, detail: t.source });
      }, r.src = t.source;
    }
  }
  /**
   * Compile shaders, create VAOs/FBOs/textures, and build RuntimePass array.
   */
  initRuntimePasses() {
    const e = this.gl, t = this.project, n = Xe(e);
    this._sharedVAO = n;
    const s = ["BufferA", "BufferB", "BufferC", "BufferD", "Image"];
    for (const r of s) {
      const a = t.passes[r];
      if (!a) continue;
      const { source: o, lineMapping: c } = this.buildFragmentShader(a.glslSource, a.channels, a.namedSamplers);
      try {
        const u = de(e, pe, o), d = this.cacheUniformLocations(u, a.namedSamplers), h = Y(e, this._width, this._height), T = Y(e, this._width, this._height), _ = he(e, h), y = {
          name: r,
          projectChannels: a.channels,
          vao: n,
          uniforms: d,
          framebuffer: _,
          currentTexture: h,
          previousTexture: T,
          namedSamplers: a.namedSamplers
        };
        this._passes.push(y);
      } catch (u) {
        const d = u instanceof Error ? u.message : String(u), h = d.match(/ERROR:\s*\d+:(\d+):/);
        let T = !1, _ = null;
        if (h) {
          const y = parseInt(h[1], 10);
          if (c.commonStartLine > 0 && c.commonLines > 0) {
            const b = c.commonStartLine + c.commonLines - 1;
            y >= c.commonStartLine && y <= b && (T = !0, _ = y - c.commonStartLine + 1);
          }
          !T && c.userCodeStartLine > 0 && y >= c.userCodeStartLine && (_ = y - c.userCodeStartLine + 1);
        }
        this._compilationErrors.push({
          passName: r,
          error: d,
          source: o,
          isFromCommon: T,
          originalLine: _,
          lineMapping: c
        }), console.error(`Failed to compile ${r}:`, d);
      }
    }
  }
  /**
   * Build complete fragment shader source with Shadertoy boilerplate.
   */
  buildFragmentShader(e, t, n) {
    return it(e, t, {
      commonSource: this.project.commonSource ?? "",
      ubos: this._uniformMgr.ubos.map((s) => ({ name: s.name, def: s.def, count: s.def.count })),
      uniforms: this.project.uniforms,
      namedSamplers: n,
      viewNames: this._viewNames.length > 1 ? this._viewNames : void 0
    });
  }
  /**
   * Set view names for multi-view projects.
   * This enables cross-view uniforms (iMouse_viewName, iResolution_viewName, etc.)
   * Must be called before shader compilation.
   */
  setViewNames(e) {
    this._viewNames = e;
  }
  // ===========================================================================
  // Pass Execution
  // ===========================================================================
  executePass(e, t) {
    const n = this.gl;
    n.bindFramebuffer(n.FRAMEBUFFER, e.framebuffer), n.useProgram(e.uniforms.program), n.bindVertexArray(e.vao), this.bindBuiltinUniforms(e.uniforms, t), this._uniformMgr.bindToProgram(n, e.uniforms), e.namedSamplers && e.namedSamplers.size > 0 ? this.bindNamedSamplers(e) : this.bindChannelTextures(e), n.drawArrays(n.TRIANGLES, 0, 3), n.bindVertexArray(null), n.useProgram(null), n.bindFramebuffer(n.FRAMEBUFFER, null);
  }
  bindBuiltinUniforms(e, t) {
    const n = this.gl;
    e.iResolution && n.uniform3f(e.iResolution, t.iResolution[0], t.iResolution[1], t.iResolution[2]), e.iTime && n.uniform1f(e.iTime, t.iTime), e.iTimeDelta && n.uniform1f(e.iTimeDelta, t.iTimeDelta), e.iFrame && n.uniform1i(e.iFrame, t.iFrame), e.iMouse && n.uniform4f(e.iMouse, t.iMouse[0], t.iMouse[1], t.iMouse[2], t.iMouse[3]), e.iMousePressed && n.uniform1i(e.iMousePressed, t.iMousePressed ? 1 : 0), e.iDate && n.uniform4f(e.iDate, t.iDate[0], t.iDate[1], t.iDate[2], t.iDate[3]), e.iFrameRate && n.uniform1f(e.iFrameRate, t.iFrameRate), e.iTouchCount && n.uniform1i(e.iTouchCount, t.iTouchCount);
    for (let s = 0; s < 3; s++) {
      const r = e.iTouch[s];
      if (r) {
        const a = t.iTouch[s];
        n.uniform4f(r, a[0], a[1], a[2], a[3]);
      }
    }
    if (e.iPinch && n.uniform1f(e.iPinch, t.iPinch), e.iPinchDelta && n.uniform1f(e.iPinchDelta, t.iPinchDelta), e.iPinchCenter && n.uniform2f(e.iPinchCenter, t.iPinchCenter[0], t.iPinchCenter[1]), t.crossViewStates)
      for (const [s, r] of t.crossViewStates) {
        const a = e.crossViewMouse.get(s);
        a && n.uniform4f(a, r.mouse[0], r.mouse[1], r.mouse[2], r.mouse[3]);
        const o = e.crossViewResolution.get(s);
        o && n.uniform3f(o, r.resolution[0], r.resolution[1], r.resolution[2]);
        const c = e.crossViewMousePressed.get(s);
        c && n.uniform1i(c, r.mousePressed ? 1 : 0);
      }
  }
  bindChannelTextures(e) {
    const t = this.gl;
    for (let n = 0; n < 4; n++) {
      const s = e.projectChannels[n], r = this.resolveChannelTexture(s), a = this.resolveChannelResolution(s);
      t.activeTexture(t.TEXTURE0 + n), t.bindTexture(t.TEXTURE_2D, r);
      const o = e.uniforms.iChannel[n];
      o && t.uniform1i(o, n);
      const c = e.uniforms.iChannelResolution[n];
      c && t.uniform3f(c, a[0], a[1], 1);
    }
  }
  /**
   * Bind named samplers (standard mode).
   * Each named sampler gets its own texture unit.
   */
  bindNamedSamplers(e) {
    const t = this.gl;
    let n = 0;
    for (const [s, r] of e.namedSamplers) {
      const a = this.resolveChannelTexture(r), o = this.resolveChannelResolution(r);
      t.activeTexture(t.TEXTURE0 + n), t.bindTexture(t.TEXTURE_2D, a);
      const c = e.uniforms.namedSamplers.get(s);
      c && t.uniform1i(c, n);
      const u = e.uniforms.namedSamplerResolutions.get(s);
      u && t.uniform3f(u, o[0], o[1], 1), n++;
    }
  }
  /**
   * Resolve a ChannelSource to an actual WebGLTexture to bind.
   */
  resolveChannelTexture(e) {
    switch (e.kind) {
      case "none":
        if (!this._blackTexture)
          throw new Error("Black texture not initialized");
        return this._blackTexture;
      case "buffer": {
        const t = this._passes.find((n) => n.name === e.buffer);
        return t ? e.current ? t.currentTexture : t.previousTexture : (console.warn(`resolveChannelTexture: buffer '${e.buffer}' not found, using black`), this._blackTexture);
      }
      case "texture": {
        const t = this._textures.find((n) => n.name === e.name);
        return t ? t.texture : (console.warn(`resolveChannelTexture: texture '${e.name}' not found, using black`), this._blackTexture);
      }
      case "keyboard":
        if (!this._keyboardTexture)
          throw new Error("Internal error: keyboard texture not initialized");
        return this._keyboardTexture.texture;
      case "audio":
        return this._media.audioTexture ? this._media.audioTexture.texture : this._blackTexture;
      case "webcam": {
        const t = this._media.videoTextures.find((n) => n.kind === "webcam");
        return (t == null ? void 0 : t.texture) ?? this._blackTexture;
      }
      case "video": {
        const t = this._media.videoTextures.find((n) => n.kind === "video" && n.src === e.src);
        return (t == null ? void 0 : t.texture) ?? this._blackTexture;
      }
      case "script": {
        const t = this._scriptTextures.get(e.name);
        return (t == null ? void 0 : t.texture) ?? this._blackTexture;
      }
    }
  }
  /**
   * Resolve a ChannelSource to its resolution [width, height].
   * Returns [0, 0] for unused channels.
   */
  resolveChannelResolution(e) {
    switch (e.kind) {
      case "none":
        return [0, 0];
      case "buffer":
        return [this._width, this._height];
      case "texture": {
        const t = this._textures.find((n) => n.name === e.name);
        return t ? [t.width, t.height] : [0, 0];
      }
      case "keyboard":
        return [256, 3];
      case "audio":
        return this._media.audioTexture ? [this._media.audioTexture.width, this._media.audioTexture.height] : [0, 0];
      case "webcam": {
        const t = this._media.videoTextures.find((n) => n.kind === "webcam");
        return t ? [t.width, t.height] : [0, 0];
      }
      case "video": {
        const t = this._media.videoTextures.find((n) => n.kind === "video" && n.src === e.src);
        return t ? [t.width, t.height] : [0, 0];
      }
      case "script": {
        const t = this._scriptTextures.get(e.name);
        return t ? [t.width, t.height] : [0, 0];
      }
    }
  }
  /**
   * Swap current and previous textures for a pass (ping-pong).
   * Also reattach framebuffer to new current texture.
   */
  swapPassTextures(e) {
    const t = this.gl, n = e.currentTexture;
    e.currentTexture = e.previousTexture, e.previousTexture = n, t.bindFramebuffer(t.FRAMEBUFFER, e.framebuffer), t.framebufferTexture2D(
      t.FRAMEBUFFER,
      t.COLOR_ATTACHMENT0,
      t.TEXTURE_2D,
      e.currentTexture,
      0
    ), t.bindFramebuffer(t.FRAMEBUFFER, null);
  }
}
class ct {
  constructor(e) {
    l(this, "container");
    l(this, "overlay", null);
    this.container = e;
  }
  /**
   * Display shader compilation errors in an overlay.
   */
  show(e, t) {
    this.overlay || (this.overlay = document.createElement("div"), this.overlay.className = "shader-error-overlay", this.container.appendChild(this.overlay));
    const n = e.filter((d) => d.isFromCommon), s = e.filter((d) => !d.isFromCommon), c = [...n.length > 0 ? [n[0]] : [], ...s].map(({ passName: d, error: h, isFromCommon: T, originalLine: _, lineMapping: y }) => {
      const b = h.replace(`Shader compilation failed:
`, ""), w = _;
      let R = b;
      w !== null && (R = b.replace(/ERROR:\s*\d+:(\d+):/g, `ERROR: 0:${w}:`));
      let p = null;
      if (T)
        p = t.commonSource;
      else {
        const m = t.passes[d];
        p = (m == null ? void 0 : m.glslSource) ?? null;
      }
      return {
        passName: T ? "common.glsl" : d,
        error: lt(R, y, T),
        codeContext: w !== null && p ? dt(p, w) : null
      };
    }).map(({ passName: d, error: h, codeContext: T }) => `
      <div class="error-section">
        <div class="error-pass-name">${d}</div>
        <pre class="error-content">${Se(h)}</pre>
        ${T ? `<pre class="error-code-context">${T}</pre>` : ""}
      </div>
    `).join("");
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
          ${c}
        </div>
      </div>
    `;
    const u = this.overlay.querySelector(".error-close");
    u && u.addEventListener("click", () => this.hide());
  }
  /**
   * Hide the error overlay.
   */
  hide() {
    this.overlay && (this.overlay.remove(), this.overlay = null);
  }
  /**
   * Clean up resources.
   */
  dispose() {
    this.hide();
  }
}
function lt(i, e, t) {
  return i.split(`
`).map((n) => {
    const s = n.match(/^ERROR:\s*(\d+):(\d+):\s*(.+)$/);
    if (s) {
      const [, , r, a] = s, o = parseInt(r, 10);
      let c = o;
      return t && e.commonStartLine > 0 ? c = o - e.commonStartLine + 1 : e.userCodeStartLine > 0 && o >= e.userCodeStartLine && (c = o - e.userCodeStartLine + 1), `Line ${c}: ${ut(a)}`;
    }
    return n;
  }).join(`
`);
}
function ut(i) {
  return i.includes("no matching overloaded function found") ? i + " (check function name spelling and argument types)" : i.includes("undeclared identifier") ? i + " (variable not declared — check spelling)" : i.includes("syntax error") ? i + " (check for missing semicolons, brackets, or commas)" : i.includes("is not a function") ? i + " (identifier exists but is not callable)" : i.includes("wrong operand types") ? i + " (type mismatch — check vec/float/int types)" : i;
}
function dt(i, e) {
  const t = i.split(`
`);
  if (e < 1 || e > t.length) return null;
  const n = 3, s = Math.max(0, e - n - 1), r = Math.min(t.length, e + n);
  return t.slice(s, r).map((o, c) => {
    const u = s + c + 1, d = u === e, h = String(u).padStart(4, " "), T = Se(o);
    return d ? `<span class="error-line-highlight">${h} │ ${T}</span>` : `<span class="context-line">${h} │ ${T}</span>`;
  }).join("");
}
function Se(i) {
  const e = document.createElement("div");
  return e.textContent = i, e.innerHTML;
}
const $ = class $ {
  constructor(e) {
    l(this, "container");
    l(this, "overlay", null);
    l(this, "autoHideTimer", null);
    this.container = e;
  }
  /**
   * Show an error from setup() or onFrame().
   */
  showError(e, t) {
    this.clearAutoHide(), this.ensureOverlay();
    const n = t instanceof Error ? t.message : String(t), s = t instanceof Error && t.stack ? t.stack.split(`
`).slice(1, 4).join(`
`) : "";
    this.overlay.innerHTML = `
      <div class="script-error-content">
        <div class="script-error-header">
          <span class="script-error-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z"/>
            </svg>
            script.js ${e}() error
          </span>
          <button class="script-error-close" title="Dismiss">×</button>
        </div>
        <pre class="script-error-message">${z(n)}</pre>
        ${s ? `<pre class="script-error-stack">${z(s)}</pre>` : ""}
      </div>
    `, this.wireClose(), this.autoHideTimer = setTimeout(() => this.hide(), $.AUTO_HIDE_MS);
  }
  /**
   * Show a persistent warning when onFrame() has been disabled.
   */
  showDisabled() {
    this.clearAutoHide(), this.ensureOverlay(), this.overlay.innerHTML = `
      <div class="script-error-content">
        <div class="script-error-header disabled">
          <span class="script-error-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z"/>
            </svg>
            script.js onFrame() disabled
          </span>
          <button class="script-error-close" title="Dismiss">×</button>
        </div>
        <pre class="script-error-message">Too many consecutive errors. Reload to retry.</pre>
      </div>
    `, this.wireClose();
  }
  /**
   * Show a warning banner for asset load errors (textures, framebuffers).
   */
  showWarning(e, t) {
    this.clearAutoHide(), this.ensureOverlay(), this.overlay.innerHTML = `
      <div class="script-error-content">
        <div class="script-error-header warning">
          <span class="script-error-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            ${z(e)}
          </span>
          <button class="script-error-close" title="Dismiss">×</button>
        </div>
        <pre class="script-error-message">${z(t)}</pre>
      </div>
    `, this.wireClose(), this.autoHideTimer = setTimeout(() => this.hide(), $.AUTO_HIDE_MS);
  }
  /**
   * Hide the overlay.
   */
  hide() {
    this.clearAutoHide(), this.overlay && (this.overlay.remove(), this.overlay = null);
  }
  /**
   * Clean up resources.
   */
  dispose() {
    this.hide();
  }
  ensureOverlay() {
    this.overlay || (this.overlay = document.createElement("div"), this.overlay.className = "script-error-overlay", this.container.appendChild(this.overlay));
  }
  wireClose() {
    var t;
    const e = (t = this.overlay) == null ? void 0 : t.querySelector(".script-error-close");
    e && e.addEventListener("click", () => this.hide());
  }
  clearAutoHide() {
    this.autoHideTimer !== null && (clearTimeout(this.autoHideTimer), this.autoHideTimer = null);
  }
};
l($, "AUTO_HIDE_MS", 5e3);
let ne = $;
function z(i) {
  const e = document.createElement("div");
  return e.textContent = i, e.innerHTML;
}
const H = {};
for (let i = 0; i < 26; i++)
  H[`Key${String.fromCharCode(65 + i)}`] = 65 + i;
for (let i = 0; i < 10; i++)
  H[`Digit${i}`] = 48 + i;
for (let i = 1; i <= 12; i++)
  H[`F${i}`] = 111 + i;
Object.assign(H, {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  ShiftLeft: 16,
  ShiftRight: 16,
  ControlLeft: 17,
  ControlRight: 17,
  AltLeft: 18,
  AltRight: 18,
  Pause: 19,
  CapsLock: 20,
  Escape: 27,
  Space: 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Insert: 45,
  Delete: 46,
  NumLock: 144,
  ScrollLock: 145,
  Semicolon: 186,
  Equal: 187,
  Comma: 188,
  Minus: 189,
  Period: 190,
  Slash: 191,
  Backquote: 192,
  BracketLeft: 219,
  Backslash: 220,
  BracketRight: 221,
  Quote: 222
});
function ge(i) {
  const e = H[i.code];
  return e !== void 0 && e >= 0 && e < 256 ? e : null;
}
class ht {
  constructor(e, t, n) {
    l(this, "mouse", [0, 0, 0, 0]);
    l(this, "isMouseDown", !1);
    l(this, "touchState", {
      count: 0,
      touches: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      pinch: 1,
      pinchDelta: 0,
      pinchCenter: [0, 0]
    });
    /** Callback fired on first user gesture (for media init). */
    l(this, "onFirstGesture", null);
    l(this, "canvas");
    l(this, "pixelRatio");
    l(this, "activePointers", /* @__PURE__ */ new Map());
    l(this, "gestureTriggered", !1);
    l(this, "keyEvents", []);
    // Store bound handlers for cleanup
    l(this, "keydownHandler");
    l(this, "keyupHandler");
    l(this, "keyboardTarget");
    l(this, "canvasListeners", []);
    this.canvas = e, this.pixelRatio = t, this.keyboardTarget = n ?? document, this.setupMouseTracking(), this.setupTouchTracking(), this.keydownHandler = (s) => {
      const r = ge(s);
      r !== null && this.keyEvents.push({ keycode: r, down: !0 });
    }, this.keyupHandler = (s) => {
      const r = ge(s);
      r !== null && this.keyEvents.push({ keycode: r, down: !1 });
    }, this.keyboardTarget.addEventListener("keydown", this.keydownHandler), this.keyboardTarget.addEventListener("keyup", this.keyupHandler);
  }
  /**
   * Drain and return accumulated key events since last call.
   */
  getAndClearKeyEvents() {
    const e = this.keyEvents;
    return this.keyEvents = [], e;
  }
  /**
   * Clean up all event listeners.
   */
  dispose() {
    this.keyboardTarget.removeEventListener("keydown", this.keydownHandler), this.keyboardTarget.removeEventListener("keyup", this.keyupHandler);
    for (const { event: e, handler: t } of this.canvasListeners)
      this.canvas.removeEventListener(e, t);
    this.canvasListeners = [];
  }
  triggerGesture() {
    var e;
    this.gestureTriggered || (this.gestureTriggered = !0, (e = this.onFirstGesture) == null || e.call(this));
  }
  setupMouseTracking() {
    const e = (r) => {
      const a = this.canvas.getBoundingClientRect(), o = (r.clientX - a.left) * this.pixelRatio, c = (a.height - (r.clientY - a.top)) * this.pixelRatio;
      return [o, c];
    }, t = (r) => {
      const [a, o] = e(r);
      this.isMouseDown = !0, this.mouse[0] = a, this.mouse[1] = o, this.mouse[2] = a, this.mouse[3] = o, this.triggerGesture();
    }, n = (r) => {
      if (!this.isMouseDown) return;
      const [a, o] = e(r);
      this.mouse[0] = a, this.mouse[1] = o;
    }, s = () => {
      this.isMouseDown = !1, this.mouse[2] = -Math.abs(this.mouse[2]), this.mouse[3] = -Math.abs(this.mouse[3]);
    };
    this.canvas.addEventListener("mousedown", t), this.canvas.addEventListener("mousemove", n), this.canvas.addEventListener("mouseup", s), this.canvasListeners.push(
      { event: "mousedown", handler: t },
      { event: "mousemove", handler: n },
      { event: "mouseup", handler: s }
    );
  }
  setupTouchTracking() {
    this.canvas.style.touchAction = "pan-y";
    const e = (a, o) => {
      const c = this.canvas.getBoundingClientRect(), u = (a - c.left) * this.pixelRatio, d = (c.height - (o - c.top)) * this.pixelRatio;
      return [u, d];
    }, t = (a) => {
      if (a.pointerType === "mouse") return;
      const [o, c] = e(a.clientX, a.clientY);
      this.activePointers.set(a.pointerId, {
        id: a.pointerId,
        x: o,
        y: c,
        startX: o,
        startY: c
      }), this.canvas.setPointerCapture(a.pointerId), this.updateTouchState(), this.activePointers.size === 1 && (this.isMouseDown = !0, this.mouse[0] = o, this.mouse[1] = c, this.mouse[2] = o, this.mouse[3] = c);
    }, n = (a) => {
      if (a.pointerType === "mouse") return;
      const o = this.activePointers.get(a.pointerId);
      if (!o) return;
      const [c, u] = e(a.clientX, a.clientY);
      o.x = c, o.y = u, this.updateTouchState(), this.activePointers.size === 1 && (this.mouse[0] = c, this.mouse[1] = u), a.preventDefault();
    }, s = (a) => {
      a.pointerType !== "mouse" && (this.activePointers.delete(a.pointerId), this.canvas.releasePointerCapture(a.pointerId), this.activePointers.size === 0 && (this.isMouseDown = !1, this.mouse[2] = -Math.abs(this.mouse[2]), this.mouse[3] = -Math.abs(this.mouse[3])), this.updateTouchState());
    }, r = (a) => {
      s(a);
    };
    this.canvas.addEventListener("pointerdown", t), this.canvas.addEventListener("pointermove", n), this.canvas.addEventListener("pointerup", s), this.canvas.addEventListener("pointercancel", r), this.canvasListeners.push(
      { event: "pointerdown", handler: t },
      { event: "pointermove", handler: n },
      { event: "pointerup", handler: s },
      { event: "pointercancel", handler: r }
    );
  }
  updateTouchState() {
    const e = Array.from(this.activePointers.values()), t = e.length;
    this.touchState.count = t;
    for (let n = 0; n < 3; n++)
      if (n < e.length) {
        const s = e[n];
        this.touchState.touches[n] = [s.x, s.y, s.startX, s.startY];
      } else
        this.touchState.touches[n] = [0, 0, 0, 0];
    if (t >= 2) {
      const n = e[0], s = e[1], r = s.x - n.x, a = s.y - n.y, o = Math.sqrt(r * r + a * a), c = s.startX - n.startX, u = s.startY - n.startY, d = Math.sqrt(c * c + u * u);
      if (d > 0) {
        const h = o / d;
        this.touchState.pinchDelta = h - this.touchState.pinch, this.touchState.pinch = h;
      }
      this.touchState.pinchCenter = [
        (n.x + s.x) / 2,
        (n.y + s.y) / 2
      ];
    } else
      this.touchState.pinchDelta = 0, t === 0 && (this.touchState.pinch = 1, this.touchState.pinchCenter = [0, 0]);
  }
}
class Ee {
  constructor(e) {
    l(this, "container");
    l(this, "canvas");
    l(this, "gl");
    l(this, "errorOverlay");
    l(this, "runtimeErrorOverlay");
    l(this, "input");
    l(this, "_engine");
    l(this, "_project");
    l(this, "_pixelRatio");
    l(this, "_viewNames");
    l(this, "_resizeObserver");
    l(this, "_resizeDebounceTimer", null);
    // Context loss
    l(this, "_contextLostOverlay", null);
    l(this, "_isContextLost", !1);
    // Media
    l(this, "_mediaBanner", null);
    l(this, "_mediaInitialized", !1);
    // Script info overlays (one per corner position)
    l(this, "_overlays", /* @__PURE__ */ new Map());
    // Callbacks for App to hook into
    l(this, "onResize", null);
    l(this, "onContextRestored", null);
    this.container = e.container, this._project = e.project, this._pixelRatio = e.pixelRatio, this._viewNames = e.viewNames, this.canvas = document.createElement("canvas"), this.canvas.style.width = "100%", this.canvas.style.height = "100%", this.canvas.style.display = "block", this.container.appendChild(this.canvas), this.errorOverlay = new ct(this.container), this.runtimeErrorOverlay = new ne(this.container);
    const t = this.canvas.getContext("webgl2", {
      alpha: !1,
      antialias: !1,
      depth: !1,
      stencil: !1,
      preserveDrawingBuffer: !0,
      powerPreference: "high-performance"
    });
    if (!t)
      throw new Error("WebGL2 not supported");
    this.gl = t, this.setupContextLossHandling(), this.updateCanvasSize(), this._engine = new fe({
      gl: this.gl,
      project: e.project,
      viewNames: e.viewNames,
      onAssetError: (n) => {
        const s = n.type === "texture" ? `Texture '${n.name}' failed to load` : `Framebuffer '${n.name}' error`;
        this.runtimeErrorOverlay.showWarning(s, n.detail);
      }
    }), this._engine.hasErrors() && this.errorOverlay.show(this._engine.getCompilationErrors(), this._project), (this._engine.needsAudio || this._engine.needsWebcam) && this.showMediaBanner(), this._resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize(), this._resizeDebounceTimer !== null && clearTimeout(this._resizeDebounceTimer), this._resizeDebounceTimer = setTimeout(() => {
        var n;
        this._resizeDebounceTimer = null, this._engine.resize(this.canvas.width, this.canvas.height), this._engine.reset(), (n = this.onResize) == null || n.call(this, this.canvas.width, this.canvas.height);
      }, 150);
    }), this._resizeObserver.observe(this.container), this.input = new ht(this.canvas, this._pixelRatio, e.keyboardTarget), this.input.onFirstGesture = () => this.initMediaOnGesture(), this.initVideoFiles();
  }
  get engine() {
    return this._engine;
  }
  get isContextLost() {
    return this._isContextLost;
  }
  // ===========================================================================
  // Per-Frame Rendering
  // ===========================================================================
  /**
   * Step this view for one frame: forward input, run engine, blit to screen.
   */
  step(e, t) {
    if (!this._isContextLost) {
      for (const n of this.input.getAndClearKeyEvents())
        this._engine.updateKeyState(n.keycode, n.down);
      this._engine.updateKeyboardTexture(), this._engine.updateAudioTexture(), this._engine.updateVideoTextures(), this._engine.step(e, this.input.mouse, this.input.isMouseDown, {
        count: this.input.touchState.count,
        touches: this.input.touchState.touches,
        pinch: this.input.touchState.pinch,
        pinchDelta: this.input.touchState.pinchDelta,
        pinchCenter: this.input.touchState.pinchCenter
      }, t), this.input.touchState.pinchDelta = 0, this.presentToScreen();
    }
  }
  /**
   * Blit engine Image pass output to the canvas.
   */
  presentToScreen() {
    const e = this.gl;
    this._engine.bindImageForRead() && (e.bindFramebuffer(e.DRAW_FRAMEBUFFER, null), e.blitFramebuffer(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      e.COLOR_BUFFER_BIT,
      e.NEAREST
    ), this._engine.unbindImageForRead());
  }
  // ===========================================================================
  // Cross-View State Getters
  // ===========================================================================
  getMouseState() {
    return [...this.input.mouse];
  }
  getResolution() {
    return [this.canvas.width, this.canvas.height, 1];
  }
  getMousePressed() {
    return this.input.isMouseDown;
  }
  hasErrors() {
    return this._engine.hasErrors();
  }
  // ===========================================================================
  // Script Info Overlays
  // ===========================================================================
  setOverlay(e, t) {
    let n = this._overlays.get(e);
    if (t === null) {
      n && n.classList.add("hidden");
      return;
    }
    n || (n = document.createElement("div"), n.className = `script-overlay ${e}`, this.container.appendChild(n), this._overlays.set(e, n)), n.textContent = t, n.classList.remove("hidden");
  }
  // ===========================================================================
  // Lifecycle
  // ===========================================================================
  dispose() {
    this.input.dispose(), this._resizeObserver.disconnect(), this._resizeDebounceTimer !== null && clearTimeout(this._resizeDebounceTimer), this._engine.dispose(), this.errorOverlay.hide(), this.runtimeErrorOverlay.dispose(), this.hideMediaBanner(), this.hideContextLostOverlay();
    for (const e of this._overlays.values())
      e.remove();
    this._overlays.clear(), this.container.removeChild(this.canvas);
  }
  // ===========================================================================
  // Canvas Sizing
  // ===========================================================================
  updateCanvasSize() {
    const e = this.container.getBoundingClientRect(), t = Math.floor(e.width * this._pixelRatio), n = Math.floor(e.height * this._pixelRatio);
    (this.canvas.width !== t || this.canvas.height !== n) && (this.canvas.width = t, this.canvas.height = n);
  }
  // ===========================================================================
  // Context Loss Handling
  // ===========================================================================
  setupContextLossHandling() {
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault(), this.handleContextLost();
    }), this.canvas.addEventListener("webglcontextrestored", () => {
      this.handleContextRestored();
    });
  }
  handleContextLost() {
    this._isContextLost = !0, this.showContextLostOverlay(), console.warn("WebGL context lost. Waiting for restoration...");
  }
  handleContextRestored() {
    var e;
    console.log("WebGL context restored. Reinitializing...");
    try {
      this._engine.dispose(), this._engine = new fe({
        gl: this.gl,
        project: this._project,
        viewNames: this._viewNames,
        onAssetError: (t) => {
          const n = t.type === "texture" ? `Texture '${t.name}' failed to load` : `Framebuffer '${t.name}' error`;
          this.runtimeErrorOverlay.showWarning(n, t.detail);
        }
      }), this._engine.hasErrors() && this.errorOverlay.show(this._engine.getCompilationErrors(), this._project), this._engine.resize(this.canvas.width, this.canvas.height), this.hideContextLostOverlay(), this._isContextLost = !1, (e = this.onContextRestored) == null || e.call(this), console.log("WebGL context successfully restored");
    } catch (t) {
      console.error("Failed to restore WebGL context:", t), this.showContextLostOverlay(!0);
    }
  }
  showContextLostOverlay(e = !1) {
    this._contextLostOverlay || (this._contextLostOverlay = document.createElement("div"), this._contextLostOverlay.className = "context-lost-overlay", this.container.appendChild(this._contextLostOverlay)), e ? this._contextLostOverlay.innerHTML = `
        <div class="context-lost-content">
          <div class="context-lost-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="context-lost-title">WebGL Context Lost</div>
          <div class="context-lost-message">Unable to restore automatically.</div>
          <button class="context-lost-reload" onclick="location.reload()">Reload Page</button>
        </div>
      ` : this._contextLostOverlay.innerHTML = `
        <div class="context-lost-content">
          <div class="context-lost-spinner"></div>
          <div class="context-lost-title">WebGL Context Lost</div>
          <div class="context-lost-message">Attempting to restore...</div>
        </div>
      `;
  }
  hideContextLostOverlay() {
    this._contextLostOverlay && (this._contextLostOverlay.remove(), this._contextLostOverlay = null);
  }
  // ===========================================================================
  // Media Initialization
  // ===========================================================================
  initMediaOnGesture() {
    this._mediaInitialized || (this._mediaInitialized = !0, this.hideMediaBanner(), this._engine.needsAudio && this._engine.initAudio(), this._engine.needsWebcam && this._engine.initWebcam());
  }
  initVideoFiles() {
    for (const e of this._engine.videoSources)
      this._engine.initVideo(e);
  }
  showMediaBanner() {
    this._mediaBanner = document.createElement("div"), this._mediaBanner.className = "media-permission-banner";
    const e = [];
    this._engine.needsAudio && e.push("microphone"), this._engine.needsWebcam && e.push("webcam"), this._mediaBanner.innerHTML = `
      <span class="media-banner-text">This shader uses ${e.join(" and ")}</span>
      <button class="media-banner-button">Click to enable</button>
    `, this._mediaBanner.querySelector(".media-banner-button").addEventListener("click", () => {
      this.initMediaOnGesture();
    }), this.container.appendChild(this._mediaBanner);
  }
  hideMediaBanner() {
    this._mediaBanner && (this._mediaBanner.remove(), this._mediaBanner = null);
  }
}
class Fe {
  constructor(e) {
    l(this, "container");
    l(this, "uniforms");
    l(this, "onChange");
    l(this, "values", {});
    l(this, "updaters", /* @__PURE__ */ new Map());
    // Track document-level event listeners for cleanup
    l(this, "documentListeners", []);
    var t;
    this.container = e.container, this.uniforms = e.uniforms, this.onChange = e.onChange;
    for (const [n, s] of Object.entries(this.uniforms))
      L(s) || s.hidden || (this.values[n] = ((t = e.initialValues) == null ? void 0 : t[n]) ?? s.value);
    this.render();
  }
  /**
   * Render all uniform controls.
   */
  render() {
    this.container.innerHTML = "", this.container.className = "uniform-controls";
    const e = Object.entries(this.uniforms);
    if (e.length === 0) {
      const r = document.createElement("div");
      r.className = "uniform-controls-empty", r.textContent = "No uniforms defined", this.container.appendChild(r);
      return;
    }
    const t = document.createElement("div");
    t.className = "uniform-controls-header";
    const n = document.createElement("button");
    n.className = "uniform-controls-reset", n.textContent = "Reset", n.title = "Reset all uniforms to defaults", n.addEventListener("click", () => this.resetToDefaults()), t.appendChild(n), this.container.appendChild(t);
    const s = document.createElement("div");
    s.className = "uniform-controls-list";
    for (const [r, a] of e) {
      if (L(a) || a.hidden) continue;
      const o = this.createControl(r, a);
      o && (this.updaters.set(r, o.update), s.appendChild(o.element));
    }
    this.container.appendChild(s);
  }
  /**
   * Create a control element for a uniform.
   */
  createControl(e, t) {
    if (L(t) || t.hidden) return null;
    switch (t.type) {
      case "float":
        return this.createFloatSlider(e, t);
      case "int":
        return this.createIntSlider(e, t);
      case "bool":
        return this.createBoolToggle(e, t);
      case "vec2":
        return this.createVec2Pad(e, t);
      case "vec3":
        return t.color ? this.createColorPicker(e, t) : this.createVecSliders(e, t, 3);
      case "vec4":
        return t.color ? this.createColorPicker4(e, t) : this.createVecSliders(e, t, 4);
      default:
        return console.warn(`Uniform '${e}': unknown type '${t.type}'`), null;
    }
  }
  // ===========================================================================
  // Shared Slider Row Helper
  // ===========================================================================
  createSliderRow(e) {
    const t = document.createElement("div");
    t.className = "uniform-control-label-row";
    const n = document.createElement("label");
    n.className = "uniform-control-label", n.textContent = e.label;
    const s = document.createElement("span");
    s.className = "uniform-control-value", s.textContent = e.format(e.value), t.appendChild(n), t.appendChild(s);
    const r = document.createElement("input");
    r.type = "range", r.className = "uniform-control-slider", r.min = String(e.min), r.max = String(e.max), r.step = String(e.step), r.value = String(e.value), r.addEventListener("input", () => {
      const c = parseFloat(r.value);
      e.onInput(c), s.textContent = e.format(c);
    });
    const a = document.createElement("div");
    return a.appendChild(t), a.appendChild(r), { element: a, update: (c) => {
      r.value = String(c), s.textContent = e.format(c);
    } };
  }
  // ===========================================================================
  // Float Slider
  // ===========================================================================
  createFloatSlider(e, t) {
    const n = t.step ?? 0.01, { element: s, update: r } = this.createSliderRow({
      label: t.label ?? e,
      min: t.min ?? 0,
      max: t.max ?? 1,
      step: n,
      value: this.values[e],
      format: (o) => this.formatNumber(o, n),
      onInput: (o) => {
        this.values[e] = o, this.onChange(e, o);
      }
    }), a = document.createElement("div");
    return a.className = "uniform-control uniform-control-float", a.appendChild(s), {
      element: a,
      update: (o) => r(o)
    };
  }
  // ===========================================================================
  // Int Slider
  // ===========================================================================
  createIntSlider(e, t) {
    const { element: n, update: s } = this.createSliderRow({
      label: t.label ?? e,
      min: t.min ?? 0,
      max: t.max ?? 10,
      step: t.step ?? 1,
      value: this.values[e],
      format: (a) => String(Math.round(a)),
      onInput: (a) => {
        const o = Math.round(a);
        this.values[e] = o, this.onChange(e, o);
      }
    }), r = document.createElement("div");
    return r.className = "uniform-control uniform-control-int", r.appendChild(n), {
      element: r,
      update: (a) => s(a)
    };
  }
  // ===========================================================================
  // Bool Toggle
  // ===========================================================================
  createBoolToggle(e, t) {
    const n = this.values[e], s = t.label ?? e, r = document.createElement("div");
    r.className = "uniform-control uniform-control-bool";
    const a = document.createElement("div");
    a.className = "uniform-control-label-row";
    const o = document.createElement("label");
    o.className = "uniform-control-label", o.textContent = s;
    const c = document.createElement("label");
    c.className = "uniform-control-toggle";
    const u = document.createElement("input");
    u.type = "checkbox", u.checked = n;
    const d = document.createElement("span");
    return d.className = "uniform-control-toggle-slider", u.addEventListener("change", () => {
      const h = u.checked;
      this.values[e] = h, this.onChange(e, h);
    }), c.appendChild(u), c.appendChild(d), a.appendChild(o), a.appendChild(c), r.appendChild(a), {
      element: r,
      update: (h) => {
        u.checked = h;
      }
    };
  }
  // ===========================================================================
  // Vec2 XY Pad
  // ===========================================================================
  createVec2Pad(e, t) {
    const n = this.values[e], s = t.min ?? [0, 0], r = t.max ?? [1, 1], a = t.label ?? e, o = document.createElement("div");
    o.className = "uniform-control uniform-control-vec2";
    const c = document.createElement("div");
    c.className = "uniform-control-label-row";
    const u = document.createElement("label");
    u.className = "uniform-control-label", u.textContent = a;
    const d = document.createElement("span");
    d.className = "uniform-control-value", d.textContent = this.formatVec2(n), c.appendChild(u), c.appendChild(d);
    const h = document.createElement("div");
    h.className = "uniform-control-xy-pad";
    const T = document.createElement("div");
    T.className = "uniform-control-xy-handle", h.appendChild(T);
    const _ = (f) => {
      const E = (f[0] - s[0]) / (r[0] - s[0]) * 100, x = (1 - (f[1] - s[1]) / (r[1] - s[1])) * 100;
      T.style.left = `${E}%`, T.style.top = `${x}%`;
    };
    _(n);
    let y = !1;
    const b = (f) => {
      const E = h.getBoundingClientRect(), x = "touches" in f ? f.touches[0].clientX : f.clientX, S = "touches" in f ? f.touches[0].clientY : f.clientY;
      let v = Math.max(0, Math.min(1, (x - E.left) / E.width)), C = Math.max(0, Math.min(1, (S - E.top) / E.height));
      const A = s[0] + v * (r[0] - s[0]), F = s[1] + (1 - C) * (r[1] - s[1]), B = [A, F];
      this.values[e] = B, T.style.left = `${v * 100}%`, T.style.top = `${C * 100}%`, d.textContent = this.formatVec2(B), this.onChange(e, B);
    }, w = (f) => {
      y = !0, b(f), f.preventDefault();
    }, R = (f) => {
      y && b(f);
    }, p = () => {
      y = !1;
    };
    h.addEventListener("mousedown", w), document.addEventListener("mousemove", R), document.addEventListener("mouseup", p), this.documentListeners.push({ type: "mousemove", handler: R }), this.documentListeners.push({ type: "mouseup", handler: p });
    const m = (f) => {
      y = !0, b(f), f.preventDefault();
    }, g = (f) => {
      y && b(f);
    };
    return h.addEventListener("touchstart", m), document.addEventListener("touchmove", g), document.addEventListener("touchend", p), this.documentListeners.push({ type: "touchmove", handler: g }), this.documentListeners.push({ type: "touchend", handler: p }), o.appendChild(c), o.appendChild(h), {
      element: o,
      update: (f) => {
        const E = f;
        _(E), d.textContent = this.formatVec2(E);
      }
    };
  }
  // ===========================================================================
  // Vec3 Color Picker
  // ===========================================================================
  createColorPicker(e, t) {
    const n = this.values[e], s = t.label ?? e, r = document.createElement("div");
    r.className = "uniform-control uniform-control-color";
    const a = document.createElement("div");
    a.className = "uniform-control-label-row";
    const o = document.createElement("label");
    o.className = "uniform-control-label", o.textContent = s;
    const c = document.createElement("span");
    c.className = "uniform-control-value", c.textContent = this.rgbToHex(n), a.appendChild(o), a.appendChild(c);
    const u = document.createElement("div");
    u.className = "uniform-control-color-wrapper";
    const d = document.createElement("input");
    d.type = "color", d.className = "uniform-control-color-input", d.value = this.rgbToHex(n);
    const h = document.createElement("div");
    return h.className = "uniform-control-color-swatch", h.style.backgroundColor = this.rgbToHex(n), d.addEventListener("input", () => {
      const T = this.hexToRgb(d.value);
      this.values[e] = T, c.textContent = d.value, h.style.backgroundColor = d.value, this.onChange(e, T);
    }), h.addEventListener("click", () => d.click()), u.appendChild(h), u.appendChild(d), r.appendChild(a), r.appendChild(u), {
      element: r,
      update: (T) => {
        const _ = this.rgbToHex(T);
        d.value = _, h.style.backgroundColor = _, c.textContent = _;
      }
    };
  }
  // ===========================================================================
  // Vec4 Color Picker (with alpha)
  // ===========================================================================
  createColorPicker4(e, t) {
    var b, w, R;
    const n = this.values[e], s = t.label ?? e, r = document.createElement("div");
    r.className = "uniform-control uniform-control-color";
    const a = document.createElement("div");
    a.className = "uniform-control-label-row";
    const o = document.createElement("label");
    o.className = "uniform-control-label", o.textContent = s;
    const c = document.createElement("span");
    c.className = "uniform-control-value", c.textContent = this.rgbToHex(n), a.appendChild(o), a.appendChild(c);
    const u = document.createElement("div");
    u.className = "uniform-control-color-wrapper";
    const d = document.createElement("input");
    d.type = "color", d.className = "uniform-control-color-input", d.value = this.rgbToHex(n);
    const h = document.createElement("div");
    h.className = "uniform-control-color-swatch", h.style.backgroundColor = this.rgbToHex(n), d.addEventListener("input", () => {
      const p = this.hexToRgb(d.value), m = this.values[e];
      m[0] = p[0], m[1] = p[1], m[2] = p[2], c.textContent = d.value, h.style.backgroundColor = d.value, this.onChange(e, [...m]);
    }), h.addEventListener("click", () => d.click()), u.appendChild(h), u.appendChild(d);
    const T = ((b = t.step) == null ? void 0 : b[3]) ?? 0.01, { element: _, update: y } = this.createSliderRow({
      label: "Alpha",
      min: ((w = t.min) == null ? void 0 : w[3]) ?? 0,
      max: ((R = t.max) == null ? void 0 : R[3]) ?? 1,
      step: T,
      value: n[3],
      format: (p) => this.formatNumber(p, T),
      onInput: (p) => {
        const m = this.values[e];
        m[3] = p, this.onChange(e, [...m]);
      }
    });
    return r.appendChild(a), r.appendChild(u), r.appendChild(_), {
      element: r,
      update: (p) => {
        const m = p, g = this.rgbToHex(m);
        d.value = g, h.style.backgroundColor = g, c.textContent = g, y(m[3]);
      }
    };
  }
  // ===========================================================================
  // Vec3/Vec4 Component Sliders
  // ===========================================================================
  createVecSliders(e, t, n) {
    const s = this.values[e], r = t.label ?? e, a = n === 3 ? ["X", "Y", "Z"] : ["X", "Y", "Z", "W"], o = document.createElement("div");
    o.className = `uniform-control uniform-control-vec${n}`;
    const c = document.createElement("div");
    c.className = "uniform-control-label", c.textContent = r, o.appendChild(c);
    const u = [];
    return a.forEach((d, h) => {
      var R, p, m;
      const T = ((R = t.step) == null ? void 0 : R[h]) ?? 0.01, { element: _, update: y } = this.createSliderRow({
        label: d,
        min: ((p = t.min) == null ? void 0 : p[h]) ?? 0,
        max: ((m = t.max) == null ? void 0 : m[h]) ?? 1,
        step: T,
        value: s[h],
        format: (g) => this.formatNumber(g, T),
        onInput: (g) => {
          const f = this.values[e];
          f[h] = g, this.onChange(e, [...f]);
        }
      }), b = _.querySelector(".uniform-control-label-row");
      if (b) {
        b.classList.add("uniform-control-vec-slider-row");
        const g = b.querySelector(".uniform-control-label");
        g && g.classList.add("uniform-control-vec-component");
        const f = b.querySelector(".uniform-control-value");
        f && f.classList.add("uniform-control-vec-value");
      }
      const w = _.querySelector(".uniform-control-slider");
      w && w.classList.add("uniform-control-vec-slider"), u.push(y), o.appendChild(_);
    }), {
      element: o,
      update: (d) => {
        const h = d;
        u.forEach((T, _) => T(h[_]));
      }
    };
  }
  // ===========================================================================
  // Utility Methods
  // ===========================================================================
  formatNumber(e, t) {
    const n = String(t), s = n.indexOf("."), r = s === -1 ? 0 : n.length - s - 1;
    return e.toFixed(r);
  }
  formatVec2(e) {
    return `(${e[0].toFixed(2)}, ${e[1].toFixed(2)})`;
  }
  rgbToHex(e) {
    const t = Math.round(e[0] * 255), n = Math.round(e[1] * 255), s = Math.round(e[2] * 255);
    return `#${t.toString(16).padStart(2, "0")}${n.toString(16).padStart(2, "0")}${s.toString(16).padStart(2, "0")}`;
  }
  hexToRgb(e) {
    const t = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return t ? [
      parseInt(t[1], 16) / 255,
      parseInt(t[2], 16) / 255,
      parseInt(t[3], 16) / 255
    ] : [0, 0, 0];
  }
  // ===========================================================================
  // Public Methods
  // ===========================================================================
  /**
   * Update a uniform value externally (e.g., from reset).
   */
  setValue(e, t) {
    var n;
    e in this.uniforms && (this.values[e] = t, (n = this.updaters.get(e)) == null || n(t));
  }
  /**
   * Reset all uniforms to their default values.
   */
  resetToDefaults() {
    for (const [e, t] of Object.entries(this.uniforms))
      L(t) || t.hidden || (this.setValue(e, t.value), this.onChange(e, t.value));
  }
  /**
   * Destroy the controls and clean up.
   */
  destroy() {
    for (const { type: e, handler: t } of this.documentListeners)
      document.removeEventListener(e, t);
    this.documentListeners = [], this.container.innerHTML = "", this.updaters.clear();
  }
}
class mt {
  constructor(e) {
    l(this, "wrapper");
    l(this, "panel");
    l(this, "toggleButton");
    l(this, "controls", null);
    l(this, "isOpen");
    if (this.isOpen = e.startOpen ?? !1, this.wrapper = document.createElement("div"), this.wrapper.className = "uniforms-panel-wrapper", this.toggleButton = document.createElement("button"), this.toggleButton.className = "uniforms-toggle-button", this.toggleButton.title = "Toggle Uniforms Panel", this.toggleButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
      </svg>
    `, this.toggleButton.addEventListener("click", () => this.toggle()), this.wrapper.appendChild(this.toggleButton), this.panel = document.createElement("div"), this.panel.className = "uniforms-panel", !Object.values(e.uniforms).some((o) => se(o))) {
      this.wrapper.style.display = "none", e.container.appendChild(this.wrapper);
      return;
    }
    const n = document.createElement("div");
    n.className = "uniforms-panel-header";
    const s = document.createElement("span");
    s.textContent = "Uniforms", n.appendChild(s);
    const r = document.createElement("button");
    r.className = "uniforms-panel-close", r.innerHTML = "&times;", r.title = "Close", r.addEventListener("click", () => this.hide()), n.appendChild(r), this.panel.appendChild(n);
    const a = document.createElement("div");
    a.className = "uniforms-panel-content", this.panel.appendChild(a), this.controls = new Fe({
      container: a,
      uniforms: e.uniforms,
      initialValues: e.initialValues,
      onChange: e.onChange
    }), this.wrapper.appendChild(this.panel), this.isOpen || this.panel.classList.add("closed"), e.container.appendChild(this.wrapper);
  }
  /**
   * Update a uniform value from external source.
   */
  setValue(e, t) {
    var n;
    (n = this.controls) == null || n.setValue(e, t);
  }
  /**
   * Show the panel.
   */
  show() {
    this.isOpen = !0, this.toggleButton.classList.add("hidden"), this.panel.classList.remove("closed");
  }
  /**
   * Hide the panel.
   */
  hide() {
    this.isOpen = !1, this.panel.classList.add("closed"), this.toggleButton.classList.remove("hidden");
  }
  /**
   * Toggle panel visibility.
   */
  toggle() {
    this.isOpen ? this.hide() : this.show();
  }
  /**
   * Check if panel is visible.
   */
  isVisible() {
    return this.isOpen;
  }
  /**
   * Destroy the panel.
   */
  destroy() {
    var e;
    (e = this.controls) == null || e.destroy(), this.wrapper.remove();
  }
}
const te = (i) => i.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
function pt(i, e) {
  const t = ft(i, e), n = new Blob([t], { type: "text/html" }), r = `${i.root.split("/").pop() || "shader"}.html`, a = URL.createObjectURL(n), o = document.createElement("a");
  o.href = a, o.download = r, o.click(), URL.revokeObjectURL(a), console.log(`Exported: ${r}`);
}
function ft(i, e) {
  var f, E, x, S;
  const t = i.meta.title, n = i.commonSource ?? "", s = e.getUniformValues(), r = e.getUBOExportData(), a = ["BufferA", "BufferB", "BufferC", "BufferD", "Image"], o = [];
  let c = !1, u = !1;
  for (const v of a) {
    const C = i.passes[v];
    if (!C) continue;
    const A = C.channels.map((F) => F.kind === "buffer" ? `buffer:${F.buffer}` : F.kind === "texture" ? "procedural" : F.kind === "keyboard" ? (c = !0, "keyboard") : F.kind === "script" ? (u = !0, `script:${F.name}`) : F.kind === "audio" || F.kind === "webcam" || F.kind === "video" ? "black" : "none");
    o.push({
      name: v,
      source: C.glslSource,
      channels: C.channels,
      channelTypes: A
    });
  }
  const d = !!((f = i.script) != null && f.setup || (E = i.script) != null && E.onFrame), h = Object.entries(i.uniforms).filter(([, v]) => !L(v)), T = [];
  for (const [v, C] of h) {
    if (L(C)) continue;
    const A = s[v] ?? C.value;
    if (C.type === "float" || C.type === "int")
      T.push(`  '${v}': ${A}`);
    else if (C.type === "bool")
      T.push(`  '${v}': ${A ? 1 : 0}`);
    else if (C.type === "vec2") {
      const F = A;
      T.push(`  '${v}': [${F[0]}, ${F[1]}]`);
    } else if (C.type === "vec3") {
      const F = A;
      T.push(`  '${v}': [${F[0]}, ${F[1]}, ${F[2]}]`);
    } else if (C.type === "vec4") {
      const F = A;
      T.push(`  '${v}': [${F[0]}, ${F[1]}, ${F[2]}, ${F[3]}]`);
    }
  }
  const _ = h.map(([v, C]) => `uniform ${C.type === "bool" ? "bool" : C.type} ${v};`).join(`
`), y = r.map(
    (v) => `// Array uniform: ${v.name} (max ${v.count})
layout(std140) uniform _ub_${v.name} {
  ${v.type} ${v.name}[${v.count}];
};
uniform int ${v.name}_count;`
  ).join(`

`), b = r.map((v) => {
    const C = Array.from(v.paddedData).map((A) => A.toFixed(6)).join(", ");
    return `  { name: '${v.name}', type: '${v.type}', count: ${v.count}, binding: ${v.bindingPoint}, data: new Float32Array([${C}]) }`;
  }).join(`,
`);
  let w = "", R = "";
  d && ((x = i.script) != null && x.setup && (w = i.script.setup.toString()), (S = i.script) != null && S.onFrame && (R = i.script.onFrame.toString()));
  const p = c ? `
// --- Keyboard helpers ---
const int KEY_A = 65; const int KEY_B = 66; const int KEY_C = 67; const int KEY_D = 68;
const int KEY_E = 69; const int KEY_F = 70; const int KEY_G = 71; const int KEY_H = 72;
const int KEY_I = 73; const int KEY_J = 74; const int KEY_K = 75; const int KEY_L = 76;
const int KEY_M = 77; const int KEY_N = 78; const int KEY_O = 79; const int KEY_P = 80;
const int KEY_Q = 81; const int KEY_R = 82; const int KEY_S = 83; const int KEY_T = 84;
const int KEY_U = 85; const int KEY_V = 86; const int KEY_W = 87; const int KEY_X = 88;
const int KEY_Y = 89; const int KEY_Z = 90;
const int KEY_0 = 48; const int KEY_1 = 49; const int KEY_2 = 50; const int KEY_3 = 51;
const int KEY_4 = 52; const int KEY_5 = 53; const int KEY_6 = 54; const int KEY_7 = 55;
const int KEY_8 = 56; const int KEY_9 = 57;
const int KEY_LEFT = 37; const int KEY_UP = 38; const int KEY_RIGHT = 39; const int KEY_DOWN = 40;
const int KEY_SPACE = 32; const int KEY_ENTER = 13; const int KEY_TAB = 9; const int KEY_ESC = 27;
const int KEY_BACKSPACE = 8; const int KEY_DELETE = 46; const int KEY_SHIFT = 16;
const int KEY_CTRL = 17; const int KEY_ALT = 18;
const int KEY_F1 = 112; const int KEY_F2 = 113; const int KEY_F3 = 114; const int KEY_F4 = 115;
const int KEY_F5 = 116; const int KEY_F6 = 117; const int KEY_F7 = 118; const int KEY_F8 = 119;
const int KEY_F9 = 120; const int KEY_F10 = 121; const int KEY_F11 = 122; const int KEY_F12 = 123;
float keyDown(int key) { return textureLod(iChannel0, vec2((float(key) + 0.5) / 256.0, 0.25), 0.0).x; }
float keyToggle(int key) { return textureLod(iChannel0, vec2((float(key) + 0.5) / 256.0, 0.75), 0.0).x; }
bool isKeyDown(int key) { return keyDown(key) > 0.5; }
bool isKeyToggled(int key) { return keyToggle(key) > 0.5; }
` : "", m = o.map((v) => `  { name: '${v.name}', source: \`${te(v.source)}\`, channels: ${JSON.stringify(v.channelTypes)} }`).join(`,
`), g = `#version 300 es
precision highp float;

const float ST_PI = 3.14159265359;
const float ST_TWOPI = 6.28318530718;
vec2 _st_dirToEquirect(vec3 dir) {
  float phi = atan(dir.z, dir.x);
  float theta = asin(dir.y);
  return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);
}

uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform bool  iMousePressed;
uniform vec4  iDate;
uniform float iFrameRate;
uniform vec3  iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

${y}
${_}
${p}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #fff; }
    body { display: flex; align-items: center; justify-content: center; }
    .container {
      width: 90vw;
      max-width: 1200px;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1);
    }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <canvas id="canvas"></canvas>
  </div>
  <script>
// Shader Sandbox Export - ${t}
// Generated ${(/* @__PURE__ */ new Date()).toISOString()}

// ── Constants ──

const VERTEX_SHADER = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
\`;

const FRAGMENT_PREAMBLE = \`${te(g)}\`;

const FRAGMENT_SUFFIX = \`
out vec4 fragColor;
void main() { mainImage(fragColor, gl_FragCoord.xy); }
\`;

const COMMON_SOURCE = \`${te(n)}\`;

const PASSES = [
${m}
];

const UNIFORM_VALUES = {
${T.join(`,
`)}
};

const UBO_DATA = [
${b}
];

// ── WebGL Setup ──

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
if (!gl) { alert('WebGL2 not supported'); throw new Error('WebGL2 not supported'); }

const floatExt = gl.getExtension('EXT_color_buffer_float');
if (!floatExt) console.warn('EXT_color_buffer_float not supported');

// Fullscreen triangle
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

// ── Helper Textures ──

function createProceduralTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const data = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 4;
      const c = (x + y) % 2;
      data[i] = c ? 204 : 51; data[i+1] = c ? 26 : 51;
      data[i+2] = c ? 204 : 51; data[i+3] = 255;
    }
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

function createBlackTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

const proceduralTex = createProceduralTexture();
const blackTex = createBlackTexture();
${c ? `
// ── Keyboard Texture (256x3) ──
// Row 0: current key state, Row 1: key down events, Row 2: toggle state
const keyboardTex = gl.createTexture();
const keyboardData = new Uint8Array(256 * 3);
gl.bindTexture(gl.TEXTURE_2D, keyboardTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, 3, 0, gl.RED, gl.UNSIGNED_BYTE, keyboardData);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const keyStates = new Uint8Array(256);     // row 0: held
const keyDown_ev = new Uint8Array(256);    // row 1: down this frame
const keyToggle_st = new Uint8Array(256);  // row 2: toggle

document.addEventListener('keydown', e => {
  const k = e.keyCode;
  if (k < 256) {
    if (!keyStates[k]) {
      keyDown_ev[k] = 255;
      keyToggle_st[k] = keyToggle_st[k] ? 0 : 255;
    }
    keyStates[k] = 255;
  }
});
document.addEventListener('keyup', e => {
  const k = e.keyCode;
  if (k < 256) keyStates[k] = 0;
});

function updateKeyboardTexture() {
  keyboardData.set(keyStates, 0);
  keyboardData.set(keyDown_ev, 256);
  keyboardData.set(keyToggle_st, 512);
  gl.bindTexture(gl.TEXTURE_2D, keyboardTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 3, gl.RED, gl.UNSIGNED_BYTE, keyboardData);
  keyDown_ev.fill(0);
}
` : ""}
${u || d ? `
// ── Script Textures ──
const scriptTextures = new Map();

function updateScriptTexture(name, w, h, data) {
  const existing = scriptTextures.get(name);
  const isFloat = data instanceof Float32Array;
  const internalFormat = isFloat ? gl.RGBA32F : gl.RGBA;
  const type = isFloat ? gl.FLOAT : gl.UNSIGNED_BYTE;
  if (existing && existing.width === w && existing.height === h) {
    gl.bindTexture(gl.TEXTURE_2D, existing.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, type, data);
  } else {
    const tex = existing ? existing.texture : gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    scriptTextures.set(name, { texture: tex, width: w, height: h });
  }
}
` : ""}
// ── Shader Compilation ──

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    console.error(source.split('\\n').map((l,i) => (i+1) + ': ' + l).join('\\n'));
    throw new Error('Shader compile failed');
  }
  return shader;
}

function createProgram(fragSource) {
  const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

function createRenderTexture(w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createFramebuffer(tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fb;
}

// ── Initialize Passes ──

const container = canvas.parentElement;
let width = canvas.width = container.clientWidth * devicePixelRatio;
let height = canvas.height = container.clientHeight * devicePixelRatio;

const runtimePasses = PASSES.map(pass => {
  const fragSource = FRAGMENT_PREAMBLE +
    (COMMON_SOURCE ? '\\n// Common\\n' + COMMON_SOURCE + '\\n' : '') +
    '\\n// User code\\n' + pass.source + FRAGMENT_SUFFIX;
  const program = createProgram(fragSource);
  const currentTexture = createRenderTexture(width, height);
  const previousTexture = createRenderTexture(width, height);
  const framebuffer = createFramebuffer(currentTexture);

  // Cache uniform locations
  const uniforms = {
    iResolution: gl.getUniformLocation(program, 'iResolution'),
    iTime: gl.getUniformLocation(program, 'iTime'),
    iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
    iFrame: gl.getUniformLocation(program, 'iFrame'),
    iMouse: gl.getUniformLocation(program, 'iMouse'),
    iMousePressed: gl.getUniformLocation(program, 'iMousePressed'),
    iDate: gl.getUniformLocation(program, 'iDate'),
    iFrameRate: gl.getUniformLocation(program, 'iFrameRate'),
    iChannel: [0,1,2,3].map(i => gl.getUniformLocation(program, 'iChannel' + i)),
    iChannelResolution: gl.getUniformLocation(program, 'iChannelResolution'),
    custom: {},
    uboCountLocs: {},
  };

  // Scalar uniform locations
  for (const name of Object.keys(UNIFORM_VALUES)) {
    uniforms.custom[name] = gl.getUniformLocation(program, name);
  }

  // UBO block bindings and count locations
  for (const ubo of UBO_DATA) {
    const blockIndex = gl.getUniformBlockIndex(program, '_ub_' + ubo.name);
    if (blockIndex !== gl.INVALID_INDEX) {
      gl.uniformBlockBinding(program, blockIndex, ubo.binding);
    }
    uniforms.uboCountLocs[ubo.name] = gl.getUniformLocation(program, ubo.name + '_count');
  }

  return { name: pass.name, channels: pass.channels, program, framebuffer, currentTexture, previousTexture, uniforms };
});

// ── UBO Buffers ──

const uboBuffers = UBO_DATA.map(ubo => {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
  gl.bufferData(gl.UNIFORM_BUFFER, ubo.data, gl.DYNAMIC_DRAW);
  gl.bindBufferBase(gl.UNIFORM_BUFFER, ubo.binding, buffer);
  return { name: ubo.name, buffer, count: ubo.count, data: ubo.data };
});

const findPass = name => runtimePasses.find(p => p.name === name);
${d ? `
// ── Script Setup ──

const scriptSetup = ${w || "null"};
const scriptOnFrame = ${R || "null"};

const scriptEngine = {
  setUniformValue(name, value) {
    // Check if this is an array uniform (Float32Array)
    if (value instanceof Float32Array) {
      const ubo = uboBuffers.find(u => u.name === name);
      if (ubo) {
        // Pack to std140: user provides tight data, we need to pad
        // For simplicity, copy directly (assume already padded or vec4/mat4)
        const len = Math.min(value.length, ubo.data.length);
        ubo.data.set(value.subarray(0, len));
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo.buffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, ubo.data);
      }
    } else {
      UNIFORM_VALUES[name] = value;
    }
  },
  getUniformValue(name) {
    return UNIFORM_VALUES[name];
  },
  updateTexture(name, w, h, data) {
    updateScriptTexture(name, w, h, data);
  },
  readPixels(passName, x, y, w, h) {
    const pass = findPass(passName);
    if (!pass) return new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.previousTexture, 0);
    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
    return pixels;
  },
  get width() { return width; },
  get height() { return height; },
  setOverlay() {},
};

try {
  if (scriptSetup) scriptSetup(scriptEngine);
} catch(e) { console.error('script setup error:', e); }
` : ""}
// ── Mouse ──

let mouse = [0, 0, 0, 0];
let mouseDown = false;
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width * width;
  const y = (1 - (e.clientY - rect.top) / rect.height) * height;
  mouse[0] = x; mouse[1] = y;
  mouse[2] = x; mouse[3] = y;
});
canvas.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  const rect = canvas.getBoundingClientRect();
  mouse[0] = (e.clientX - rect.left) / rect.width * width;
  mouse[1] = (1 - (e.clientY - rect.top) / rect.height) * height;
});
canvas.addEventListener('mouseup', () => {
  mouseDown = false;
  mouse[2] = -Math.abs(mouse[2]);
  mouse[3] = -Math.abs(mouse[3]);
});

// ── Resize ──

let resizeTimer = null;
new ResizeObserver(() => {
  const newW = container.clientWidth * devicePixelRatio;
  const newH = container.clientHeight * devicePixelRatio;
  canvas.width = newW;
  canvas.height = newH;
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    width = newW;
    height = newH;
    runtimePasses.forEach(p => {
      [p.currentTexture, p.previousTexture].forEach(tex => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, p.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, p.currentTexture, 0);
    });
    frame = 0;
    startTime = performance.now() / 1000;
    lastTime = 0;
  }, 150);
}).observe(container);

// ── Animation Loop ──

let frame = 0;
let startTime = performance.now() / 1000;
let lastTime = 0;

function render(now) {
  requestAnimationFrame(render);

  const time = now / 1000 - startTime;
  const deltaTime = Math.max(0.001, time - lastTime);
  lastTime = time;

  const date = new Date();
  const iDate = [date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000];
${c ? `
  updateKeyboardTexture();` : ""}
${d ? `
  // Run script onFrame
  try {
    if (scriptOnFrame) scriptOnFrame(scriptEngine, time, deltaTime, frame);
  } catch(e) { console.error('script onFrame error:', e); }
` : ""}
  gl.bindVertexArray(vao);

  runtimePasses.forEach(pass => {
    gl.useProgram(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.viewport(0, 0, width, height);

    // Built-in uniforms
    gl.uniform3f(pass.uniforms.iResolution, width, height, 1);
    gl.uniform1f(pass.uniforms.iTime, time);
    gl.uniform1f(pass.uniforms.iTimeDelta, deltaTime);
    gl.uniform1i(pass.uniforms.iFrame, frame);
    gl.uniform4fv(pass.uniforms.iMouse, mouse);
    gl.uniform1i(pass.uniforms.iMousePressed, mouseDown ? 1 : 0);
    gl.uniform4fv(pass.uniforms.iDate, iDate);
    gl.uniform1f(pass.uniforms.iFrameRate, 1 / deltaTime);

    // Scalar custom uniforms
    for (const [name, value] of Object.entries(UNIFORM_VALUES)) {
      const loc = pass.uniforms.custom[name];
      if (!loc) continue;
      if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(loc, value);
        else if (value.length === 3) gl.uniform3fv(loc, value);
        else if (value.length === 4) gl.uniform4fv(loc, value);
      } else if (typeof value === 'number') {
        gl.uniform1f(loc, value);
      }
    }

    // UBO count uniforms
    for (const ubo of UBO_DATA) {
      const countLoc = pass.uniforms.uboCountLocs[ubo.name];
      if (countLoc) gl.uniform1i(countLoc, ubo.count);
    }

    // Bind channels
    const channelRes = new Float32Array(12); // iChannelResolution[4] × vec3
    pass.channels.forEach((ch, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      if (ch === 'none') {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      } else if (ch === 'procedural') {
        gl.bindTexture(gl.TEXTURE_2D, proceduralTex);
        channelRes[i*3] = 8; channelRes[i*3+1] = 8; channelRes[i*3+2] = 1;
      } else if (ch === 'keyboard') {
        gl.bindTexture(gl.TEXTURE_2D, ${c ? "keyboardTex" : "blackTex"});
        channelRes[i*3] = 256; channelRes[i*3+1] = 3; channelRes[i*3+2] = 1;
      } else if (ch === 'black') {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      } else if (ch.startsWith('buffer:')) {
        const srcPass = findPass(ch.slice(7));
        gl.bindTexture(gl.TEXTURE_2D, srcPass ? srcPass.previousTexture : blackTex);
        channelRes[i*3] = width; channelRes[i*3+1] = height; channelRes[i*3+2] = 1;
      } else if (ch.startsWith('script:')) {
        const stex = scriptTextures?.get(ch.slice(7));
        gl.bindTexture(gl.TEXTURE_2D, stex ? stex.texture : blackTex);
        if (stex) { channelRes[i*3] = stex.width; channelRes[i*3+1] = stex.height; channelRes[i*3+2] = 1; }
      } else {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      }
      gl.uniform1i(pass.uniforms.iChannel[i], i);
    });

    if (pass.uniforms.iChannelResolution) {
      gl.uniform3fv(pass.uniforms.iChannelResolution, channelRes);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Swap textures
    const temp = pass.currentTexture;
    pass.currentTexture = pass.previousTexture;
    pass.previousTexture = temp;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
  });

  // Blit Image pass to screen
  const imagePass = findPass('Image');
  if (imagePass) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.previousTexture, 0);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.currentTexture, 0);
  }

  frame++;
}

requestAnimationFrame(render);
  <\/script>
</body>
</html>`;
}
class gt {
  constructor(e, t, n) {
    l(this, "isRecording", !1);
    l(this, "canvas");
    l(this, "container");
    l(this, "projectRoot");
    l(this, "mediaRecorder", null);
    l(this, "recordedChunks", []);
    l(this, "recordingIndicator", null);
    this.canvas = e, this.container = t, this.projectRoot = n;
  }
  /**
   * Toggle recording on/off.
   * If paused, calls unpause callback before starting.
   */
  toggle(e, t) {
    this.isRecording ? this.stop() : this.start(e, t);
  }
  /**
   * Start recording the canvas as WebM video.
   */
  start(e, t) {
    if (!MediaRecorder.isTypeSupported("video/webm")) {
      console.error("WebM recording not supported in this browser");
      return;
    }
    e && t();
    const n = this.canvas.captureStream(60);
    this.mediaRecorder = new MediaRecorder(n, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8e6
      // 8 Mbps for high quality
    }), this.recordedChunks = [], this.mediaRecorder.ondataavailable = (s) => {
      s.data.size > 0 && this.recordedChunks.push(s.data);
    }, this.mediaRecorder.onstop = () => {
      const s = new Blob(this.recordedChunks, { type: "video/webm" }), r = this.projectRoot.split("/").pop() || "shader", a = /* @__PURE__ */ new Date(), o = a.getFullYear().toString() + (a.getMonth() + 1).toString().padStart(2, "0") + a.getDate().toString().padStart(2, "0") + "-" + a.getHours().toString().padStart(2, "0") + a.getMinutes().toString().padStart(2, "0") + a.getSeconds().toString().padStart(2, "0"), c = `shadertoy-${r}-${o}.webm`, u = URL.createObjectURL(s), d = document.createElement("a");
      d.href = u, d.download = c, d.click(), URL.revokeObjectURL(u), console.log(`Recording saved: ${c}`);
    }, this.mediaRecorder.start(), this.isRecording = !0, this.showRecordingIndicator(), console.log("Recording started");
  }
  /**
   * Stop recording and trigger download.
   */
  stop() {
    this.mediaRecorder && this.mediaRecorder.state !== "inactive" && this.mediaRecorder.stop(), this.isRecording = !1, this.mediaRecorder = null, this.hideRecordingIndicator(), console.log("Recording stopped");
  }
  /**
   * Clean up resources.
   */
  dispose() {
    this.isRecording && this.stop(), this.hideRecordingIndicator();
  }
  /**
   * Show the recording indicator (pulsing red dot in corner).
   */
  showRecordingIndicator() {
    this.recordingIndicator || (this.recordingIndicator = document.createElement("div"), this.recordingIndicator.className = "recording-indicator", this.recordingIndicator.innerHTML = `
      <span class="recording-dot"></span>
      <span class="recording-text">REC</span>
    `, this.container.appendChild(this.recordingIndicator));
  }
  /**
   * Hide the recording indicator.
   */
  hideRecordingIndicator() {
    this.recordingIndicator && (this.recordingIndicator.remove(), this.recordingIndicator = null);
  }
}
class Et {
  constructor(e) {
    l(this, "container");
    l(this, "statsContainer");
    l(this, "statsGrid");
    l(this, "fpsDisplay");
    l(this, "timeDisplay");
    l(this, "frameDisplay");
    l(this, "resolutionDisplay");
    l(this, "frameCount", 0);
    l(this, "totalFrameCount", 0);
    l(this, "lastFpsUpdate", 0);
    l(this, "currentFps", 0);
    l(this, "isStatsOpen", !1);
    this.container = e, this.statsContainer = document.createElement("div"), this.statsContainer.className = "stats-container", this.fpsDisplay = document.createElement("button"), this.fpsDisplay.className = "fps-counter", this.fpsDisplay.textContent = "0 FPS", this.fpsDisplay.title = "Click to show stats", this.fpsDisplay.addEventListener("click", () => this.toggle()), this.statsGrid = document.createElement("div"), this.statsGrid.className = "stats-grid", this.timeDisplay = document.createElement("div"), this.timeDisplay.className = "stat-item", this.timeDisplay.innerHTML = '<span class="stat-value">0:00</span><span class="stat-label">time</span>', this.statsGrid.appendChild(this.timeDisplay), this.frameDisplay = document.createElement("div"), this.frameDisplay.className = "stat-item", this.frameDisplay.innerHTML = '<span class="stat-value">0</span><span class="stat-label">frame</span>', this.statsGrid.appendChild(this.frameDisplay), this.resolutionDisplay = document.createElement("div"), this.resolutionDisplay.className = "stat-item", this.resolutionDisplay.innerHTML = '<span class="stat-value">0×0</span><span class="stat-label">res</span>', this.statsGrid.appendChild(this.resolutionDisplay), this.statsContainer.appendChild(this.statsGrid), this.statsContainer.appendChild(this.fpsDisplay), this.container.appendChild(this.statsContainer);
  }
  /**
   * Update FPS counter and stats. Call once per frame.
   */
  update(e, t) {
    this.frameCount++, this.totalFrameCount++, this.isStatsOpen && this.updateFrameDisplay(), e - this.lastFpsUpdate >= 1 && (this.currentFps = this.frameCount / (e - this.lastFpsUpdate), this.fpsDisplay.textContent = `${Math.round(this.currentFps)} FPS`, this.frameCount = 0, this.lastFpsUpdate = e, this.isStatsOpen && (this.updateTimeDisplay(t), this.updateResolutionDisplay()));
  }
  /**
   * Reset all counters.
   */
  reset() {
    this.frameCount = 0, this.totalFrameCount = 0, this.lastFpsUpdate = 0, this.isStatsOpen && (this.updateTimeDisplay(0), this.updateFrameDisplay(), this.updateResolutionDisplay());
  }
  /**
   * Update resolution display with current canvas dimensions.
   */
  updateResolution(e, t) {
    this.resolutionDisplay.querySelector(".stat-value").textContent = `${e}×${t}`;
  }
  /**
   * Clean up DOM.
   */
  dispose() {
    this.statsContainer.remove();
  }
  toggle() {
    this.isStatsOpen = !this.isStatsOpen, this.statsGrid.classList.toggle("open", this.isStatsOpen), this.statsContainer.classList.toggle("open", this.isStatsOpen), this.isStatsOpen && (this.updateFrameDisplay(), this.updateResolutionDisplay());
  }
  updateFrameDisplay() {
    let e;
    this.totalFrameCount >= 1e6 ? e = (this.totalFrameCount / 1e6).toFixed(1) + "M" : this.totalFrameCount >= 1e3 ? e = (this.totalFrameCount / 1e3).toFixed(1) + "K" : e = this.totalFrameCount.toString(), this.frameDisplay.querySelector(".stat-value").textContent = e;
  }
  updateTimeDisplay(e) {
    const t = Math.floor(e), n = Math.floor(t / 3600), s = Math.floor(t % 3600 / 60), r = t % 60;
    let a;
    n > 0 ? a = `${n}:${s.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}` : a = `${s}:${r.toString().padStart(2, "0")}`, this.timeDisplay.querySelector(".stat-value").textContent = a;
  }
  updateResolutionDisplay() {
    this.resolutionDisplay.querySelector(".stat-value").textContent || (this.resolutionDisplay.querySelector(".stat-value").textContent = "0×0");
  }
}
class vt {
  constructor(e, t) {
    l(this, "container");
    l(this, "controlsContainer");
    l(this, "controlsGrid");
    l(this, "menuButton");
    l(this, "playPauseButton");
    l(this, "isMenuOpen", !1);
    this.container = e, this.controlsContainer = document.createElement("div"), this.controlsContainer.className = "playback-controls", this.menuButton = document.createElement("button"), this.menuButton.className = "controls-menu-button", this.menuButton.title = "Controls", this.menuButton.textContent = "+", this.menuButton.addEventListener("click", () => this.toggleMenu()), this.controlsGrid = document.createElement("div"), this.controlsGrid.className = "controls-grid", this.playPauseButton = document.createElement("button"), this.playPauseButton.className = "control-button", this.playPauseButton.title = "Play/Pause (Space)", this.playPauseButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
      </svg>
    `, this.playPauseButton.addEventListener("click", () => t.onTogglePlayPause());
    const n = document.createElement("button");
    n.className = "control-button", n.title = "Reset (R)", n.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
    `, n.addEventListener("click", () => t.onReset());
    const s = document.createElement("button");
    s.className = "control-button", s.title = "Screenshot (S)", s.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
        <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
      </svg>
    `, s.addEventListener("click", () => t.onScreenshot());
    const r = document.createElement("button");
    r.className = "control-button", r.title = "Record Video", r.innerHTML = `
      <svg viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5"/>
      </svg>
    `, r.addEventListener("click", () => t.onToggleRecording());
    const a = document.createElement("button");
    a.className = "control-button", a.title = "Export HTML", a.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
        <path d="M2 14.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
      </svg>
    `, a.addEventListener("click", () => t.onExportHTML());
    const o = document.createElement("button");
    o.className = "control-button", o.title = "Render", o.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/>
      </svg>
    `, o.addEventListener("click", () => t.onRender());
    const c = document.createElement("button");
    c.className = "control-button", c.title = "Close", c.textContent = "−", c.style.fontSize = "20px", c.style.fontWeight = "300", c.addEventListener("click", () => this.toggleMenu()), this.controlsGrid.appendChild(this.playPauseButton), this.controlsGrid.appendChild(n), this.controlsGrid.appendChild(a), this.controlsGrid.appendChild(o), this.controlsGrid.appendChild(s), this.controlsGrid.appendChild(r);
    const u = document.createElement("div");
    this.controlsGrid.appendChild(u), this.controlsGrid.appendChild(c), this.controlsContainer.appendChild(this.controlsGrid), this.controlsContainer.appendChild(this.menuButton), this.container.appendChild(this.controlsContainer);
  }
  /**
   * Update the play/pause button icon.
   */
  setPaused(e) {
    e ? this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M4 3v10l8-5-8-5z"/>
        </svg>
      ` : this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
        </svg>
      `;
  }
  /**
   * Clean up DOM.
   */
  dispose() {
    this.controlsContainer.remove();
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen, this.menuButton.textContent = this.isMenuOpen ? "−" : "+", this.controlsGrid.classList.toggle("open", this.isMenuOpen), this.controlsContainer.classList.toggle("open", this.isMenuOpen);
  }
}
class Tt {
  constructor(e, t, n, s) {
    l(this, "backdrop");
    l(this, "cancelRenderFn", null);
    // Form elements
    l(this, "widthInput");
    l(this, "heightInput");
    l(this, "fpsInput");
    l(this, "durationInput");
    l(this, "formatFrames");
    l(this, "formatVideo");
    l(this, "estimateEl");
    // Progress elements
    l(this, "bodyEl");
    l(this, "actionsEl");
    l(this, "progressEl");
    l(this, "progressBar");
    l(this, "progressText");
    this.parentContainer = e, this.canvasWidth = t, this.canvasHeight = n, this.onStartRender = s, this.backdrop = document.createElement("div"), this.backdrop.className = "render-dialog-backdrop", this.backdrop.addEventListener("click", (x) => {
      x.target === this.backdrop && this.close();
    });
    const r = document.createElement("div");
    r.className = "render-dialog";
    const a = document.createElement("div");
    a.className = "render-dialog-header", a.innerHTML = `
      <div class="render-dialog-title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
          <path d="M2 14.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
        </svg>
        Render
      </div>
    `;
    const o = document.createElement("button");
    o.className = "render-dialog-close", o.textContent = "×", o.addEventListener("click", () => this.close()), a.appendChild(o), this.bodyEl = document.createElement("div"), this.bodyEl.className = "render-dialog-body";
    const c = this.createField("Resolution"), u = document.createElement("div");
    u.className = "render-field-row", this.widthInput = this.createNumberInput(t, 1, 7680), this.heightInput = this.createNumberInput(n, 1, 4320);
    const d = document.createElement("span");
    d.textContent = "×", u.appendChild(this.widthInput), u.appendChild(d), u.appendChild(this.heightInput), c.appendChild(u);
    const h = this.createField("FPS");
    this.fpsInput = this.createNumberInput(60, 1, 120), h.appendChild(this.fpsInput);
    const T = this.createField("Duration (seconds)");
    this.durationInput = this.createNumberInput(10, 1, 3600), T.appendChild(this.durationInput);
    const _ = this.createField("Format"), y = document.createElement("div");
    y.className = "render-format-group", this.formatFrames = document.createElement("input"), this.formatFrames.type = "radio", this.formatFrames.name = "render-format", this.formatFrames.id = "render-fmt-frames", this.formatFrames.value = "frames", this.formatVideo = document.createElement("input"), this.formatVideo.type = "radio", this.formatVideo.name = "render-format", this.formatVideo.id = "render-fmt-video", this.formatVideo.value = "video", this.formatVideo.checked = !0;
    const b = document.createElement("div");
    b.className = "render-format-option";
    const w = document.createElement("label");
    w.htmlFor = "render-fmt-frames", w.textContent = "PNG Frames", b.appendChild(this.formatFrames), b.appendChild(w);
    const R = document.createElement("div");
    R.className = "render-format-option";
    const p = document.createElement("label");
    p.htmlFor = "render-fmt-video", p.textContent = "Video (WebM)", R.appendChild(this.formatVideo), R.appendChild(p), y.appendChild(R), y.appendChild(b), _.appendChild(y), this.estimateEl = document.createElement("div"), this.estimateEl.className = "render-estimate", this.bodyEl.appendChild(c), this.bodyEl.appendChild(h), this.bodyEl.appendChild(T), this.bodyEl.appendChild(_), this.bodyEl.appendChild(this.estimateEl), this.actionsEl = document.createElement("div"), this.actionsEl.className = "render-dialog-actions";
    const m = document.createElement("button");
    m.className = "render-btn render-btn-cancel", m.textContent = "Cancel", m.addEventListener("click", () => this.close());
    const g = document.createElement("button");
    g.className = "render-btn render-btn-primary", g.textContent = "Start Render", g.addEventListener("click", () => this.startRender()), this.actionsEl.appendChild(m), this.actionsEl.appendChild(g), this.progressEl = document.createElement("div"), this.progressEl.className = "render-progress", this.progressEl.innerHTML = `
      <div class="render-progress-bar-bg"><div class="render-progress-bar"></div></div>
      <div class="render-progress-text">Preparing...</div>
    `, this.progressBar = this.progressEl.querySelector(".render-progress-bar"), this.progressText = this.progressEl.querySelector(".render-progress-text");
    const f = document.createElement("button");
    f.className = "render-btn render-btn-cancel", f.textContent = "Cancel Render", f.style.marginTop = "4px", f.addEventListener("click", () => this.cancelRender()), this.progressEl.appendChild(f), r.appendChild(a), r.appendChild(this.bodyEl), r.appendChild(this.actionsEl), r.appendChild(this.progressEl), this.backdrop.appendChild(r);
    const E = () => this.updateEstimate();
    this.widthInput.addEventListener("input", E), this.heightInput.addEventListener("input", E), this.fpsInput.addEventListener("input", E), this.durationInput.addEventListener("input", E), this.formatFrames.addEventListener("change", E), this.formatVideo.addEventListener("change", E), this.updateEstimate();
  }
  open() {
    this.parentContainer.appendChild(this.backdrop);
  }
  close() {
    var e;
    (e = this.cancelRenderFn) == null || e.call(this), this.cancelRenderFn = null, this.backdrop.remove();
  }
  createField(e) {
    const t = document.createElement("div");
    t.className = "render-field";
    const n = document.createElement("div");
    return n.className = "render-field-label", n.textContent = e, t.appendChild(n), t;
  }
  createNumberInput(e, t, n) {
    const s = document.createElement("input");
    return s.type = "number", s.className = "render-input", s.value = String(Math.round(e)), s.min = String(t), s.max = String(n), s;
  }
  updateEstimate() {
    const e = parseInt(this.widthInput.value) || 0, t = parseInt(this.heightInput.value) || 0, n = parseInt(this.fpsInput.value) || 0, s = parseFloat(this.durationInput.value) || 0, r = Math.ceil(n * s);
    if (this.formatFrames.checked) {
      const o = e * t * 4 / 1048576 * r;
      this.estimateEl.textContent = `${r} frames, ~${o < 1024 ? Math.round(o) + " MB" : (o / 1024).toFixed(1) + " GB"} raw`;
    } else
      this.estimateEl.textContent = `${r} frames, ${s}s at ${n} fps`;
  }
  startRender() {
    const e = parseInt(this.widthInput.value) || this.canvasWidth, t = parseInt(this.heightInput.value) || this.canvasHeight, n = parseInt(this.fpsInput.value) || 60, s = parseFloat(this.durationInput.value) || 10, r = this.formatFrames.checked ? "frames" : "video";
    this.bodyEl.style.display = "none", this.actionsEl.style.display = "none", this.progressEl.classList.add("active"), this.progressBar.style.width = "0%", this.progressText.textContent = "Preparing...", this.cancelRenderFn = this.onStartRender({
      width: e,
      height: t,
      fps: n,
      duration: s,
      format: r,
      onProgress: (a, o) => {
        const c = a / o * 100;
        this.progressBar.style.width = `${c}%`, this.progressText.textContent = `Frame ${a} / ${o} (${Math.round(c)}%)`;
      },
      onComplete: () => {
        this.progressText.textContent = "Done!", this.progressBar.style.width = "100%", setTimeout(() => this.close(), 1500);
      },
      onError: (a) => {
        this.progressText.textContent = `Error: ${a.message}`, this.progressBar.style.background = "#c62828";
      }
    });
  }
  cancelRender() {
    var e;
    (e = this.cancelRenderFn) == null || e.call(this), this.cancelRenderFn = null, this.bodyEl.style.display = "", this.actionsEl.style.display = "", this.progressEl.classList.remove("active");
  }
}
const M = class M {
  constructor(e) {
    l(this, "container");
    l(this, "views", /* @__PURE__ */ new Map());
    l(this, "primaryView");
    l(this, "project");
    l(this, "isMultiView");
    l(this, "animationId", null);
    l(this, "startTime", 0);
    l(this, "pausedElapsedTime", 0);
    l(this, "disposed", !1);
    // Stats panel
    l(this, "statsPanel");
    // Playback controls
    l(this, "playbackControls", null);
    l(this, "isPaused", !1);
    // Visibility observer (auto-pause when off-screen)
    l(this, "intersectionObserver");
    l(this, "isVisible", !0);
    // Floating uniforms panel
    l(this, "uniformsPanel", null);
    // Script hooks API
    l(this, "scriptAPI", null);
    l(this, "scriptErrorCount", 0);
    l(this, "_lastOnFrameTime", null);
    // Recording
    l(this, "recorder");
    // Keyboard shortcut handlers (stored for cleanup in dispose)
    l(this, "globalKeyHandler", null);
    l(this, "controlsKeyHandler", null);
    // ===========================================================================
    // Animation Loop
    // ===========================================================================
    l(this, "animate", (e) => {
      if (this.disposed || (this.animationId = requestAnimationFrame(this.animate), this.isPaused || !this.isVisible))
        return;
      for (const s of this.views.values())
        if (s.isContextLost) return;
      const t = e / 1e3, n = t - this.startTime;
      if (this.statsPanel.update(t, n), this.runScriptOnFrame(n, this.statsPanel.totalFrameCount), this.isMultiView) {
        const s = /* @__PURE__ */ new Map();
        for (const [r, a] of this.views)
          s.set(r, {
            mouse: a.getMouseState(),
            resolution: a.getResolution(),
            mousePressed: a.getMousePressed()
          });
        for (const r of this.views.values())
          r.step(n, s);
      } else
        this.primaryView.step(n);
    });
    var n;
    this.container = e.container, this.project = e.project, this.isMultiView = Re(e.project), this.container.hasAttribute("tabindex") || this.container.setAttribute("tabindex", "-1"), this.container.style.outline = "none", this.container.addEventListener("mousedown", () => this.container.focus());
    const t = e.pixelRatio ?? e.project.pixelRatio ?? window.devicePixelRatio;
    if (this.isMultiView) {
      const s = e.project, r = s.views.map((a) => a.name);
      if (!e.viewContainers)
        throw new Error("viewContainers required for multi-view projects");
      for (const a of s.views) {
        const o = e.viewContainers.get(a.name);
        if (!o)
          throw new Error(`No container provided for view "${a.name}"`);
        const c = this.createViewProject(s, a), u = new Ee({
          container: o,
          project: c,
          keyboardTarget: this.container,
          pixelRatio: t,
          viewNames: r
        });
        this.views.set(a.name, u);
      }
      this.primaryView = this.views.values().next().value;
    } else {
      const s = new Ee({
        container: e.container,
        project: e.project,
        keyboardTarget: this.container,
        pixelRatio: t
      });
      this.views.set("default", s), this.primaryView = s;
    }
    if (this.recorder = new gt(this.primaryView.canvas, this.container, this.project.root), this.statsPanel = new Et(this.container), this.statsPanel.updateResolution(this.primaryView.canvas.width, this.primaryView.canvas.height), this.isMultiView) {
      this.primaryView.onResize = (s, r) => {
        this.statsPanel.updateResolution(s, r);
      };
      for (const s of this.views.values())
        s.onContextRestored = () => {
          var r;
          if (this.scriptAPI && ((r = this.project.script) != null && r.setup))
            try {
              this.project.script.setup(this.scriptAPI);
            } catch (a) {
              console.error("script.js setup() threw during context restore:", a), this.primaryView.runtimeErrorOverlay.showError("setup", a);
            }
        };
    } else
      this.primaryView.onResize = (s, r) => {
        this.statsPanel.updateResolution(s, r), this.startTime = performance.now() / 1e3, this.pausedElapsedTime = 0;
      }, this.primaryView.onContextRestored = () => {
        var s;
        if (this.scriptAPI && ((s = this.project.script) != null && s.setup))
          try {
            this.project.script.setup(this.scriptAPI);
          } catch (r) {
            console.error("script.js setup() threw during context restore:", r), this.primaryView.runtimeErrorOverlay.showError("setup", r);
          }
        this.reset(), this.start();
      };
    if (this.project.controls && !e.skipPlaybackControls && (this.playbackControls = new vt(this.container, {
      onTogglePlayPause: () => this.togglePlayPause(),
      onReset: () => this.reset(),
      onScreenshot: () => this.screenshot(),
      onToggleRecording: () => this.toggleRecording(),
      onExportHTML: () => this.exportHTML(),
      onRender: () => this.openRenderDialog()
    })), this.project.startPaused && (this.isPaused = !0, (n = this.playbackControls) == null || n.setPaused(!0)), this.intersectionObserver = new IntersectionObserver(
      (s) => {
        this.isVisible = s[0].isIntersecting;
      },
      { threshold: 0.1 }
    ), this.intersectionObserver.observe(this.container), this.project.script && (this.initScriptAPI(), this.project.script.setup && this.scriptAPI))
      try {
        this.project.script.setup(this.scriptAPI);
      } catch (s) {
        console.error("script.js setup() threw:", s), this.primaryView.runtimeErrorOverlay.showError("setup", s);
      }
    !e.skipUniformsPanel && this.project.uniforms && Object.values(this.project.uniforms).some((s) => se(s)) && (this.uniformsPanel = new mt({
      container: this.container,
      uniforms: this.project.uniforms,
      onChange: (s, r) => {
        this.setUniformValue(s, r);
      }
    })), this.setupGlobalShortcuts(), this.project.controls && this.setupKeyboardShortcuts();
  }
  // ===========================================================================
  // Multi-View Helpers
  // ===========================================================================
  /**
   * Create a single-view ShaderProject from a MultiViewProject + ViewEntry.
   * Each view gets a fullscreen layout with no controls (App manages controls).
   */
  createViewProject(e, t) {
    return {
      mode: e.mode,
      root: e.root,
      meta: {
        ...e.meta,
        title: `${e.meta.title} - ${t.name}`
      },
      layout: "fullscreen",
      theme: e.theme,
      controls: !1,
      startPaused: e.startPaused,
      pixelRatio: e.pixelRatio,
      commonSource: e.commonSource,
      passes: t.passes,
      textures: e.textures,
      uniforms: e.uniforms,
      script: null
      // Script handled by App, not individual views
    };
  }
  // ===========================================================================
  // Script API
  // ===========================================================================
  initScriptAPI() {
    const e = this;
    this.scriptAPI = {
      setUniformValue: (t, n) => e.setUniformValue(t, n),
      getUniformValue: (t) => e.primaryView.engine.getUniformValue(t),
      updateTexture: (t, n, s, r) => e.primaryView.engine.updateTexture(t, n, s, r),
      readPixels: (t, n, s, r, a) => e.primaryView.engine.readPixels(t, n, s, r, a),
      get width() {
        return e.primaryView.engine.width;
      },
      get height() {
        return e.primaryView.engine.height;
      },
      setOverlay: (t, n, s) => {
        const r = s ? e.views.get(s) : e.primaryView;
        r == null || r.setOverlay(t, n);
      },
      // Multi-view extensions (undefined for single-view)
      getCrossViewState: e.isMultiView ? (t) => e.getCrossViewState(t) : void 0,
      viewNames: e.isMultiView ? e.project.views.map((t) => t.name) : void 0
    };
  }
  /**
   * Run script onFrame hook with error tracking.
   * Called from animate() with error tracking.
   */
  runScriptOnFrame(e, t) {
    var s;
    if (!this.scriptAPI || !((s = this.project.script) != null && s.onFrame) || this.scriptErrorCount >= M.MAX_SCRIPT_ERRORS) return;
    const n = this._lastOnFrameTime !== null ? e - this._lastOnFrameTime : 0;
    try {
      this.project.script.onFrame(this.scriptAPI, e, n, t), this.scriptErrorCount = 0;
    } catch (r) {
      this.scriptErrorCount++, console.error(`script.js onFrame() threw (${this.scriptErrorCount}/${M.MAX_SCRIPT_ERRORS}):`, r), this.primaryView.runtimeErrorOverlay.showError("onFrame", r), this.scriptErrorCount >= M.MAX_SCRIPT_ERRORS && (console.warn("script.js onFrame() disabled after too many errors"), this.primaryView.runtimeErrorOverlay.showDisabled());
    }
    this._lastOnFrameTime = e;
  }
  // ===========================================================================
  // Public API
  // ===========================================================================
  hasErrors() {
    for (const e of this.views.values())
      if (e.hasErrors()) return !0;
    return !1;
  }
  getEngine() {
    return this.primaryView.engine;
  }
  /**
   * Set a uniform value across all views.
   */
  setUniformValue(e, t) {
    for (const n of this.views.values())
      n.engine.setUniformValue(e, t);
  }
  /**
   * Get a uniform value from the primary view.
   */
  getUniformValue(e) {
    return this.primaryView.engine.getUniformValue(e);
  }
  /**
   * Start the animation loop.
   */
  start() {
    this.animationId === null && (this.startTime = performance.now() / 1e3, this.animationId = requestAnimationFrame(this.animate));
  }
  stop() {
    this.animationId !== null && (cancelAnimationFrame(this.animationId), this.animationId = null);
  }
  // ===========================================================================
  // Cross-View State
  // ===========================================================================
  getMouseState() {
    return this.primaryView.getMouseState();
  }
  getResolution() {
    return this.primaryView.getResolution();
  }
  getMousePressed() {
    return this.primaryView.getMousePressed();
  }
  /**
   * Get cross-view state for a named view.
   */
  getCrossViewState(e) {
    const t = this.views.get(e);
    if (t)
      return {
        mouse: t.getMouseState(),
        resolution: t.getResolution(),
        mousePressed: t.getMousePressed()
      };
  }
  setOverlay(e, t) {
    this.primaryView.setOverlay(e, t);
  }
  // ===========================================================================
  // Playback Control
  // ===========================================================================
  togglePlayPause() {
    var e;
    this.isPaused ? this.startTime = performance.now() / 1e3 - this.pausedElapsedTime : this.pausedElapsedTime = performance.now() / 1e3 - this.startTime, this.isPaused = !this.isPaused, (e = this.playbackControls) == null || e.setPaused(this.isPaused);
  }
  getPaused() {
    return this.isPaused;
  }
  reset() {
    this.startTime = performance.now() / 1e3, this.pausedElapsedTime = 0, this._lastOnFrameTime = null, this.statsPanel.reset();
    for (const e of this.views.values())
      e.engine.reset();
  }
  // ===========================================================================
  // Screenshots & Recording
  // ===========================================================================
  screenshot() {
    const e = this.project.root.split("/").pop() || "shader", t = /* @__PURE__ */ new Date(), n = t.getFullYear().toString() + (t.getMonth() + 1).toString().padStart(2, "0") + t.getDate().toString().padStart(2, "0") + "-" + t.getHours().toString().padStart(2, "0") + t.getMinutes().toString().padStart(2, "0") + t.getSeconds().toString().padStart(2, "0"), s = `shadertoy-${e}-${n}.png`;
    this.primaryView.canvas.toBlob((r) => {
      if (!r) {
        console.error("Failed to create screenshot blob");
        return;
      }
      const a = URL.createObjectURL(r), o = document.createElement("a");
      o.href = a, o.download = s, o.click(), URL.revokeObjectURL(a), console.log(`Screenshot saved: ${s}`);
    }, "image/png");
  }
  toggleRecording() {
    this.recorder.toggle(this.isPaused, () => this.togglePlayPause());
  }
  // ===========================================================================
  // HTML Export
  // ===========================================================================
  exportHTML() {
    if (this.isMultiView) {
      console.warn("HTML export is not supported for multi-view projects");
      return;
    }
    pt(this.project, this.primaryView.engine);
  }
  openRenderDialog() {
    new Tt(
      this.container,
      this.primaryView.canvas.width,
      this.primaryView.canvas.height,
      (t) => this.renderOffline(t)
    ).open();
  }
  renderOffline(e) {
    let t = !1;
    const n = () => {
      t = !0;
    };
    return (async () => {
      var d, h;
      const r = this.primaryView.canvas, a = this.primaryView.engine, o = r.width, c = r.height, u = this.isPaused;
      try {
        this.isPaused = !0, r.width = e.width, r.height = e.height, a.resize(e.width, e.height), a.reset(), this.scriptAPI && ((d = this.project.script) != null && d.setup) && this.project.script.setup(this.scriptAPI);
        const T = Math.ceil(e.fps * e.duration);
        e.format === "video" ? await this.renderVideoFrames(T, e.fps, () => t, e.onProgress) : await this.renderPngFrames(T, e.fps, () => t, e.onProgress), t || e.onComplete();
      } catch (T) {
        t || e.onError(T instanceof Error ? T : new Error(String(T)));
      } finally {
        if (r.width = o, r.height = c, a.resize(o, c), a.reset(), this.scriptAPI && ((h = this.project.script) != null && h.setup))
          try {
            this.project.script.setup(this.scriptAPI);
          } catch {
          }
        this.isPaused = u;
      }
    })(), n;
  }
  async renderPngFrames(e, t, n, s) {
    let r = null;
    if ("showDirectoryPicker" in window)
      try {
        r = await window.showDirectoryPicker({ mode: "readwrite" });
      } catch {
      }
    for (let a = 0; a < e; a++) {
      if (n()) return;
      this.stepForRender(a, t), this.primaryView.presentToScreen();
      const o = await new Promise((u, d) => {
        this.primaryView.canvas.toBlob((h) => h ? u(h) : d(new Error("Failed to capture frame")), "image/png");
      }), c = `frame_${String(a).padStart(5, "0")}.png`;
      if (r) {
        const d = await (await r.getFileHandle(c, { create: !0 })).createWritable();
        await d.write(o), await d.close();
      } else {
        const u = URL.createObjectURL(o), d = document.createElement("a");
        d.href = u, d.download = c, d.click(), URL.revokeObjectURL(u);
      }
      s(a + 1, e), a % 10 === 0 && await new Promise((u) => setTimeout(u, 0));
    }
  }
  async renderVideoFrames(e, t, n, s) {
    const r = this.primaryView.canvas, a = document.createElement("canvas");
    a.width = r.width, a.height = r.height;
    const o = a.getContext("2d"), c = a.captureStream(0), u = new MediaRecorder(c, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8e6
    }), d = [];
    u.ondataavailable = (b) => {
      b.data.size > 0 && d.push(b.data);
    };
    const h = new Promise((b) => {
      u.onstop = () => b();
    });
    u.start();
    for (let b = 0; b < e; b++) {
      if (n()) {
        u.stop(), await h;
        return;
      }
      this.stepForRender(b, t), this.primaryView.presentToScreen(), o.drawImage(r, 0, 0);
      const w = c.getVideoTracks()[0];
      w != null && w.requestFrame && w.requestFrame(), s(b + 1, e), b % 10 === 0 && await new Promise((R) => setTimeout(R, 0));
    }
    u.stop(), await h;
    const T = new Blob(d, { type: "video/webm" }), _ = URL.createObjectURL(T), y = document.createElement("a");
    y.href = _, y.download = `render_${r.width}x${r.height}_${t}fps.webm`, y.click(), URL.revokeObjectURL(_);
  }
  stepForRender(e, t) {
    var r;
    const n = e / t, s = 1 / t;
    if (this.scriptAPI && ((r = this.project.script) != null && r.onFrame))
      try {
        this.project.script.onFrame(this.scriptAPI, n, s, e);
      } catch {
      }
    this.primaryView.engine.step(n, [0, 0, 0, 0], !1);
  }
  // ===========================================================================
  // Keyboard Shortcuts
  // ===========================================================================
  static isTextInput(e) {
    const t = e.target;
    if (!t) return !1;
    const n = t.tagName;
    return n === "INPUT" || n === "TEXTAREA" || t.isContentEditable;
  }
  setupGlobalShortcuts() {
    this.globalKeyHandler = (e) => {
      M.isTextInput(e) || e.code === "KeyS" && !e.repeat && (e.preventDefault(), this.screenshot());
    }, this.container.addEventListener("keydown", this.globalKeyHandler);
  }
  setupKeyboardShortcuts() {
    this.controlsKeyHandler = (e) => {
      M.isTextInput(e) || (e.code === "Space" && !e.repeat && (e.preventDefault(), this.togglePlayPause()), e.code === "KeyR" && !e.repeat && (e.preventDefault(), this.reset()));
    }, this.container.addEventListener("keydown", this.controlsKeyHandler);
  }
  // ===========================================================================
  // Lifecycle
  // ===========================================================================
  dispose() {
    var e, t;
    this.disposed = !0, this.stop();
    for (const n of this.views.values())
      n.dispose();
    this.recorder.dispose(), (e = this.playbackControls) == null || e.dispose(), this.intersectionObserver.disconnect(), this.globalKeyHandler && this.container.removeEventListener("keydown", this.globalKeyHandler), this.controlsKeyHandler && this.container.removeEventListener("keydown", this.controlsKeyHandler), (t = this.uniformsPanel) == null || t.destroy(), this.statsPanel.dispose();
  }
};
l(M, "MAX_SCRIPT_ERRORS", 10);
let q = M;
class bt {
  constructor(e) {
    l(this, "wrapper");
    l(this, "opts");
    l(this, "controlsWrapper");
    l(this, "toggleButton");
    l(this, "panel", null);
    l(this, "controls", null);
    l(this, "isOpen", !1);
    l(this, "isPaused", !1);
    this.wrapper = e.wrapper, this.opts = e, this.isPaused = e.getPaused(), this.controlsWrapper = document.createElement("div"), this.controlsWrapper.className = "multi-view-controls-wrapper", this.toggleButton = document.createElement("button"), this.toggleButton.className = "multi-view-controls-toggle", this.toggleButton.title = "Toggle Controls", this.toggleButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
      </svg>
    `, this.toggleButton.addEventListener("click", () => this.toggle()), this.controlsWrapper.appendChild(this.toggleButton), this.createPanel(e.uniforms), this.wrapper.appendChild(this.controlsWrapper);
  }
  createPanel(e) {
    this.panel = document.createElement("div"), this.panel.className = "multi-view-controls-panel";
    const t = document.createElement("div");
    t.className = "multi-view-controls-header";
    const n = document.createElement("span");
    n.textContent = "Controls", t.appendChild(n);
    const s = document.createElement("button");
    s.className = "multi-view-controls-close", s.innerHTML = "&times;", s.title = "Close", s.addEventListener("click", () => this.toggle()), t.appendChild(s), this.panel.appendChild(t);
    const r = document.createElement("div");
    r.className = "controls-section playback-controls";
    const a = document.createElement("button");
    a.className = "control-btn play-pause-btn", a.title = "Play/Pause", this.updatePlayPauseIcon(a), a.addEventListener("click", () => {
      this.opts.onTogglePlayPause(), this.isPaused = this.opts.getPaused(), this.updatePlayPauseIcon(a);
    }), r.appendChild(a);
    const o = document.createElement("button");
    if (o.className = "control-btn reset-btn", o.title = "Reset", o.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
    `, o.addEventListener("click", () => {
      this.opts.onReset();
    }), r.appendChild(o), this.panel.appendChild(r), e && Object.values(e).some((c) => se(c))) {
      const c = document.createElement("div");
      c.className = "controls-section uniforms-section";
      const u = document.createElement("div");
      u.className = "section-label", u.textContent = "Uniforms", c.appendChild(u);
      const d = document.createElement("div");
      d.className = "uniforms-container", this.controls = new Fe({
        container: d,
        uniforms: e,
        onChange: (h, T) => {
          var _, y;
          (y = (_ = this.opts).onSetUniformValue) == null || y.call(_, h, T);
        }
      }), c.appendChild(d), this.panel.appendChild(c);
    }
    this.panel.classList.add("closed"), this.controlsWrapper.appendChild(this.panel);
  }
  updatePlayPauseIcon(e) {
    this.isPaused ? e.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ` : e.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
  }
  toggle() {
    var e, t;
    this.isOpen = !this.isOpen, this.isOpen ? ((e = this.panel) == null || e.classList.remove("closed"), this.toggleButton.classList.add("hidden")) : ((t = this.panel) == null || t.classList.add("closed"), this.toggleButton.classList.remove("hidden"));
  }
  dispose() {
    var e;
    (e = this.controls) == null || e.destroy(), this.wrapper.removeChild(this.controlsWrapper);
  }
}
class yt {
  constructor(e) {
    l(this, "container");
    l(this, "root");
    l(this, "canvasContainer");
    this.container = e.container, this.root = document.createElement("div"), this.root.className = "layout-fullscreen", this.canvasContainer = document.createElement("div"), this.canvasContainer.className = "canvas-container", this.root.appendChild(this.canvasContainer), this.container.appendChild(this.root);
  }
  getCanvasContainer() {
    return this.canvasContainer;
  }
  dispose() {
    this.container.innerHTML = "";
  }
}
class wt {
  constructor(e) {
    l(this, "container");
    l(this, "root");
    l(this, "canvasContainer");
    this.container = e.container, this.root = document.createElement("div"), this.root.className = "layout-default", this.canvasContainer = document.createElement("div"), this.canvasContainer.className = "canvas-container", this.root.appendChild(this.canvasContainer), this.container.appendChild(this.root);
  }
  getCanvasContainer() {
    return this.canvasContainer;
  }
  dispose() {
    this.container.innerHTML = "";
  }
}
class xt {
  constructor(e) {
    l(this, "container");
    l(this, "project");
    l(this, "root");
    l(this, "canvasContainer");
    l(this, "codePanel");
    l(this, "editorPanel", null);
    l(this, "recompileHandler", null);
    l(this, "_disposed", !1);
    this.container = e.container, this.project = e.project, this.root = document.createElement("div"), this.root.className = "layout-split", this.canvasContainer = document.createElement("div"), this.canvasContainer.className = "canvas-container", this.codePanel = document.createElement("div"), this.codePanel.className = "code-panel", this.buildEditorPanel(), this.root.appendChild(this.canvasContainer), this.root.appendChild(this.codePanel), this.container.appendChild(this.root);
  }
  getCanvasContainer() {
    return this.canvasContainer;
  }
  setRecompileHandler(e) {
    this.recompileHandler = e, this.editorPanel && this.editorPanel.setRecompileHandler(e);
  }
  setUniformHandler(e) {
  }
  dispose() {
    this._disposed = !0, this.editorPanel && (this.editorPanel.dispose(), this.editorPanel = null), this.container.innerHTML = "";
  }
  /**
   * Build editor panel (dynamically loaded).
   */
  async buildEditorPanel() {
    try {
      const { EditorPanel: e } = await Promise.resolve().then(() => rn);
      if (this._disposed) return;
      this.editorPanel = new e(this.codePanel, this.project), this.recompileHandler && this.editorPanel.setRecompileHandler(this.recompileHandler);
    } catch (e) {
      console.error("Failed to load editor panel:", e);
    }
  }
}
class _t {
  constructor(e) {
    l(this, "container");
    l(this, "project");
    l(this, "root");
    l(this, "canvasContainer");
    l(this, "contentArea");
    l(this, "imageViewer");
    l(this, "editorContainer");
    l(this, "editorInstance", null);
    l(this, "buttonContainer");
    l(this, "copyButton");
    l(this, "recompileButton");
    l(this, "errorDisplay");
    l(this, "recompileHandler", null);
    l(this, "modifiedSources", /* @__PURE__ */ new Map());
    l(this, "tabs", []);
    l(this, "activeTabIndex", 0);
    l(this, "keydownHandler", null);
    this.container = e.container, this.project = e.project, this.root = document.createElement("div"), this.root.className = "layout-tabbed";
    const t = document.createElement("div");
    t.className = "tabbed-wrapper", this.contentArea = document.createElement("div"), this.contentArea.className = "tabbed-content", this.canvasContainer = document.createElement("div"), this.canvasContainer.className = "tabbed-canvas-container", this.imageViewer = document.createElement("div"), this.imageViewer.className = "tabbed-image-viewer", this.imageViewer.style.visibility = "hidden", this.contentArea.appendChild(this.canvasContainer), this.contentArea.appendChild(this.imageViewer), this.editorContainer = document.createElement("div"), this.editorContainer.className = "tabbed-editor-container", this.editorContainer.style.visibility = "hidden", this.contentArea.appendChild(this.editorContainer), this.buttonContainer = document.createElement("div"), this.buttonContainer.className = "tabbed-button-container", this.buttonContainer.style.display = "none", this.copyButton = document.createElement("button"), this.copyButton.className = "tabbed-copy-button", this.copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" opacity="0.4"/>
        <path d="M2 5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2zm0 1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
      </svg>
    `, this.copyButton.title = "Copy code to clipboard", this.copyButton.addEventListener("click", () => this.copyToClipboard()), this.buttonContainer.appendChild(this.copyButton), this.recompileButton = document.createElement("button"), this.recompileButton.className = "tabbed-recompile-button", this.recompileButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 3v10l8-5-8-5z"/>
      </svg>
      Recompile
    `, this.recompileButton.title = "Recompile shader (Ctrl+Enter)", this.recompileButton.addEventListener("click", () => this.recompile()), this.buttonContainer.appendChild(this.recompileButton), this.errorDisplay = document.createElement("div"), this.errorDisplay.className = "tabbed-error-display", this.errorDisplay.style.display = "none", this.contentArea.appendChild(this.errorDisplay), this.setupKeyboardShortcut();
    const n = this.buildTabBar();
    t.appendChild(n), t.appendChild(this.contentArea), this.root.appendChild(t), this.container.appendChild(this.root);
  }
  getCanvasContainer() {
    return this.canvasContainer;
  }
  setRecompileHandler(e) {
    this.recompileHandler = e;
  }
  dispose() {
    this.keydownHandler && (this.container.removeEventListener("keydown", this.keydownHandler), this.keydownHandler = null), this.editorInstance && (this.editorInstance.destroy(), this.editorInstance = null), this.container.innerHTML = "";
  }
  setupKeyboardShortcut() {
    this.keydownHandler = (e) => {
      (e.ctrlKey || e.metaKey) && e.key === "Enter" && this.tabs[this.activeTabIndex].kind === "code" && (e.preventDefault(), this.recompile());
    }, this.container.addEventListener("keydown", this.keydownHandler);
  }
  saveCurrentEditorContent() {
    if (this.editorInstance) {
      const e = this.tabs[this.activeTabIndex];
      if (e.kind === "code") {
        const t = this.editorInstance.getSource();
        this.modifiedSources.set(e.passName, t);
      }
    }
  }
  recompile() {
    if (!this.recompileHandler) {
      console.warn("No recompile handler set");
      return;
    }
    this.saveCurrentEditorContent();
    const e = this.tabs[this.activeTabIndex];
    if (e.kind !== "code") return;
    const t = this.modifiedSources.get(e.passName) ?? e.source, n = this.recompileHandler(e.passName, t);
    n.success ? (this.hideError(), e.source = t) : this.showError(n.error || "Compilation failed");
  }
  showError(e) {
    this.errorDisplay && (this.errorDisplay.textContent = e, this.errorDisplay.style.display = "block");
  }
  hideError() {
    this.errorDisplay && (this.errorDisplay.style.display = "none");
  }
  async copyToClipboard() {
    const e = this.tabs[this.activeTabIndex];
    if (e.kind !== "code") return;
    const t = this.editorInstance ? this.editorInstance.getSource() : this.modifiedSources.get(e.passName) ?? e.source;
    try {
      await navigator.clipboard.writeText(t);
      const n = this.copyButton.innerHTML;
      this.copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
        </svg>
      `, this.copyButton.classList.add("copied"), setTimeout(() => {
        this.copyButton.innerHTML = n, this.copyButton.classList.remove("copied");
      }, 1500);
    } catch (n) {
      console.error("Failed to copy:", n);
    }
  }
  buildTabBar() {
    const e = document.createElement("div");
    e.className = "tabbed-toolbar";
    const t = document.createElement("div");
    t.className = "tabbed-tab-bar", this.tabs = [], this.tabs.push({ kind: "shader", name: "Shader" }), this.project.commonSource && this.tabs.push({
      kind: "code",
      name: "common.glsl",
      passName: "common",
      source: this.project.commonSource
    });
    const n = [
      "BufferA",
      "BufferB",
      "BufferC",
      "BufferD"
    ];
    for (const a of n) {
      const o = this.project.passes[a];
      o && this.tabs.push({
        kind: "code",
        name: `${a.toLowerCase()}.glsl`,
        passName: a,
        source: o.glslSource
      });
    }
    const s = this.project.passes.Image;
    this.tabs.push({
      kind: "code",
      name: "image.glsl",
      passName: "Image",
      source: s.glslSource
    });
    for (const a of this.project.textures)
      this.tabs.push({
        kind: "image",
        name: a.filename || a.name,
        url: a.source
      });
    const r = async (a) => {
      this.saveCurrentEditorContent();
      const o = this.tabs[a];
      if (this.activeTabIndex = a, t.querySelectorAll(".tabbed-tab-button").forEach((c, u) => {
        c.classList.toggle("active", u === a);
      }), this.canvasContainer.style.visibility = "hidden", this.imageViewer.style.visibility = "hidden", this.editorContainer.style.visibility = "hidden", this.buttonContainer.style.display = "none", this.editorInstance && (this.editorInstance.destroy(), this.editorInstance = null), o.kind === "shader")
        this.canvasContainer.style.visibility = "visible";
      else if (o.kind === "code") {
        this.editorContainer.style.visibility = "visible", this.buttonContainer.style.display = "flex";
        const c = this.modifiedSources.get(o.passName) ?? o.source;
        this.editorContainer.innerHTML = "";
        try {
          const { createEditor: u } = await Promise.resolve().then(() => Be);
          this.editorInstance = u(this.editorContainer, c, (d) => {
            this.modifiedSources.set(o.passName, d);
          });
        } catch (u) {
          console.error("Failed to load editor:", u);
          const d = document.createElement("textarea");
          d.className = "tabbed-fallback-textarea", d.value = c, d.addEventListener("input", () => {
            this.modifiedSources.set(o.passName, d.value);
          }), this.editorContainer.appendChild(d);
        }
      } else {
        this.imageViewer.style.visibility = "visible";
        const c = document.createElement("img");
        c.src = o.url, c.alt = o.name, this.imageViewer.innerHTML = "", this.imageViewer.appendChild(c);
      }
    };
    return this.tabs.forEach((a, o) => {
      const c = document.createElement("button");
      c.className = "tabbed-tab-button", a.kind === "shader" ? c.classList.add("shader-tab") : a.kind === "image" && c.classList.add("image-tab"), c.textContent = a.name, o === 0 && c.classList.add("active"), c.addEventListener("click", () => r(o)), t.appendChild(c);
    }), e.appendChild(t), e.appendChild(this.buttonContainer), e;
  }
}
class ve {
  constructor(e) {
    l(this, "container");
    l(this, "wrapper");
    l(this, "canvasContainers", /* @__PURE__ */ new Map());
    l(this, "resizeObserver");
    this.container = e.container;
    const t = e.viewNames.length;
    this.wrapper = document.createElement("div"), this.wrapper.className = "layout-multi-view layout-grid-view", this.wrapper.dataset.viewCount = String(t);
    for (const s of e.viewNames) {
      const r = document.createElement("div");
      r.className = "multi-view-canvas", r.setAttribute("data-view-name", s);
      const a = document.createElement("div");
      a.className = "multi-view-label", a.textContent = s, r.appendChild(a), this.canvasContainers.set(s, r), this.wrapper.appendChild(r);
    }
    this.container.appendChild(this.wrapper), this.resizeObserver = new ResizeObserver((s) => {
      for (const r of s) {
        const { width: a, height: o } = r.contentRect;
        this.updateOrientation(a, o);
      }
    }), this.resizeObserver.observe(this.wrapper);
    const n = this.wrapper.getBoundingClientRect();
    this.updateOrientation(n.width, n.height);
  }
  updateOrientation(e, t) {
    const n = e > t;
    this.wrapper.classList.toggle("grid-horizontal", n), this.wrapper.classList.toggle("grid-vertical", !n);
  }
  getCanvasContainers() {
    return this.canvasContainers;
  }
  getWrapperElement() {
    return this.wrapper;
  }
  dispose() {
    this.resizeObserver.disconnect(), this.container.innerHTML = "";
  }
}
class Rt {
  constructor(e) {
    l(this, "container");
    l(this, "wrapper");
    l(this, "canvasContainers", /* @__PURE__ */ new Map());
    l(this, "insetContainer", null);
    l(this, "minimizeBtn", null);
    l(this, "isMinimized", !1);
    l(this, "toggleMinimize", () => {
      this.isMinimized = !this.isMinimized, this.insetContainer && this.insetContainer.classList.toggle("minimized", this.isMinimized), this.minimizeBtn && (this.isMinimized ? (this.minimizeBtn.innerHTML = "&#x25A1;", this.minimizeBtn.title = "Restore", this.minimizeBtn.style.display = "none") : (this.minimizeBtn.innerHTML = "&#x2212;", this.minimizeBtn.title = "Minimize", this.minimizeBtn.style.display = ""));
    });
    if (this.container = e.container, e.viewNames.length < 2)
      throw new Error("InsetViewLayout requires at least 2 views");
    this.wrapper = document.createElement("div"), this.wrapper.className = "layout-multi-view layout-inset-view";
    const t = e.viewNames[0], n = document.createElement("div");
    n.className = "multi-view-canvas inset-main", n.setAttribute("data-view-name", t), this.canvasContainers.set(t, n), this.wrapper.appendChild(n);
    const s = e.viewNames[1];
    this.insetContainer = document.createElement("div"), this.insetContainer.className = "multi-view-canvas inset-overlay", this.insetContainer.setAttribute("data-view-name", s), this.canvasContainers.set(s, this.insetContainer), this.minimizeBtn = document.createElement("button"), this.minimizeBtn.className = "inset-minimize-btn", this.minimizeBtn.innerHTML = "&#x2212;", this.minimizeBtn.title = "Minimize", this.minimizeBtn.addEventListener("click", this.toggleMinimize), this.insetContainer.appendChild(this.minimizeBtn), this.wrapper.appendChild(this.insetContainer), this.insetContainer.addEventListener("click", (r) => {
      this.isMinimized && r.target === this.insetContainer && this.toggleMinimize();
    }), this.container.appendChild(this.wrapper);
  }
  getCanvasContainers() {
    return this.canvasContainers;
  }
  getWrapperElement() {
    return this.wrapper;
  }
  dispose() {
    this.minimizeBtn && this.minimizeBtn.removeEventListener("click", this.toggleMinimize), this.container.innerHTML = "";
  }
}
function Ct(i, e) {
  switch (i) {
    case "fullscreen":
      return new yt(e);
    case "default":
      return new wt(e);
    case "split":
      return new xt(e);
    case "tabbed":
      return new _t(e);
  }
}
function St(i, e) {
  switch (i) {
    case "split":
    case "quad":
    case "grid":
      return new ve(e);
    case "inset":
      return new Rt(e);
    default:
      return new ve(e);
  }
}
function Ft(i, e) {
  const { styled: t = !0, pixelRatio: n = window.devicePixelRatio } = e, s = { ...e.project };
  return e.layout !== void 0 && (s.layout = e.layout), e.controls !== void 0 && (s.controls = e.controls), e.theme !== void 0 && (s.theme = e.theme), e.startPaused !== void 0 && (s.startPaused = e.startPaused), e.pixelRatio !== void 0 && (s.pixelRatio = e.pixelRatio), t || i.classList.add("unstyled"), i.setAttribute("data-theme", s.theme), Re(s) ? Lt(i, s, n) : At(i, s, n);
}
function Ae(i, e) {
  return {
    pause: () => {
      i.getPaused() || i.togglePlayPause();
    },
    resume: () => {
      i.getPaused() && i.togglePlayPause();
    },
    reset: () => i.reset(),
    get isPaused() {
      return i.getPaused();
    },
    setUniform: (t, n) => i.setUniformValue(t, n),
    getUniform: (t) => i.getUniformValue(t),
    destroy: e
  };
}
function At(i, e, t) {
  const n = Ct(e.layout, {
    container: i,
    project: e
  }), s = new q({
    container: n.getCanvasContainer(),
    project: e,
    pixelRatio: t,
    skipUniformsPanel: !1,
    skipPlaybackControls: !1
  });
  return n.setRecompileHandler && n.setRecompileHandler((r, a) => {
    const o = s.getEngine();
    if (!o)
      return { success: !1, error: "Engine not initialized" };
    if (r === "common") {
      const c = o.recompileCommon(a);
      if (c.success)
        return { success: !0 };
      const u = c.errors[0];
      return {
        success: !1,
        error: u ? `${u.passName}: ${u.error}` : "Unknown error"
      };
    }
    return o.recompilePass(r, a);
  }), n.setUniformHandler && n.setUniformHandler((r, a) => {
    const o = s.getEngine();
    o && o.setUniformValue(r, a);
  }), s.hasErrors() || s.start(), Ae(s, () => {
    s.dispose(), n.dispose();
  });
}
function Lt(i, e, t) {
  const n = e.views.map((o) => o.name), s = St(e.viewLayout, {
    container: i,
    project: e,
    viewNames: n
  }), r = new q({
    container: s.getWrapperElement(),
    project: e,
    pixelRatio: t,
    viewContainers: s.getCanvasContainers(),
    skipPlaybackControls: !0,
    skipUniformsPanel: !0
  }), a = new bt({
    wrapper: s.getWrapperElement(),
    onTogglePlayPause: () => r.togglePlayPause(),
    onReset: () => r.reset(),
    getPaused: () => r.getPaused(),
    onSetUniformValue: (o, c) => r.setUniformValue(o, c),
    uniforms: e.uniforms
  });
  return r.hasErrors() || r.start(), Ae(r, () => {
    a.dispose(), r.dispose(), s.dispose();
  });
}
function ae(i) {
  return i === "Image" || i === "BufferA" || i === "BufferB" || i === "BufferC" || i === "BufferD";
}
function Pt(i) {
  switch (i) {
    case "Image":
      return "image.glsl";
    case "BufferA":
      return "bufferA.glsl";
    case "BufferB":
      return "bufferB.glsl";
    case "BufferC":
      return "bufferC.glsl";
    case "BufferD":
      return "bufferD.glsl";
  }
}
function Le(i) {
  return typeof i == "string" ? ae(i) ? { buffer: i } : i === "keyboard" ? { keyboard: !0 } : i === "audio" ? { audio: !0 } : i === "webcam" ? { webcam: !0 } : { texture: i } : i;
}
const ie = ["Image", "BufferA", "BufferB", "BufferC", "BufferD"], kt = ["BufferA", "BufferB", "BufferC", "BufferD"], Pe = ["iChannel0", "iChannel1", "iChannel2", "iChannel3"], Dt = "default", Ut = !0, Mt = "light", Bt = /* @__PURE__ */ new Set([
  "iResolution",
  "iTime",
  "iTimeDelta",
  "iFrame",
  "iMouse",
  "iDate",
  "iFrameRate",
  "iChannelResolution",
  "iChannel0",
  "iChannel1",
  "iChannel2",
  "iChannel3",
  "iTouchCount",
  "iTouch0",
  "iTouch1",
  "iTouch2",
  "iPinch",
  "iPinchDelta",
  "iPinchCenter"
]), Nt = /^[a-zA-Z_][a-zA-Z0-9_]*$/, It = /* @__PURE__ */ new Set([
  "attribute",
  "const",
  "uniform",
  "varying",
  "break",
  "continue",
  "do",
  "for",
  "while",
  "if",
  "else",
  "in",
  "out",
  "inout",
  "float",
  "int",
  "void",
  "bool",
  "true",
  "false",
  "discard",
  "return",
  "mat2",
  "mat3",
  "mat4",
  "vec2",
  "vec3",
  "vec4",
  "ivec2",
  "ivec3",
  "ivec4",
  "bvec2",
  "bvec3",
  "bvec4",
  "sampler2D",
  "samplerCube",
  "struct",
  "precision",
  "highp",
  "mediump",
  "lowp",
  "layout",
  "centroid",
  "flat",
  "smooth",
  "noperspective",
  "switch",
  "case",
  "default"
]);
function G(i) {
  return Nt.test(i) && !It.has(i);
}
const Te = /* @__PURE__ */ new Set(["fullscreen", "default", "split", "tabbed"]), be = /* @__PURE__ */ new Set(["light", "dark", "system"]), Ot = /* @__PURE__ */ new Set([
  "mode",
  "title",
  "author",
  "description",
  "layout",
  "theme",
  "controls",
  "common",
  "startPaused",
  "pixelRatio",
  "uniforms",
  "buffers",
  "textures",
  "Image",
  "BufferA",
  "BufferB",
  "BufferC",
  "BufferD",
  "views"
  // multi-view projects
]), $t = /* @__PURE__ */ new Set(["source", "iChannel0", "iChannel1", "iChannel2", "iChannel3"]), ye = /* @__PURE__ */ new Set(["keyboard", "audio", "webcam"]);
function Ht(i, e) {
  const t = [], n = [];
  for (const r of Object.keys(i))
    Ot.has(r) || t.push(`Unknown config key '${r}'`);
  if (i.layout !== void 0 && !Te.has(i.layout) && n.push(`Invalid layout '${i.layout}'. Expected one of: ${[...Te].join(", ")}`), i.theme !== void 0 && !be.has(i.theme) && n.push(`Invalid theme '${i.theme}'. Expected one of: ${[...be].join(", ")}`), i.uniforms && typeof i.uniforms == "object")
    for (const r of Object.keys(i.uniforms))
      Bt.has(r) && n.push(`Uniform name '${r}' is reserved (built-in uniform)`), G(r) || n.push(`Uniform name '${r}' is not a valid GLSL identifier`);
  const s = /* @__PURE__ */ new Set();
  if (i.buffers) {
    const r = Object.keys(i.buffers);
    for (const a of r) {
      if (typeof a != "string") {
        n.push(`Buffer name must be a string, got ${typeof a}`);
        continue;
      }
      G(a) || n.push(`Buffer name '${a}' is not a valid GLSL identifier`), s.add(a);
    }
  }
  if (i.textures && typeof i.textures == "object")
    for (const [r, a] of Object.entries(i.textures))
      G(r) || n.push(`Texture name '${r}' is not a valid GLSL identifier`), s.has(r) && n.push(`Texture name '${r}' collides with a buffer name`), typeof a != "string" ? n.push(`Texture source for '${r}' must be a string`) : !ye.has(a) && !/\.\w+$/.test(a) && !G(a) && n.push(`Invalid texture source '${a}' for '${r}'. Expected a file path with extension, a script texture name, or one of: ${[...ye].join(", ")}`);
  for (const r of ie) {
    const a = i[r];
    if (!(!a || typeof a != "object")) {
      for (const o of Object.keys(a))
        $t.has(o) || t.push(`Unknown key '${o}' in pass '${r}'`);
      for (const o of Pe) {
        const c = a[o];
        c && typeof c == "string" && ae(c) && c !== "Image" && !i[c] && t.push(`${r}.${o} references '${c}' but no ${c} pass is configured`);
      }
    }
  }
  for (const r of t) console.warn(`[config] ${e}: ${r}`);
  if (n.length > 0)
    throw new Error(
      `Config validation failed for '${e}':
${n.map((r) => `  - ${r}`).join(`
`)}`
    );
}
function Z(i) {
  return {
    mode: i.mode,
    root: i.root,
    meta: {
      title: i.title ?? i.root.split("/").pop() ?? "Untitled",
      author: i.author ?? null,
      description: i.description ?? null
    },
    layout: i.layout ?? Dt,
    theme: i.theme ?? Mt,
    controls: i.controls ?? Ut,
    startPaused: i.startPaused ?? !1,
    pixelRatio: i.pixelRatio ?? null,
    commonSource: i.commonSource,
    passes: i.passes,
    textures: i.textures ?? [],
    uniforms: i.uniforms ?? {},
    script: i.script ?? null
  };
}
const we = /* @__PURE__ */ new Set(["float", "int", "bool", "vec2", "vec3", "vec4"]), xe = /* @__PURE__ */ new Set(["float", "vec2", "vec3", "vec4", "mat3", "mat4"]), Vt = {
  vec2: 2,
  vec3: 3,
  vec4: 4
};
function Xt(i, e) {
  for (const [t, n] of Object.entries(i)) {
    const s = `Uniform '${t}' in '${e}'`;
    if (!n.type)
      throw new Error(`${s}: missing 'type' field`);
    if (L(n)) {
      if (!xe.has(n.type))
        throw new Error(`${s}: invalid array type '${n.type}'. Expected one of: ${[...xe].join(", ")}`);
      if (typeof n.count != "number" || n.count < 1 || !Number.isInteger(n.count))
        throw new Error(`${s}: 'count' must be a positive integer, got ${n.count}`);
      continue;
    }
    const r = n;
    if (!we.has(r.type))
      throw new Error(`${s}: invalid type '${r.type}'. Expected one of: ${[...we].join(", ")}`);
    switch (r.type) {
      case "float":
      case "int":
        if (typeof r.value != "number")
          throw new Error(`${s}: 'value' must be a number for type '${r.type}', got ${typeof r.value}`);
        if (r.min !== void 0 && typeof r.min != "number")
          throw new Error(`${s}: 'min' must be a number`);
        if (r.max !== void 0 && typeof r.max != "number")
          throw new Error(`${s}: 'max' must be a number`);
        if (r.step !== void 0 && typeof r.step != "number")
          throw new Error(`${s}: 'step' must be a number`);
        break;
      case "bool":
        if (typeof r.value != "boolean")
          throw new Error(`${s}: 'value' must be a boolean for type 'bool', got ${typeof r.value}`);
        break;
      case "vec2":
      case "vec3":
      case "vec4": {
        const a = Vt[r.type];
        if (!Array.isArray(r.value) || r.value.length !== a)
          throw new Error(`${s}: 'value' must be an array of ${a} numbers for type '${r.type}'`);
        if (r.value.some((c) => typeof c != "number"))
          throw new Error(`${s}: all components of 'value' must be numbers`);
        const o = r;
        for (const c of ["min", "max", "step"]) {
          const u = o[c];
          if (u !== void 0 && (!Array.isArray(u) || u.length !== a))
            throw new Error(`${s}: '${c}' must be an array of ${a} numbers for type '${r.type}'`);
        }
        break;
      }
    }
  }
}
async function ke(i, e, t) {
  if (t) {
    const s = i.joinPath(e, t);
    if (!await i.exists(s))
      throw new Error(`Common GLSL file '${t}' not found in '${e}'.`);
    return await i.readText(s);
  }
  const n = i.joinPath(e, "common.glsl");
  return await i.exists(n) ? await i.readText(n) : null;
}
class De {
  constructor() {
    l(this, "map", /* @__PURE__ */ new Map());
  }
  register(e, t = "linear", n = "repeat", s) {
    const r = `${e}|${t}|${n}`, a = this.map.get(r);
    if (a) return a.name;
    const o = `tex${this.map.size}`;
    return this.map.set(r, { name: o, filename: s, source: e, filter: t, wrap: n }), o;
  }
  toArray() {
    return Array.from(this.map.values());
  }
}
function jt(i, e, t, n, s, r) {
  if ("buffer" in i) {
    const a = i.buffer;
    if (!ae(a))
      throw new Error(`Invalid buffer name '${a}' for ${t} in pass '${e}' at '${n}'.`);
    return { kind: "buffer", buffer: a, current: !!i.current };
  }
  if ("texture" in i)
    return { kind: "texture", name: (r == null ? void 0 : r.get(i.texture)) ?? s.register(i.texture, i.filter, i.wrap), cubemap: i.type === "cubemap" };
  if ("keyboard" in i) return { kind: "keyboard" };
  if ("audio" in i) return { kind: "audio" };
  if ("webcam" in i) return { kind: "webcam" };
  if ("video" in i) return { kind: "video", src: i.video };
  if ("script" in i) return { kind: "script", name: i.script };
  throw new Error(`Invalid channel object for ${t} in pass '${e}' at '${n}'.`);
}
function W(i, e, t, n, s, r) {
  if (!i) return { kind: "none" };
  const a = Le(i);
  return a ? jt(a, e, t, n, s, r) : { kind: "none" };
}
async function Kt(i, e, t) {
  let n = t == null ? void 0 : t.config;
  if (n === void 0) {
    const s = i.joinPath(e, "config.json");
    if (await i.exists(s)) {
      const r = await i.readText(s);
      try {
        n = JSON.parse(r);
      } catch (a) {
        throw new Error(`Invalid JSON in config.json at '${e}': ${(a == null ? void 0 : a.message) ?? String(a)}`);
      }
    }
  }
  return n ? (Ht(n, e), n.mode === "shadertoy" ? zt(i, e, n, t) : Gt(i, e, n, t)) : Yt(i, e, t);
}
async function Yt(i, e, t) {
  const n = i.joinPath(e, "image.glsl");
  if (!await i.exists(n))
    throw new Error(`Single-pass project at '${e}' requires 'image.glsl'.`);
  const s = await i.listGlslFiles(e);
  if (s.length > 0 && s.filter((u) => u !== "image.glsl").length > 0)
    throw new Error(
      `Project at '${e}' contains multiple GLSL files (${s.join(", ")}) but no 'config.json'. Add a config file to use multiple passes.`
    );
  if (await i.hasFiles(i.joinPath(e, "textures")))
    throw new Error(
      `Project at '${e}' uses textures (in 'textures/' folder) but has no 'config.json'. Add a config file to define texture bindings.`
    );
  const a = await i.readText(n);
  return Z({
    mode: "standard",
    root: e,
    commonSource: null,
    passes: {
      Image: { name: "Image", glslSource: a, channels: [{ kind: "none" }, { kind: "none" }, { kind: "none" }, { kind: "none" }] }
    },
    script: t == null ? void 0 : t.script
  });
}
async function zt(i, e, t, n) {
  const s = {
    Image: t.Image,
    BufferA: t.BufferA,
    BufferB: t.BufferB,
    BufferC: t.BufferC,
    BufferD: t.BufferD
  };
  s.Image || s.BufferA || s.BufferB || s.BufferC || s.BufferD || (s.Image = {});
  const a = await ke(i, e, t.common), o = new De(), c = /* @__PURE__ */ new Map();
  if (n != null && n.textureUrlResolver)
    for (const d of ie) {
      const h = s[d];
      if (h)
        for (const T of Pe) {
          const _ = h[T];
          if (!_) continue;
          const y = Le(_);
          if (y && "texture" in y && !c.has(y.texture)) {
            const b = await n.textureUrlResolver(y.texture), w = y.texture.split("/").pop(), R = o.register(b, y.filter, y.wrap, w);
            c.set(y.texture, R);
          }
        }
    }
  const u = {};
  for (const d of ie) {
    const h = s[d];
    if (!h) continue;
    const T = h.source ?? Pt(d), _ = i.joinPath(e, T);
    if (!await i.exists(_))
      throw new Error(`Source GLSL file for pass '${d}' not found at '${T}' in '${e}'.`);
    const y = await i.readText(_), b = [
      W(h.iChannel0, d, "iChannel0", e, o, c),
      W(h.iChannel1, d, "iChannel1", e, o, c),
      W(h.iChannel2, d, "iChannel2", e, o, c),
      W(h.iChannel3, d, "iChannel3", e, o, c)
    ];
    u[d] = { name: d, glslSource: y, channels: b };
  }
  if (!u.Image)
    throw new Error(`config.json at '${e}' must define an Image pass.`);
  return Z({
    mode: "shadertoy",
    root: e,
    title: t.title,
    author: t.author,
    description: t.description,
    layout: t.layout,
    theme: t.theme,
    controls: t.controls,
    startPaused: t.startPaused,
    pixelRatio: t.pixelRatio,
    commonSource: a,
    passes: u,
    textures: o.toArray(),
    script: n == null ? void 0 : n.script
  });
}
async function Gt(i, e, t, n) {
  t.uniforms && Xt(t.uniforms, e);
  const s = await ke(i, e, t.common), r = t.buffers ?? {};
  if (Object.keys(r).length > 0 || t.textures && Object.keys(t.textures).length > 0)
    return qt(i, e, t, s, n);
  const a = i.joinPath(e, "image.glsl");
  if (!await i.exists(a))
    throw new Error(`Standard mode project at '${e}' requires 'image.glsl'.`);
  const o = await i.readText(a), c = [{ kind: "none" }, { kind: "none" }, { kind: "none" }, { kind: "none" }];
  return Z({
    mode: "standard",
    root: e,
    title: t.title,
    author: t.author,
    description: t.description,
    layout: t.layout,
    theme: t.theme,
    controls: t.controls,
    startPaused: t.startPaused,
    pixelRatio: t.pixelRatio,
    commonSource: s,
    passes: {
      Image: { name: "Image", glslSource: o, channels: c }
    },
    uniforms: t.uniforms,
    script: n == null ? void 0 : n.script
  });
}
const Wt = /* @__PURE__ */ new Set(["keyboard", "audio", "webcam"]);
async function qt(i, e, t, n, s) {
  const r = t.buffers ?? {}, a = Object.keys(r);
  if (a.length > 4)
    throw new Error(
      `Standard mode at '${e}' supports max 4 buffers, got ${a.length}: ${a.join(", ")}`
    );
  const o = /* @__PURE__ */ new Map();
  for (let y = 0; y < a.length; y++)
    o.set(a[y], kt[y]);
  const c = new De(), u = /* @__PURE__ */ new Map();
  for (const [y, b] of o)
    u.set(y, { kind: "buffer", buffer: b, current: !1 });
  for (const [y, b] of Object.entries(t.textures ?? {}))
    if (b === "keyboard")
      u.set(y, { kind: "keyboard" });
    else if (b === "audio")
      u.set(y, { kind: "audio" });
    else if (b === "webcam")
      u.set(y, { kind: "webcam" });
    else if (/\.\w+$/.test(b)) {
      let w;
      s != null && s.textureUrlResolver ? w = await s.textureUrlResolver(b) : w = b;
      const R = c.register(w);
      u.set(y, { kind: "texture", name: R, cubemap: !1 });
    } else Wt.has(b) || u.set(y, { kind: "script", name: b });
  const d = [{ kind: "none" }, { kind: "none" }, { kind: "none" }, { kind: "none" }], h = i.joinPath(e, "image.glsl");
  if (!await i.exists(h))
    throw new Error(`Standard mode project at '${e}' requires 'image.glsl'.`);
  const _ = {
    Image: {
      name: "Image",
      glslSource: await i.readText(h),
      channels: d,
      namedSamplers: new Map(u)
    }
  };
  for (const [y, b] of o) {
    const w = i.joinPath(e, `${y}.glsl`);
    if (!await i.exists(w))
      throw new Error(`Buffer '${y}' requires '${y}.glsl' in '${e}'.`);
    const R = await i.readText(w);
    _[b] = {
      name: b,
      glslSource: R,
      channels: d,
      namedSamplers: new Map(u)
    };
  }
  return Z({
    mode: "standard",
    root: e,
    title: t.title,
    author: t.author,
    description: t.description,
    layout: t.layout,
    theme: t.theme,
    controls: t.controls,
    startPaused: t.startPaused,
    pixelRatio: t.pixelRatio,
    commonSource: n,
    passes: _,
    textures: c.toArray(),
    uniforms: t.uniforms,
    script: s == null ? void 0 : s.script
  });
}
function Zt(i) {
  const e = /* @__PURE__ */ new Map();
  function t(s) {
    const r = s.replace(/^\.\//, "");
    return new URL(r, i).href;
  }
  function n(s) {
    const r = t(s);
    let a = e.get(r);
    return a || (a = fetch(r).then(
      (o) => o.ok ? o.text() : null,
      () => null
    ), e.set(r, a)), a;
  }
  return {
    async exists(s) {
      return await n(s) !== null;
    },
    async readText(s) {
      const r = await n(s);
      if (r === null)
        throw new Error(`File not found: ${t(s)}`);
      return r;
    },
    async resolveImageUrl(s) {
      return t(s);
    },
    async listGlslFiles() {
      return [];
    },
    async hasFiles() {
      return !1;
    },
    joinPath(...s) {
      return s.map((r, a) => a === 0 ? r : r.replace(/^\/+/, "")).join("/").replace(/\/+/g, "/");
    },
    baseName(s) {
      return s.split("/").pop() || s;
    }
  };
}
async function Jt(i) {
  try {
    const t = await import(new URL("script.js", i).href), n = {};
    return typeof t.setup == "function" && (n.setup = t.setup), typeof t.onFrame == "function" && (n.onFrame = t.onFrame), n.setup || n.onFrame ? n : null;
  } catch {
    return null;
  }
}
async function Ue(i, e, t) {
  const n = e.endsWith("/") ? e : e + "/", s = Zt(n), r = await Jt(n), o = await Kt(s, ".", {
    script: r,
    textureUrlResolver: async (c) => new URL(c, n).href
  });
  return Ft(i, {
    project: o,
    styled: (t == null ? void 0 : t.styled) ?? !0,
    pixelRatio: t == null ? void 0 : t.pixelRatio,
    layout: t == null ? void 0 : t.layout,
    controls: t == null ? void 0 : t.controls,
    theme: t == null ? void 0 : t.theme,
    startPaused: t == null ? void 0 : t.startPaused
  });
}
async function ln(i, e) {
  const t = e == null ? void 0 : e.shaderSrc;
  if (!t)
    throw new Error(
      'shader-sandbox runtime: "shaderSrc" option is required. Use <shader-sandbox src="..."> or pass shaderSrc in options.'
    );
  return Ue(i, t, e);
}
const Qt = /* @__PURE__ */ new Set(["src", "fullpage", "lazy", "style", "class", "id", "slot", "is"]);
function en(i) {
  return i.replace(/-([a-z])/g, (e, t) => t.toUpperCase());
}
function tn(i) {
  if (i === "true") return !0;
  if (i === "false") return !1;
  const e = Number(i);
  return i !== "" && !isNaN(e) ? e : i;
}
class nn extends HTMLElement {
  constructor() {
    super(...arguments);
    l(this, "_handle", null);
    l(this, "_observer", null);
    l(this, "_unmountTimer", null);
    l(this, "_mounted", !1);
  }
  connectedCallback() {
    if (!this.getAttribute("src")) {
      console.error('<shader-sandbox>: missing "src" attribute');
      return;
    }
    this.hasAttribute("fullpage") ? Object.assign(this.style, {
      display: "block",
      width: "100vw",
      height: "100vh",
      position: "fixed",
      top: "0",
      left: "0"
    }) : (!this.style.display || this.style.display === "inline") && (this.style.display = "block"), this.getAttribute("lazy") !== "false" ? (this._observer = new IntersectionObserver(
      (s) => {
        s[0].isIntersecting ? (this._unmountTimer !== null && (clearTimeout(this._unmountTimer), this._unmountTimer = null), this._mounted || this._mountShader()) : this._mounted && (this._unmountTimer = setTimeout(() => {
          this._unmountTimer = null, this._unmountShader();
        }, 1e3));
      },
      { rootMargin: "200px" }
    ), this._observer.observe(this)) : this._mountShader();
  }
  disconnectedCallback() {
    var t;
    this._unmountTimer !== null && (clearTimeout(this._unmountTimer), this._unmountTimer = null), (t = this._observer) == null || t.disconnect(), this._observer = null, this._unmountShader();
  }
  _buildOptions() {
    const t = {};
    for (const n of this.attributes)
      Qt.has(n.name) || (t[en(n.name)] = tn(n.value));
    return t;
  }
  async _mountShader() {
    if (this._mounted) return;
    this._mounted = !0;
    const t = this.getAttribute("src");
    try {
      this._handle = await Ue(this, t, this._buildOptions());
    } catch (n) {
      console.error("<shader-sandbox>: failed to load shader", n), this._mounted = !1;
    }
  }
  _unmountShader() {
    var t;
    this._mounted && ((t = this._handle) == null || t.destroy(), this._handle = null, this._mounted = !1);
  }
}
customElements.define("shader-sandbox", nn);
class sn {
  constructor(e, t) {
    l(this, "container");
    l(this, "project");
    l(this, "recompileHandler", null);
    l(this, "tabBar");
    l(this, "contentArea");
    l(this, "copyButton");
    l(this, "recompileButton");
    l(this, "errorDisplay");
    l(this, "tabs", []);
    l(this, "activeTabIndex", 0);
    // Editor instance (null if not in editor mode or viewing image)
    l(this, "editorInstance", null);
    // Track modified sources (passName -> modified source)
    l(this, "modifiedSources", /* @__PURE__ */ new Map());
    // Stored for cleanup in dispose()
    l(this, "keydownHandler", null);
    this.container = e, this.project = t, this.buildTabs(), this.tabBar = document.createElement("div"), this.tabBar.className = "editor-tab-bar", this.buildTabBar(), this.contentArea = document.createElement("div"), this.contentArea.className = "editor-content-area", this.copyButton = document.createElement("button"), this.copyButton.className = "editor-copy-button", this.copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" opacity="0.4"/>
        <path d="M2 5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2zm0 1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
      </svg>
    `, this.copyButton.title = "Copy code to clipboard", this.copyButton.addEventListener("click", () => this.copyToClipboard()), this.recompileButton = document.createElement("button"), this.recompileButton.className = "editor-recompile-button", this.recompileButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 3v10l8-5-8-5z"/>
      </svg>
      Recompile
    `, this.recompileButton.title = "Recompile shader (Ctrl+Enter)", this.recompileButton.addEventListener("click", () => this.recompile()), this.errorDisplay = document.createElement("div"), this.errorDisplay.className = "editor-error-display", this.errorDisplay.style.display = "none";
    const n = document.createElement("div");
    n.className = "editor-toolbar", n.appendChild(this.tabBar), n.appendChild(this.copyButton), n.appendChild(this.recompileButton), this.container.appendChild(n), this.container.appendChild(this.contentArea), this.container.appendChild(this.errorDisplay), this.setupKeyboardShortcut(), this.showTab(0);
  }
  setRecompileHandler(e) {
    this.recompileHandler = e;
  }
  dispose() {
    this.keydownHandler && (this.container.removeEventListener("keydown", this.keydownHandler), this.keydownHandler = null), this.editorInstance && (this.editorInstance.destroy(), this.editorInstance = null), this.container.innerHTML = "";
  }
  buildTabs() {
    this.tabs = [], this.project.commonSource && this.tabs.push({
      kind: "code",
      name: "common.glsl",
      passName: "common",
      source: this.project.commonSource
    });
    const e = [
      "BufferA",
      "BufferB",
      "BufferC",
      "BufferD"
    ];
    for (const n of e) {
      const s = this.project.passes[n];
      s && this.tabs.push({
        kind: "code",
        name: `${n.toLowerCase()}.glsl`,
        passName: n,
        source: s.glslSource
      });
    }
    const t = this.project.passes.Image;
    this.tabs.push({
      kind: "code",
      name: "image.glsl",
      passName: "Image",
      source: t.glslSource
    });
    for (const n of this.project.textures)
      this.tabs.push({
        kind: "image",
        name: n.filename || n.name,
        url: n.source
      });
  }
  buildTabBar() {
    this.tabBar.innerHTML = "", this.tabs.forEach((e, t) => {
      const n = document.createElement("button");
      n.className = "editor-tab-button", e.kind === "image" && n.classList.add("image-tab"), n.textContent = e.name, t === this.activeTabIndex && n.classList.add("active"), n.addEventListener("click", () => this.showTab(t)), this.tabBar.appendChild(n);
    });
  }
  async showTab(e) {
    this.saveCurrentEditorContent(), this.activeTabIndex = e;
    const t = this.tabs[e];
    if (this.tabBar.querySelectorAll(".editor-tab-button").forEach((n, s) => {
      n.classList.toggle("active", s === e);
    }), this.editorInstance && (this.editorInstance.destroy(), this.editorInstance = null), this.contentArea.innerHTML = "", t.kind === "code") {
      this.copyButton.style.display = "", this.recompileButton.style.display = "";
      const n = this.modifiedSources.get(t.passName) ?? t.source, s = document.createElement("div");
      s.className = "editor-prism-container", this.contentArea.appendChild(s);
      try {
        const { createEditor: r } = await Promise.resolve().then(() => Be);
        this.editorInstance = r(s, n, (a) => {
          this.modifiedSources.set(t.passName, a);
        });
      } catch (r) {
        console.error("Failed to load editor:", r);
        const a = document.createElement("textarea");
        a.className = "editor-fallback-textarea", a.value = n, a.addEventListener("input", () => {
          this.modifiedSources.set(t.passName, a.value);
        }), s.appendChild(a);
      }
    } else {
      this.copyButton.style.display = "none", this.recompileButton.style.display = "none";
      const n = document.createElement("div");
      n.className = "editor-image-viewer";
      const s = document.createElement("img");
      s.src = t.url, s.alt = t.name, n.appendChild(s), this.contentArea.appendChild(n);
    }
  }
  saveCurrentEditorContent() {
    if (this.editorInstance) {
      const e = this.tabs[this.activeTabIndex];
      if (e.kind === "code") {
        const t = this.editorInstance.getSource();
        this.modifiedSources.set(e.passName, t);
      }
    }
  }
  recompile() {
    if (!this.recompileHandler) {
      console.warn("No recompile handler set");
      return;
    }
    this.saveCurrentEditorContent();
    const e = this.tabs[this.activeTabIndex];
    if (e.kind !== "code")
      return;
    const t = this.modifiedSources.get(e.passName) ?? e.source, n = this.recompileHandler(e.passName, t);
    n.success ? (this.hideError(), e.source = t) : this.showError(n.error || "Compilation failed");
  }
  showError(e) {
    this.errorDisplay.textContent = e, this.errorDisplay.style.display = "block";
  }
  hideError() {
    this.errorDisplay.style.display = "none";
  }
  async copyToClipboard() {
    const e = this.tabs[this.activeTabIndex];
    if (e.kind !== "code") return;
    const t = this.editorInstance ? this.editorInstance.getSource() : this.modifiedSources.get(e.passName) ?? e.source;
    try {
      await navigator.clipboard.writeText(t);
      const n = this.copyButton.innerHTML;
      this.copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
        </svg>
      `, this.copyButton.classList.add("copied"), setTimeout(() => {
        this.copyButton.innerHTML = n, this.copyButton.classList.remove("copied");
      }, 1500);
    } catch (n) {
      console.error("Failed to copy:", n);
    }
  }
  setupKeyboardShortcut() {
    this.keydownHandler = (e) => {
      (e.ctrlKey || e.metaKey) && e.key === "Enter" && (e.preventDefault(), this.recompile());
    }, this.container.addEventListener("keydown", this.keydownHandler);
  }
}
const rn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EditorPanel: sn
}, Symbol.toStringTag, { value: "Module" }));
var _e = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, Me = { exports: {} };
(function(i) {
  var e = typeof window < "u" ? window : typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope ? self : {};
  /**
   * Prism: Lightweight, robust, elegant syntax highlighting
   *
   * @license MIT <https://opensource.org/licenses/MIT>
   * @author Lea Verou <https://lea.verou.me>
   * @namespace
   * @public
   */
  var t = function(n) {
    var s = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, r = 0, a = {}, o = {
      /**
       * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
       * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
       * additional languages or plugins yourself.
       *
       * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
       *
       * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.manual = true;
       * // add a new <script> to load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      manual: n.Prism && n.Prism.manual,
      /**
       * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
       * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
       * own worker, you don't want it to do this.
       *
       * By setting this value to `true`, Prism will not add its own listeners to the worker.
       *
       * You obviously have to change this value before Prism executes. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.disableWorkerMessageHandler = true;
       * // Load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      disableWorkerMessageHandler: n.Prism && n.Prism.disableWorkerMessageHandler,
      /**
       * A namespace for utility methods.
       *
       * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
       * change or disappear at any time.
       *
       * @namespace
       * @memberof Prism
       */
      util: {
        encode: function p(m) {
          return m instanceof c ? new c(m.type, p(m.content), m.alias) : Array.isArray(m) ? m.map(p) : m.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
        },
        /**
         * Returns the name of the type of the given value.
         *
         * @param {any} o
         * @returns {string}
         * @example
         * type(null)      === 'Null'
         * type(undefined) === 'Undefined'
         * type(123)       === 'Number'
         * type('foo')     === 'String'
         * type(true)      === 'Boolean'
         * type([1, 2])    === 'Array'
         * type({})        === 'Object'
         * type(String)    === 'Function'
         * type(/abc+/)    === 'RegExp'
         */
        type: function(p) {
          return Object.prototype.toString.call(p).slice(8, -1);
        },
        /**
         * Returns a unique number for the given object. Later calls will still return the same number.
         *
         * @param {Object} obj
         * @returns {number}
         */
        objId: function(p) {
          return p.__id || Object.defineProperty(p, "__id", { value: ++r }), p.__id;
        },
        /**
         * Creates a deep clone of the given object.
         *
         * The main intended use of this function is to clone language definitions.
         *
         * @param {T} o
         * @param {Record<number, any>} [visited]
         * @returns {T}
         * @template T
         */
        clone: function p(m, g) {
          g = g || {};
          var f, E;
          switch (o.util.type(m)) {
            case "Object":
              if (E = o.util.objId(m), g[E])
                return g[E];
              f = /** @type {Record<string, any>} */
              {}, g[E] = f;
              for (var x in m)
                m.hasOwnProperty(x) && (f[x] = p(m[x], g));
              return (
                /** @type {any} */
                f
              );
            case "Array":
              return E = o.util.objId(m), g[E] ? g[E] : (f = [], g[E] = f, /** @type {Array} */
              /** @type {any} */
              m.forEach(function(S, v) {
                f[v] = p(S, g);
              }), /** @type {any} */
              f);
            default:
              return m;
          }
        },
        /**
         * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
         *
         * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
         *
         * @param {Element} element
         * @returns {string}
         */
        getLanguage: function(p) {
          for (; p; ) {
            var m = s.exec(p.className);
            if (m)
              return m[1].toLowerCase();
            p = p.parentElement;
          }
          return "none";
        },
        /**
         * Sets the Prism `language-xxxx` class of the given element.
         *
         * @param {Element} element
         * @param {string} language
         * @returns {void}
         */
        setLanguage: function(p, m) {
          p.className = p.className.replace(RegExp(s, "gi"), ""), p.classList.add("language-" + m);
        },
        /**
         * Returns the script element that is currently executing.
         *
         * This does __not__ work for line script element.
         *
         * @returns {HTMLScriptElement | null}
         */
        currentScript: function() {
          if (typeof document > "u")
            return null;
          if (document.currentScript && document.currentScript.tagName === "SCRIPT")
            return (
              /** @type {any} */
              document.currentScript
            );
          try {
            throw new Error();
          } catch (f) {
            var p = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(f.stack) || [])[1];
            if (p) {
              var m = document.getElementsByTagName("script");
              for (var g in m)
                if (m[g].src == p)
                  return m[g];
            }
            return null;
          }
        },
        /**
         * Returns whether a given class is active for `element`.
         *
         * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
         * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
         * given class is just the given class with a `no-` prefix.
         *
         * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
         * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
         * ancestors have the given class or the negated version of it, then the default activation will be returned.
         *
         * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
         * version of it, the class is considered active.
         *
         * @param {Element} element
         * @param {string} className
         * @param {boolean} [defaultActivation=false]
         * @returns {boolean}
         */
        isActive: function(p, m, g) {
          for (var f = "no-" + m; p; ) {
            var E = p.classList;
            if (E.contains(m))
              return !0;
            if (E.contains(f))
              return !1;
            p = p.parentElement;
          }
          return !!g;
        }
      },
      /**
       * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
       *
       * @namespace
       * @memberof Prism
       * @public
       */
      languages: {
        /**
         * The grammar for plain, unformatted text.
         */
        plain: a,
        plaintext: a,
        text: a,
        txt: a,
        /**
         * Creates a deep copy of the language with the given id and appends the given tokens.
         *
         * If a token in `redef` also appears in the copied language, then the existing token in the copied language
         * will be overwritten at its original position.
         *
         * ## Best practices
         *
         * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
         * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
         * understand the language definition because, normally, the order of tokens matters in Prism grammars.
         *
         * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
         * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
         *
         * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
         * @param {Grammar} redef The new tokens to append.
         * @returns {Grammar} The new language created.
         * @public
         * @example
         * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
         *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
         *     // at its original position
         *     'comment': { ... },
         *     // CSS doesn't have a 'color' token, so this token will be appended
         *     'color': /\b(?:red|green|blue)\b/
         * });
         */
        extend: function(p, m) {
          var g = o.util.clone(o.languages[p]);
          for (var f in m)
            g[f] = m[f];
          return g;
        },
        /**
         * Inserts tokens _before_ another token in a language definition or any other grammar.
         *
         * ## Usage
         *
         * This helper method makes it easy to modify existing languages. For example, the CSS language definition
         * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
         * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
         * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
         * this:
         *
         * ```js
         * Prism.languages.markup.style = {
         *     // token
         * };
         * ```
         *
         * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
         * before existing tokens. For the CSS example above, you would use it like this:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'cdata', {
         *     'style': {
         *         // token
         *     }
         * });
         * ```
         *
         * ## Special cases
         *
         * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
         * will be ignored.
         *
         * This behavior can be used to insert tokens after `before`:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'comment', {
         *     'comment': Prism.languages.markup.comment,
         *     // tokens after 'comment'
         * });
         * ```
         *
         * ## Limitations
         *
         * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
         * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
         * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
         * deleting properties which is necessary to insert at arbitrary positions.
         *
         * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
         * Instead, it will create a new object and replace all references to the target object with the new one. This
         * can be done without temporarily deleting properties, so the iteration order is well-defined.
         *
         * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
         * you hold the target object in a variable, then the value of the variable will not change.
         *
         * ```js
         * var oldMarkup = Prism.languages.markup;
         * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
         *
         * assert(oldMarkup !== Prism.languages.markup);
         * assert(newMarkup === Prism.languages.markup);
         * ```
         *
         * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
         * object to be modified.
         * @param {string} before The key to insert before.
         * @param {Grammar} insert An object containing the key-value pairs to be inserted.
         * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
         * object to be modified.
         *
         * Defaults to `Prism.languages`.
         * @returns {Grammar} The new grammar object.
         * @public
         */
        insertBefore: function(p, m, g, f) {
          f = f || /** @type {any} */
          o.languages;
          var E = f[p], x = {};
          for (var S in E)
            if (E.hasOwnProperty(S)) {
              if (S == m)
                for (var v in g)
                  g.hasOwnProperty(v) && (x[v] = g[v]);
              g.hasOwnProperty(S) || (x[S] = E[S]);
            }
          var C = f[p];
          return f[p] = x, o.languages.DFS(o.languages, function(A, F) {
            F === C && A != p && (this[A] = x);
          }), x;
        },
        // Traverse a language definition with Depth First Search
        DFS: function p(m, g, f, E) {
          E = E || {};
          var x = o.util.objId;
          for (var S in m)
            if (m.hasOwnProperty(S)) {
              g.call(m, S, m[S], f || S);
              var v = m[S], C = o.util.type(v);
              C === "Object" && !E[x(v)] ? (E[x(v)] = !0, p(v, g, null, E)) : C === "Array" && !E[x(v)] && (E[x(v)] = !0, p(v, g, S, E));
            }
        }
      },
      plugins: {},
      /**
       * This is the most high-level function in Prism’s API.
       * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
       * each one of them.
       *
       * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
       *
       * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
       * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
       * @memberof Prism
       * @public
       */
      highlightAll: function(p, m) {
        o.highlightAllUnder(document, p, m);
      },
      /**
       * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
       * {@link Prism.highlightElement} on each one of them.
       *
       * The following hooks will be run:
       * 1. `before-highlightall`
       * 2. `before-all-elements-highlight`
       * 3. All hooks of {@link Prism.highlightElement} for each element.
       *
       * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
       * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
       * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
       * @memberof Prism
       * @public
       */
      highlightAllUnder: function(p, m, g) {
        var f = {
          callback: g,
          container: p,
          selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
        };
        o.hooks.run("before-highlightall", f), f.elements = Array.prototype.slice.apply(f.container.querySelectorAll(f.selector)), o.hooks.run("before-all-elements-highlight", f);
        for (var E = 0, x; x = f.elements[E++]; )
          o.highlightElement(x, m === !0, f.callback);
      },
      /**
       * Highlights the code inside a single element.
       *
       * The following hooks will be run:
       * 1. `before-sanity-check`
       * 2. `before-highlight`
       * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
       * 4. `before-insert`
       * 5. `after-highlight`
       * 6. `complete`
       *
       * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
       * the element's language.
       *
       * @param {Element} element The element containing the code.
       * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
       * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
       * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
       * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
       *
       * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
       * asynchronous highlighting to work. You can build your own bundle on the
       * [Download page](https://prismjs.com/download.html).
       * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
       * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
       * @memberof Prism
       * @public
       */
      highlightElement: function(p, m, g) {
        var f = o.util.getLanguage(p), E = o.languages[f];
        o.util.setLanguage(p, f);
        var x = p.parentElement;
        x && x.nodeName.toLowerCase() === "pre" && o.util.setLanguage(x, f);
        var S = p.textContent, v = {
          element: p,
          language: f,
          grammar: E,
          code: S
        };
        function C(F) {
          v.highlightedCode = F, o.hooks.run("before-insert", v), v.element.innerHTML = v.highlightedCode, o.hooks.run("after-highlight", v), o.hooks.run("complete", v), g && g.call(v.element);
        }
        if (o.hooks.run("before-sanity-check", v), x = v.element.parentElement, x && x.nodeName.toLowerCase() === "pre" && !x.hasAttribute("tabindex") && x.setAttribute("tabindex", "0"), !v.code) {
          o.hooks.run("complete", v), g && g.call(v.element);
          return;
        }
        if (o.hooks.run("before-highlight", v), !v.grammar) {
          C(o.util.encode(v.code));
          return;
        }
        if (m && n.Worker) {
          var A = new Worker(o.filename);
          A.onmessage = function(F) {
            C(F.data);
          }, A.postMessage(JSON.stringify({
            language: v.language,
            code: v.code,
            immediateClose: !0
          }));
        } else
          C(o.highlight(v.code, v.grammar, v.language));
      },
      /**
       * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
       * and the language definitions to use, and returns a string with the HTML produced.
       *
       * The following hooks will be run:
       * 1. `before-tokenize`
       * 2. `after-tokenize`
       * 3. `wrap`: On each {@link Token}.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @param {string} language The name of the language definition passed to `grammar`.
       * @returns {string} The highlighted HTML.
       * @memberof Prism
       * @public
       * @example
       * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
       */
      highlight: function(p, m, g) {
        var f = {
          code: p,
          grammar: m,
          language: g
        };
        if (o.hooks.run("before-tokenize", f), !f.grammar)
          throw new Error('The language "' + f.language + '" has no grammar.');
        return f.tokens = o.tokenize(f.code, f.grammar), o.hooks.run("after-tokenize", f), c.stringify(o.util.encode(f.tokens), f.language);
      },
      /**
       * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
       * and the language definitions to use, and returns an array with the tokenized code.
       *
       * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
       *
       * This method could be useful in other contexts as well, as a very crude parser.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @returns {TokenStream} An array of strings and tokens, a token stream.
       * @memberof Prism
       * @public
       * @example
       * let code = `var foo = 0;`;
       * let tokens = Prism.tokenize(code, Prism.languages.javascript);
       * tokens.forEach(token => {
       *     if (token instanceof Prism.Token && token.type === 'number') {
       *         console.log(`Found numeric literal: ${token.content}`);
       *     }
       * });
       */
      tokenize: function(p, m) {
        var g = m.rest;
        if (g) {
          for (var f in g)
            m[f] = g[f];
          delete m.rest;
        }
        var E = new h();
        return T(E, E.head, p), d(p, E, m, E.head, 0), y(E);
      },
      /**
       * @namespace
       * @memberof Prism
       * @public
       */
      hooks: {
        all: {},
        /**
         * Adds the given callback to the list of callbacks for the given hook.
         *
         * The callback will be invoked when the hook it is registered for is run.
         * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
         *
         * One callback function can be registered to multiple hooks and the same hook multiple times.
         *
         * @param {string} name The name of the hook.
         * @param {HookCallback} callback The callback function which is given environment variables.
         * @public
         */
        add: function(p, m) {
          var g = o.hooks.all;
          g[p] = g[p] || [], g[p].push(m);
        },
        /**
         * Runs a hook invoking all registered callbacks with the given environment variables.
         *
         * Callbacks will be invoked synchronously and in the order in which they were registered.
         *
         * @param {string} name The name of the hook.
         * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
         * @public
         */
        run: function(p, m) {
          var g = o.hooks.all[p];
          if (!(!g || !g.length))
            for (var f = 0, E; E = g[f++]; )
              E(m);
        }
      },
      Token: c
    };
    n.Prism = o;
    function c(p, m, g, f) {
      this.type = p, this.content = m, this.alias = g, this.length = (f || "").length | 0;
    }
    c.stringify = function p(m, g) {
      if (typeof m == "string")
        return m;
      if (Array.isArray(m)) {
        var f = "";
        return m.forEach(function(C) {
          f += p(C, g);
        }), f;
      }
      var E = {
        type: m.type,
        content: p(m.content, g),
        tag: "span",
        classes: ["token", m.type],
        attributes: {},
        language: g
      }, x = m.alias;
      x && (Array.isArray(x) ? Array.prototype.push.apply(E.classes, x) : E.classes.push(x)), o.hooks.run("wrap", E);
      var S = "";
      for (var v in E.attributes)
        S += " " + v + '="' + (E.attributes[v] || "").replace(/"/g, "&quot;") + '"';
      return "<" + E.tag + ' class="' + E.classes.join(" ") + '"' + S + ">" + E.content + "</" + E.tag + ">";
    };
    function u(p, m, g, f) {
      p.lastIndex = m;
      var E = p.exec(g);
      if (E && f && E[1]) {
        var x = E[1].length;
        E.index += x, E[0] = E[0].slice(x);
      }
      return E;
    }
    function d(p, m, g, f, E, x) {
      for (var S in g)
        if (!(!g.hasOwnProperty(S) || !g[S])) {
          var v = g[S];
          v = Array.isArray(v) ? v : [v];
          for (var C = 0; C < v.length; ++C) {
            if (x && x.cause == S + "," + C)
              return;
            var A = v[C], F = A.inside, B = !!A.lookbehind, oe = !!A.greedy, Ne = A.alias;
            if (oe && !A.pattern.global) {
              var Ie = A.pattern.toString().match(/[imsuy]*$/)[0];
              A.pattern = RegExp(A.pattern.source, Ie + "g");
            }
            for (var ce = A.pattern || A, P = f.next, D = E; P !== m.tail && !(x && D >= x.reach); D += P.value.length, P = P.next) {
              var N = P.value;
              if (m.length > p.length)
                return;
              if (!(N instanceof c)) {
                var V = 1, k;
                if (oe) {
                  if (k = u(ce, D, p, B), !k || k.index >= p.length)
                    break;
                  var X = k.index, Oe = k.index + k[0].length, U = D;
                  for (U += P.value.length; X >= U; )
                    P = P.next, U += P.value.length;
                  if (U -= P.value.length, D = U, P.value instanceof c)
                    continue;
                  for (var I = P; I !== m.tail && (U < Oe || typeof I.value == "string"); I = I.next)
                    V++, U += I.value.length;
                  V--, N = p.slice(D, U), k.index -= D;
                } else if (k = u(ce, 0, N, B), !k)
                  continue;
                var X = k.index, j = k[0], J = N.slice(0, X), le = N.slice(X + j.length), Q = D + N.length;
                x && Q > x.reach && (x.reach = Q);
                var K = P.prev;
                J && (K = T(m, K, J), D += J.length), _(m, K, V);
                var $e = new c(S, F ? o.tokenize(j, F) : j, Ne, j);
                if (P = T(m, K, $e), le && T(m, P, le), V > 1) {
                  var ee = {
                    cause: S + "," + C,
                    reach: Q
                  };
                  d(p, m, g, P.prev, D, ee), x && ee.reach > x.reach && (x.reach = ee.reach);
                }
              }
            }
          }
        }
    }
    function h() {
      var p = { value: null, prev: null, next: null }, m = { value: null, prev: p, next: null };
      p.next = m, this.head = p, this.tail = m, this.length = 0;
    }
    function T(p, m, g) {
      var f = m.next, E = { value: g, prev: m, next: f };
      return m.next = E, f.prev = E, p.length++, E;
    }
    function _(p, m, g) {
      for (var f = m.next, E = 0; E < g && f !== p.tail; E++)
        f = f.next;
      m.next = f, f.prev = m, p.length -= E;
    }
    function y(p) {
      for (var m = [], g = p.head.next; g !== p.tail; )
        m.push(g.value), g = g.next;
      return m;
    }
    if (!n.document)
      return n.addEventListener && (o.disableWorkerMessageHandler || n.addEventListener("message", function(p) {
        var m = JSON.parse(p.data), g = m.language, f = m.code, E = m.immediateClose;
        n.postMessage(o.highlight(f, o.languages[g], g)), E && n.close();
      }, !1)), o;
    var b = o.util.currentScript();
    b && (o.filename = b.src, b.hasAttribute("data-manual") && (o.manual = !0));
    function w() {
      o.manual || o.highlightAll();
    }
    if (!o.manual) {
      var R = document.readyState;
      R === "loading" || R === "interactive" && b && b.defer ? document.addEventListener("DOMContentLoaded", w) : window.requestAnimationFrame ? window.requestAnimationFrame(w) : window.setTimeout(w, 16);
    }
    return o;
  }(e);
  i.exports && (i.exports = t), typeof _e < "u" && (_e.Prism = t), t.languages.markup = {
    comment: {
      pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
      greedy: !0
    },
    prolog: {
      pattern: /<\?[\s\S]+?\?>/,
      greedy: !0
    },
    doctype: {
      // https://www.w3.org/TR/xml/#NT-doctypedecl
      pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
      greedy: !0,
      inside: {
        "internal-subset": {
          pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
          lookbehind: !0,
          greedy: !0,
          inside: null
          // see below
        },
        string: {
          pattern: /"[^"]*"|'[^']*'/,
          greedy: !0
        },
        punctuation: /^<!|>$|[[\]]/,
        "doctype-tag": /^DOCTYPE/i,
        name: /[^\s<>'"]+/
      }
    },
    cdata: {
      pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
      greedy: !0
    },
    tag: {
      pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
      greedy: !0,
      inside: {
        tag: {
          pattern: /^<\/?[^\s>\/]+/,
          inside: {
            punctuation: /^<\/?/,
            namespace: /^[^\s>\/:]+:/
          }
        },
        "special-attr": [],
        "attr-value": {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: {
            punctuation: [
              {
                pattern: /^=/,
                alias: "attr-equals"
              },
              {
                pattern: /^(\s*)["']|["']$/,
                lookbehind: !0
              }
            ]
          }
        },
        punctuation: /\/?>/,
        "attr-name": {
          pattern: /[^\s>\/]+/,
          inside: {
            namespace: /^[^\s>\/:]+:/
          }
        }
      }
    },
    entity: [
      {
        pattern: /&[\da-z]{1,8};/i,
        alias: "named-entity"
      },
      /&#x?[\da-f]{1,8};/i
    ]
  }, t.languages.markup.tag.inside["attr-value"].inside.entity = t.languages.markup.entity, t.languages.markup.doctype.inside["internal-subset"].inside = t.languages.markup, t.hooks.add("wrap", function(n) {
    n.type === "entity" && (n.attributes.title = n.content.replace(/&amp;/, "&"));
  }), Object.defineProperty(t.languages.markup.tag, "addInlined", {
    /**
     * Adds an inlined language to markup.
     *
     * An example of an inlined language is CSS with `<style>` tags.
     *
     * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addInlined('style', 'css');
     */
    value: function(s, r) {
      var a = {};
      a["language-" + r] = {
        pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
        lookbehind: !0,
        inside: t.languages[r]
      }, a.cdata = /^<!\[CDATA\[|\]\]>$/i;
      var o = {
        "included-cdata": {
          pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
          inside: a
        }
      };
      o["language-" + r] = {
        pattern: /[\s\S]+/,
        inside: t.languages[r]
      };
      var c = {};
      c[s] = {
        pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
          return s;
        }), "i"),
        lookbehind: !0,
        greedy: !0,
        inside: o
      }, t.languages.insertBefore("markup", "cdata", c);
    }
  }), Object.defineProperty(t.languages.markup.tag, "addAttribute", {
    /**
     * Adds an pattern to highlight languages embedded in HTML attributes.
     *
     * An example of an inlined language is CSS with `style` attributes.
     *
     * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addAttribute('style', 'css');
     */
    value: function(n, s) {
      t.languages.markup.tag.inside["special-attr"].push({
        pattern: RegExp(
          /(^|["'\s])/.source + "(?:" + n + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
          "i"
        ),
        lookbehind: !0,
        inside: {
          "attr-name": /^[^\s=]+/,
          "attr-value": {
            pattern: /=[\s\S]+/,
            inside: {
              value: {
                pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                lookbehind: !0,
                alias: [s, "language-" + s],
                inside: t.languages[s]
              },
              punctuation: [
                {
                  pattern: /^=/,
                  alias: "attr-equals"
                },
                /"|'/
              ]
            }
          }
        }
      });
    }
  }), t.languages.html = t.languages.markup, t.languages.mathml = t.languages.markup, t.languages.svg = t.languages.markup, t.languages.xml = t.languages.extend("markup", {}), t.languages.ssml = t.languages.xml, t.languages.atom = t.languages.xml, t.languages.rss = t.languages.xml, function(n) {
    var s = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    n.languages.css = {
      comment: /\/\*[\s\S]*?\*\//,
      atrule: {
        pattern: RegExp("@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + s.source + ")*?" + /(?:;|(?=\s*\{))/.source),
        inside: {
          rule: /^@[\w-]+/,
          "selector-function-argument": {
            pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
            lookbehind: !0,
            alias: "selector"
          },
          keyword: {
            pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
            lookbehind: !0
          }
          // See rest below
        }
      },
      url: {
        // https://drafts.csswg.org/css-values-3/#urls
        pattern: RegExp("\\burl\\((?:" + s.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
        greedy: !0,
        inside: {
          function: /^url/i,
          punctuation: /^\(|\)$/,
          string: {
            pattern: RegExp("^" + s.source + "$"),
            alias: "url"
          }
        }
      },
      selector: {
        pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + s.source + ")*(?=\\s*\\{)"),
        lookbehind: !0
      },
      string: {
        pattern: s,
        greedy: !0
      },
      property: {
        pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
        lookbehind: !0
      },
      important: /!important\b/i,
      function: {
        pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
        lookbehind: !0
      },
      punctuation: /[(){};:,]/
    }, n.languages.css.atrule.inside.rest = n.languages.css;
    var r = n.languages.markup;
    r && (r.tag.addInlined("style", "css"), r.tag.addAttribute("style", "css"));
  }(t), t.languages.clike = {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: !0,
        greedy: !0
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: !0,
        greedy: !0
      }
    ],
    string: {
      pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: !0
    },
    "class-name": {
      pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
      lookbehind: !0,
      inside: {
        punctuation: /[.\\]/
      }
    },
    keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/
  }, t.languages.javascript = t.languages.extend("clike", {
    "class-name": [
      t.languages.clike["class-name"],
      {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
        lookbehind: !0
      }
    ],
    keyword: [
      {
        pattern: /((?:^|\})\s*)catch\b/,
        lookbehind: !0
      },
      {
        pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
        lookbehind: !0
      }
    ],
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    number: {
      pattern: RegExp(
        /(^|[^\w$])/.source + "(?:" + // constant
        (/NaN|Infinity/.source + "|" + // binary integer
        /0[bB][01]+(?:_[01]+)*n?/.source + "|" + // octal integer
        /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + // hexadecimal integer
        /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + // decimal bigint
        /\d+(?:_\d+)*n/.source + "|" + // decimal number (integer or float) but no bigint
        /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source
      ),
      lookbehind: !0
    },
    operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
  }), t.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/, t.languages.insertBefore("javascript", "keyword", {
    regex: {
      pattern: RegExp(
        // lookbehind
        // eslint-disable-next-line regexp/no-dupe-characters-character-class
        /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + // Regex pattern:
        // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
        // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
        // with the only syntax, so we have to define 2 different regex patterns.
        /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + // `v` flag syntax. This supports 3 levels of nested character classes.
        /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + // lookahead
        /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        "regex-source": {
          pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
          lookbehind: !0,
          alias: "language-regex",
          inside: t.languages.regex
        },
        "regex-delimiter": /^\/|\/$/,
        "regex-flags": /^[a-z]+$/
      }
    },
    // This must be declared before keyword because we use "function" inside the look-forward
    "function-variable": {
      pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
      alias: "function"
    },
    parameter: [
      {
        pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
        lookbehind: !0,
        inside: t.languages.javascript
      },
      {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
        lookbehind: !0,
        inside: t.languages.javascript
      },
      {
        pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
        lookbehind: !0,
        inside: t.languages.javascript
      },
      {
        pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
        lookbehind: !0,
        inside: t.languages.javascript
      }
    ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
  }), t.languages.insertBefore("javascript", "string", {
    hashbang: {
      pattern: /^#!.*/,
      greedy: !0,
      alias: "comment"
    },
    "template-string": {
      pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
      greedy: !0,
      inside: {
        "template-punctuation": {
          pattern: /^`|`$/,
          alias: "string"
        },
        interpolation: {
          pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
          lookbehind: !0,
          inside: {
            "interpolation-punctuation": {
              pattern: /^\$\{|\}$/,
              alias: "punctuation"
            },
            rest: t.languages.javascript
          }
        },
        string: /[\s\S]+/
      }
    },
    "string-property": {
      pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
      lookbehind: !0,
      greedy: !0,
      alias: "property"
    }
  }), t.languages.insertBefore("javascript", "operator", {
    "literal-property": {
      pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
      lookbehind: !0,
      alias: "property"
    }
  }), t.languages.markup && (t.languages.markup.tag.addInlined("script", "javascript"), t.languages.markup.tag.addAttribute(
    /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
    "javascript"
  )), t.languages.js = t.languages.javascript, function() {
    if (typeof t > "u" || typeof document > "u")
      return;
    Element.prototype.matches || (Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector);
    var n = "Loading…", s = function(b, w) {
      return "✖ Error " + b + " while fetching file: " + w;
    }, r = "✖ Error: File does not exist or is empty", a = {
      js: "javascript",
      py: "python",
      rb: "ruby",
      ps1: "powershell",
      psm1: "powershell",
      sh: "bash",
      bat: "batch",
      h: "c",
      tex: "latex"
    }, o = "data-src-status", c = "loading", u = "loaded", d = "failed", h = "pre[data-src]:not([" + o + '="' + u + '"]):not([' + o + '="' + c + '"])';
    function T(b, w, R) {
      var p = new XMLHttpRequest();
      p.open("GET", b, !0), p.onreadystatechange = function() {
        p.readyState == 4 && (p.status < 400 && p.responseText ? w(p.responseText) : p.status >= 400 ? R(s(p.status, p.statusText)) : R(r));
      }, p.send(null);
    }
    function _(b) {
      var w = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(b || "");
      if (w) {
        var R = Number(w[1]), p = w[2], m = w[3];
        return p ? m ? [R, Number(m)] : [R, void 0] : [R, R];
      }
    }
    t.hooks.add("before-highlightall", function(b) {
      b.selector += ", " + h;
    }), t.hooks.add("before-sanity-check", function(b) {
      var w = (
        /** @type {HTMLPreElement} */
        b.element
      );
      if (w.matches(h)) {
        b.code = "", w.setAttribute(o, c);
        var R = w.appendChild(document.createElement("CODE"));
        R.textContent = n;
        var p = w.getAttribute("data-src"), m = b.language;
        if (m === "none") {
          var g = (/\.(\w+)$/.exec(p) || [, "none"])[1];
          m = a[g] || g;
        }
        t.util.setLanguage(R, m), t.util.setLanguage(w, m);
        var f = t.plugins.autoloader;
        f && f.loadLanguages(m), T(
          p,
          function(E) {
            w.setAttribute(o, u);
            var x = _(w.getAttribute("data-range"));
            if (x) {
              var S = E.split(/\r\n?|\n/g), v = x[0], C = x[1] == null ? S.length : x[1];
              v < 0 && (v += S.length), v = Math.max(0, Math.min(v - 1, S.length)), C < 0 && (C += S.length), C = Math.max(0, Math.min(C, S.length)), E = S.slice(v, C).join(`
`), w.hasAttribute("data-start") || w.setAttribute("data-start", String(v + 1));
            }
            R.textContent = E, t.highlightElement(R);
          },
          function(E) {
            w.setAttribute(o, d), R.textContent = E;
          }
        );
      }
    }), t.plugins.fileHighlight = {
      /**
       * Executes the File Highlight plugin for all matching `pre` elements under the given container.
       *
       * Note: Elements which are already loaded or currently loading will not be touched by this method.
       *
       * @param {ParentNode} [container=document]
       */
      highlight: function(w) {
        for (var R = (w || document).querySelectorAll(h), p = 0, m; m = R[p++]; )
          t.highlightElement(m);
      }
    };
    var y = !1;
    t.fileHighlight = function() {
      y || (console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead."), y = !0), t.plugins.fileHighlight.highlight.apply(this, arguments);
    };
  }();
})(Me);
var an = Me.exports;
Prism.languages.c = Prism.languages.extend("clike", {
  comment: {
    pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: !0
  },
  string: {
    // https://en.cppreference.com/w/c/language/string_literal
    pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
    greedy: !0
  },
  "class-name": {
    pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
    lookbehind: !0
  },
  keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  number: /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
  operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/
});
Prism.languages.insertBefore("c", "string", {
  char: {
    // https://en.cppreference.com/w/c/language/character_constant
    pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
    greedy: !0
  }
});
Prism.languages.insertBefore("c", "string", {
  macro: {
    // allow for multiline macro definitions
    // spaces after the # character compile fine with gcc
    pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
    lookbehind: !0,
    greedy: !0,
    alias: "property",
    inside: {
      string: [
        {
          // highlight the path of the include statement as a string
          pattern: /^(#\s*include\s*)<[^>]+>/,
          lookbehind: !0
        },
        Prism.languages.c.string
      ],
      char: Prism.languages.c.char,
      comment: Prism.languages.c.comment,
      "macro-name": [
        {
          pattern: /(^#\s*define\s+)\w+\b(?!\()/i,
          lookbehind: !0
        },
        {
          pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
          lookbehind: !0,
          alias: "function"
        }
      ],
      // highlight macro directives as keywords
      directive: {
        pattern: /^(#\s*)[a-z]+/,
        lookbehind: !0,
        alias: "keyword"
      },
      "directive-hash": /^#/,
      punctuation: /##|\\(?=[\r\n])/,
      expression: {
        pattern: /\S[\s\S]*/,
        inside: Prism.languages.c
      }
    }
  }
});
Prism.languages.insertBefore("c", "function", {
  // highlight predefined macros as constants
  constant: /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/
});
delete Prism.languages.c.boolean;
(function(i) {
  var e = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/, t = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function() {
    return e.source;
  });
  i.languages.cpp = i.languages.extend("c", {
    "class-name": [
      {
        pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source.replace(/<keyword>/g, function() {
          return e.source;
        })),
        lookbehind: !0
      },
      // This is intended to capture the class name of method implementations like:
      //   void foo::bar() const {}
      // However! The `foo` in the above example could also be a namespace, so we only capture the class name if
      // it starts with an uppercase letter. This approximation should give decent results.
      /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,
      // This will capture the class name before destructors like:
      //   Foo::~Foo() {}
      /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,
      // This also intends to capture the class name of method implementations but here the class has template
      // parameters, so it can't be a namespace (until C++ adds generic namespaces).
      /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/
    ],
    keyword: e,
    number: {
      pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
      greedy: !0
    },
    operator: />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
    boolean: /\b(?:false|true)\b/
  }), i.languages.insertBefore("cpp", "string", {
    module: {
      // https://en.cppreference.com/w/cpp/language/modules
      pattern: RegExp(
        /(\b(?:import|module)\s+)/.source + "(?:" + // header-name
        /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source + "|" + // module name or partition or both
        /<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function() {
          return t;
        }) + ")"
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        string: /^[<"][\s\S]+/,
        operator: /:/,
        punctuation: /\./
      }
    },
    "raw-string": {
      pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
      alias: "string",
      greedy: !0
    }
  }), i.languages.insertBefore("cpp", "keyword", {
    "generic-function": {
      pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
      inside: {
        function: /^\w+/,
        generic: {
          pattern: /<[\s\S]+/,
          alias: "class-name",
          inside: i.languages.cpp
        }
      }
    }
  }), i.languages.insertBefore("cpp", "operator", {
    "double-colon": {
      pattern: /::/,
      alias: "punctuation"
    }
  }), i.languages.insertBefore("cpp", "class-name", {
    // the base clause is an optional list of parent classes
    // https://en.cppreference.com/w/cpp/language/class
    "base-clause": {
      pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
      lookbehind: !0,
      greedy: !0,
      inside: i.languages.extend("cpp", {})
    }
  }), i.languages.insertBefore("inside", "double-colon", {
    // All untokenized words that are not namespaces should be class names
    "class-name": /\b[a-z_]\w*\b(?!\s*::)/i
  }, i.languages.cpp["base-clause"]);
})(Prism);
function on(i, e, t) {
  const n = document.createElement("div");
  n.className = "prism-editor-wrapper";
  const s = document.createElement("div");
  s.className = "prism-editor-line-numbers";
  const r = document.createElement("div");
  r.className = "prism-editor-area";
  const a = document.createElement("textarea");
  a.className = "prism-editor-textarea", a.value = e, a.spellcheck = !1, a.autocapitalize = "off", a.autocomplete = "off";
  const o = document.createElement("pre");
  o.className = "prism-editor-highlight";
  const c = document.createElement("code");
  c.className = "language-cpp", o.appendChild(c), r.appendChild(a), r.appendChild(o), n.appendChild(s), n.appendChild(r), i.appendChild(n);
  function u() {
    const T = a.value;
    c.textContent = T + `
`, an.highlightElement(c);
    const _ = T.split(`
`);
    s.innerHTML = _.map((y, b) => `<span>${b + 1}</span>`).join(""), t && t(T);
  }
  function d() {
    o.scrollTop = a.scrollTop, o.scrollLeft = a.scrollLeft, s.scrollTop = a.scrollTop;
  }
  function h(T) {
    if (T.key === "Tab") {
      T.preventDefault();
      const _ = a.selectionStart, y = a.selectionEnd, b = a.value;
      a.value = b.substring(0, _) + "  " + b.substring(y), a.selectionStart = a.selectionEnd = _ + 2, u();
    }
  }
  return a.addEventListener("input", u), a.addEventListener("scroll", d), a.addEventListener("keydown", h), u(), {
    getSource: () => a.value,
    setSource: (T) => {
      a.value = T, u();
    },
    destroy: () => {
      a.removeEventListener("input", u), a.removeEventListener("scroll", d), a.removeEventListener("keydown", h), n.parentNode && n.parentNode.removeChild(n);
    }
  };
}
const Be = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createEditor: on
}, Symbol.toStringTag, { value: "Module" }));
export {
  Ue as loadFromFolder,
  ln as mount
};
