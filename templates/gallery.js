/**
 * Shared gallery renderer.
 *
 * Single source of truth for the shader gallery card markup and styles,
 * used by BOTH:
 *  - the dev-server gallery (main.ts, `shader dev` with no name)
 *  - the static gallery build (`shader build-gallery` in the CLI)
 *
 * Plain ESM with no dependencies so Node and Vite can both import it.
 */

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GALLERY_CSS = `
  body { background: #0a0a0f; margin: 0; }
  .gallery-container {
    min-height: 100vh;
    padding: 60px 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e0e0e0;
  }
  .gallery-title {
    text-align: center;
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 40px;
    color: #fff;
    letter-spacing: -0.5px;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .gallery-card {
    background: rgba(30, 30, 40, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 24px;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(12px);
    cursor: pointer;
  }
  .gallery-card:hover {
    transform: translateY(-2px);
    border-color: rgba(100, 140, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  .gallery-card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
    color: #fff;
  }
  .gallery-card-name {
    font-size: 12px;
    font-family: 'Monaco', 'Menlo', monospace;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 8px;
  }
  .gallery-card-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
  }
`;

/**
 * Render gallery markup (style + container) for a list of cards.
 *
 * @param {Array<{name: string, title: string, description: string}>} cards
 * @param {(card: {name: string}) => string} linkFor - href for each card
 *   (URL-encoding of `card.name` is the caller's job; text escaping is ours)
 * @returns {string} HTML fragment: <style> + .gallery-container
 */
export function renderGalleryHTML(cards, linkFor) {
  const cardHTML = cards.map(c => `
    <a class="gallery-card" href="${escapeHtml(linkFor(c))}">
      <div class="gallery-card-title">${escapeHtml(c.title)}</div>
      ${c.title !== c.name ? `<div class="gallery-card-name">${escapeHtml(c.name)}</div>` : ''}
      ${c.description ? `<div class="gallery-card-desc">${escapeHtml(c.description)}</div>` : ''}
    </a>`).join('');

  return `
    <style>${GALLERY_CSS}</style>
    <div class="gallery-container">
      <h1 class="gallery-title">Shader Gallery</h1>
      <div class="gallery-grid">${cardHTML}
      </div>
    </div>`;
}

/**
 * Render a complete standalone gallery page (static build).
 */
export function renderGalleryPage(cards, linkFor) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shader Gallery</title>
</head>
<body>${renderGalleryHTML(cards, linkFor)}
</body>
</html>`;
}
