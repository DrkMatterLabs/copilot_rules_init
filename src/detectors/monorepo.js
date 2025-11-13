const fs = require('fs');
const path = require('path');
const { detectNextJs } = require('./nextjs');
const { detectRails } = require('./rails');

/**
 * Detect if current directory is a monorepo and identify project structure
 */
async function detectProjectStructure(baseDir) {
  const result = {
    isMonorepo: false,
    detectedProjects: [],
    suggestedType: 'generic',
    frontendDir: null,
    backendDir: null
  };

  // Check root level first
  const rootNextJs = detectNextJs(baseDir);
  const rootRails = detectRails(baseDir);

  if (rootNextJs.detected && rootRails.detected) {
    result.suggestedType = 'fullstack';
    result.detectedProjects.push({ type: 'Next.js', path: null });
    result.detectedProjects.push({ type: 'Rails', path: null });
    return result;
  }

  if (rootNextJs.detected) {
    result.suggestedType = 'nextjs';
    result.detectedProjects.push({ type: 'Next.js', path: null });
  }

  if (rootRails.detected) {
    result.suggestedType = 'rails';
    result.detectedProjects.push({ type: 'Rails', path: null });
  }

  // If nothing at root, check subdirectories
  if (result.detectedProjects.length === 0) {
    const subdirs = getSubdirectories(baseDir);

    for (const subdir of subdirs) {
      const subdirPath = path.join(baseDir, subdir);
      const nextJs = detectNextJs(subdirPath);
      const rails = detectRails(subdirPath);

      if (nextJs.detected) {
        result.detectedProjects.push({ type: 'Next.js', path: subdir });
        result.frontendDir = subdir;
        result.isMonorepo = true;
      }

      if (rails.detected) {
        result.detectedProjects.push({ type: 'Rails', path: subdir });
        result.backendDir = subdir;
        result.isMonorepo = true;
      }
    }

    // Determine suggested type based on what was found
    if (result.detectedProjects.length > 1) {
      const hasNextJs = result.detectedProjects.some(p => p.type === 'Next.js');
      const hasRails = result.detectedProjects.some(p => p.type === 'Rails');

      if (hasNextJs && hasRails) {
        result.suggestedType = 'fullstack';
      } else {
        result.suggestedType = 'monorepo';
      }
    } else if (result.detectedProjects.length === 1) {
      const projectType = result.detectedProjects[0].type;
      result.suggestedType = projectType === 'Next.js' ? 'nextjs' : 'rails';
    }
  }

  return result;
}

/**
 * Get immediate subdirectories (not recursive)
 */
function getSubdirectories(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(file => {
        const fullPath = path.join(dir, file);
        return fs.statSync(fullPath).isDirectory() &&
               !file.startsWith('.') &&
               file !== 'node_modules';
      })
      .slice(0, 10); // Limit to first 10 directories for performance
  } catch (error) {
    return [];
  }
}

module.exports = {
  detectProjectStructure,
  getSubdirectories
};
