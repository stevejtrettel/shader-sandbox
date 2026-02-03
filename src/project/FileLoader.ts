/**
 * Abstract file system interface for project loading.
 *
 * Allows the same loading logic to work in both Node (fs) and
 * browser (Vite import.meta.glob) environments.
 */
export interface FileLoader {
  /** Check if a file exists at the given path. */
  exists(path: string): Promise<boolean>;

  /** Read a text file. Throws if not found. */
  readText(path: string): Promise<string>;

  /**
   * Resolve an image file to a URL usable by the browser.
   * Node: returns the file path. Browser: returns a Vite-resolved URL.
   */
  resolveImageUrl(path: string): Promise<string>;

  /** List .glsl filenames in a directory (just the filenames, not full paths). */
  listGlslFiles(directory: string): Promise<string[]>;

  /** Check if a directory exists and contains files. */
  hasFiles(directory: string): Promise<boolean>;

  /** Join path segments. */
  joinPath(...parts: string[]): string;

  /** Get the last segment of a path (e.g. "/foo/bar" → "bar"). */
  baseName(path: string): string;
}
