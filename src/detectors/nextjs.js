const fs = require('fs');
const path = require('path');

/**
 * Detect Next.js project and extract version/info
 */
function detectNextJs(dir) {
  const result = {
    detected: false,
    version: null,
    hasTypeScript: false,
    hasAppDir: false
  };

  // Check for Next.js markers
  const markers = [
    'next.config.js',
    'next.config.mjs',
    'next.config.ts'
  ];

  const hasMarker = markers.some(marker =>
    fs.existsSync(path.join(dir, marker))
  );

  if (!hasMarker) {
    return result;
  }

  result.detected = true;

  // Check for TypeScript
  result.hasTypeScript = fs.existsSync(path.join(dir, 'tsconfig.json'));

  // Check for App Router (Next.js 13+)
  result.hasAppDir = fs.existsSync(path.join(dir, 'app'));

  // Try to get Next.js version from package.json
  const packageJsonPath = path.join(dir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const nextVersion = packageJson.dependencies?.next ||
                         packageJson.devDependencies?.next;

      if (nextVersion) {
        // Extract major version
        const match = nextVersion.match(/(\d+)/);
        if (match) {
          result.version = `Next.js ${match[1]}`;
        } else {
          result.version = 'Next.js';
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  if (!result.version) {
    result.version = 'Next.js';
  }

  return result;
}

module.exports = {
  detectNextJs
};
