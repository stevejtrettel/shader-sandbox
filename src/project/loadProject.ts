/**
 * Project Layer - Node/CLI Loader
 *
 * Thin adapter that implements FileLoader using Node's fs/path,
 * then delegates to the shared loadProjectFromFiles() core.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { ShaderProject } from './types';
import type { FileLoader } from './FileLoader';
import { loadProjectFromFiles } from './loadProjectCore';

// =============================================================================
// Node FileLoader Implementation
// =============================================================================

function createNodeFileLoader(): FileLoader {
  return {
    async exists(p: string): Promise<boolean> {
      try {
        await fs.access(p);
        return true;
      } catch {
        return false;
      }
    },

    async readText(p: string): Promise<string> {
      return fs.readFile(p, 'utf8');
    },

    async resolveImageUrl(p: string): Promise<string> {
      // Node: just return the file path as-is
      return p;
    },

    async listGlslFiles(directory: string): Promise<string[]> {
      try {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        return entries
          .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.glsl'))
          .map((e) => e.name);
      } catch {
        return [];
      }
    },

    async hasFiles(directory: string): Promise<boolean> {
      try {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        return entries.some((e) => e.isFile());
      } catch {
        return false;
      }
    },

    joinPath(...parts: string[]): string {
      return path.join(...parts);
    },

    baseName(p: string): string {
      return path.basename(p);
    },
  };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Load a shader project from disk (Node/CLI environment).
 *
 * @param root - Absolute path to project directory
 * @returns Fully normalized ShaderProject
 * @throws Error with descriptive message if project is invalid
 */
export async function loadProject(root: string): Promise<ShaderProject> {
  const loader = createNodeFileLoader();
  return loadProjectFromFiles(loader, root);
}
