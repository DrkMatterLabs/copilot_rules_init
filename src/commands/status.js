const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

async function status() {
  console.log(chalk.cyan('━'.repeat(60)));
  console.log(chalk.cyan.bold('GitHub Copilot Init - Status'));
  console.log(chalk.cyan('━'.repeat(60)) + '\n');

  const homeDir = os.homedir();
  const initScriptPath = path.join(homeDir, '.copilot_init.sh');
  const configPath = path.join(homeDir, '.config', 'github-copilot-cli', 'config.json');
  const localConfigPath = path.join(process.cwd(), '.copilot-rules.json');

  // Check installation
  console.log(chalk.bold('Installation Status:'));

  if (fs.existsSync(initScriptPath)) {
    console.log(chalk.green('  ✓ Init script installed') + chalk.gray(` (${initScriptPath})`));
  } else {
    console.log(chalk.red('  ✗ Init script not found') + chalk.gray(' - Run: copilot-init setup'));
  }

  if (fs.existsSync(configPath)) {
    console.log(chalk.green('  ✓ Global config exists') + chalk.gray(` (${configPath})`));
  } else {
    console.log(chalk.yellow('  ⚠ Global config not found'));
  }

  // Check local project config
  console.log('\n' + chalk.bold('Current Project:'));
  console.log(chalk.gray('  Directory: ') + process.cwd());

  if (fs.existsSync(localConfigPath)) {
    console.log(chalk.green('  ✓ Project config found') + chalk.gray(' (.copilot-rules.json)'));

    try {
      const config = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
      console.log(chalk.gray('  Name: ') + (config.project_name || 'N/A'));
      console.log(chalk.gray('  Type: ') + (config.type || 'N/A'));
      if (config.tech_stack && config.tech_stack.length > 0) {
        console.log(chalk.gray('  Tech: ') + config.tech_stack.join(', '));
      }
    } catch (error) {
      console.log(chalk.red('  ✗ Error reading config: ') + error.message);
    }
  } else {
    console.log(chalk.yellow('  ⚠ No project config'));
    console.log(chalk.gray('    Run: copilot-init wizard'));
  }

  // Check environment variables (if running in shell with copilot context)
  console.log('\n' + chalk.bold('Shell Context:'));
  const copilotProject = process.env.COPILOT_PROJECT;
  const copilotType = process.env.COPILOT_PROJECT_TYPE;

  if (copilotProject) {
    console.log(chalk.green('  ✓ Context loaded'));
    console.log(chalk.gray('  Project: ') + copilotProject);
    console.log(chalk.gray('  Type: ') + (copilotType || 'N/A'));
  } else {
    console.log(chalk.yellow('  ⚠ Context not loaded in current shell'));
    console.log(chalk.gray('    Try: source ~/.zshrc'));
  }

  // Available commands
  console.log('\n' + chalk.bold('Available Commands:'));
  console.log(chalk.cyan('  copilot-init setup  ') + chalk.gray('- Install/reinstall the system'));
  console.log(chalk.cyan('  copilot-init wizard ') + chalk.gray('- Create project config (interactive)'));
  console.log(chalk.cyan('  copilot-init detect ') + chalk.gray('- Auto-detect and configure'));
  console.log(chalk.cyan('  copilot-init status ') + chalk.gray('- Show this status'));

  console.log('\n' + chalk.bold('Shell Functions (after setup):'));
  console.log(chalk.cyan('  copilot_status      ') + chalk.gray('- Show current context'));
  console.log(chalk.cyan('  autobuild_next      ') + chalk.gray('- Next.js automated workflow'));
  console.log(chalk.cyan('  automerge_rails     ') + chalk.gray('- Rails automated workflow'));
  console.log(chalk.cyan('  copilot_refresh     ') + chalk.gray('- Reload context'));

  console.log('\n' + chalk.cyan('━'.repeat(60)) + '\n');
}

module.exports = status;
