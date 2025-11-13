const fs = require('fs');
const path = require('path');

/**
 * Detect Ruby on Rails project and extract version/info
 */
function detectRails(dir) {
  const result = {
    detected: false,
    version: null,
    isApiOnly: false
  };

  // Check for Rails markers
  const hasGemfile = fs.existsSync(path.join(dir, 'Gemfile'));
  const hasConfig = fs.existsSync(path.join(dir, 'config', 'application.rb'));

  if (!hasGemfile || !hasConfig) {
    return result;
  }

  result.detected = true;

  // Try to get Rails version from Gemfile
  const gemfilePath = path.join(dir, 'Gemfile');
  try {
    const gemfileContent = fs.readFileSync(gemfilePath, 'utf8');

    // Look for gem 'rails', '~> 7.0'
    const railsMatch = gemfileContent.match(/gem\s+['"]rails['"]\s*,\s*['"]~>\s*(\d+\.\d+)/);
    if (railsMatch) {
      result.version = `Rails ${railsMatch[1]}`;
    } else if (gemfileContent.includes("gem 'rails'") || gemfileContent.includes('gem "rails"')) {
      result.version = 'Ruby on Rails';
    }
  } catch (error) {
    // Ignore read errors
  }

  // Check if API-only mode
  const appConfigPath = path.join(dir, 'config', 'application.rb');
  if (fs.existsSync(appConfigPath)) {
    try {
      const configContent = fs.readFileSync(appConfigPath, 'utf8');
      result.isApiOnly = configContent.includes('config.api_only = true');
    } catch (error) {
      // Ignore read errors
    }
  }

  if (!result.version) {
    result.version = 'Ruby on Rails';
  }

  return result;
}

module.exports = {
  detectRails
};
