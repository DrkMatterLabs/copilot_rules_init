const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const homeDir = os.homedir();
const initScriptPath = path.join(homeDir, '.copilot_init.sh');
const zshrcPath = path.join(homeDir, '.zshrc');
const configDir = path.join(homeDir, '.config', 'github-copilot-cli');
const configPath = path.join(configDir, 'config.json');

async function setup() {
  console.log(chalk.cyan.bold('\n🤖 Copilot Init - Smart Context Management'));
  console.log(chalk.cyan('━'.repeat(50)) + '\n');

  // Check if already installed
  if (fs.existsSync(initScriptPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Copilot Init is already installed. Overwrite?',
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('\n✓ Setup cancelled'));
      return;
    }
  }

  let spinner;

  try {
    // 1. Create config directory
    spinner = ora('Creating configuration directory...').start();
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    spinner.succeed('Configuration directory created');

    // 2. Copy init script
    spinner = ora('Installing initialization script...').start();
    const initScriptTemplate = getInitScriptTemplate();
    fs.writeFileSync(initScriptPath, initScriptTemplate, { mode: 0o755 });
    spinner.succeed('Initialization script installed');

    // 3. Create global config
    spinner = ora('Creating global configuration...').start();
    if (!fs.existsSync(configPath)) {
      const globalConfig = getGlobalConfigTemplate();
      fs.writeFileSync(configPath, JSON.stringify(globalConfig, null, 2));
    }
    spinner.succeed('Global configuration created');

    // 4. Update .zshrc
    spinner = ora('Updating shell configuration...').start();
    const zshrcSnippet = getZshrcSnippet();

    let zshrcContent = '';
    if (fs.existsSync(zshrcPath)) {
      zshrcContent = fs.readFileSync(zshrcPath, 'utf8');
    }

    if (!zshrcContent.includes('copilot_init.sh')) {
      fs.appendFileSync(zshrcPath, '\n' + zshrcSnippet + '\n');
      spinner.succeed('Shell configuration updated');
    } else {
      spinner.info('Shell configuration already updated');
    }

    // Success message
    console.log(chalk.green.bold('\n✓ Installation complete!'));
    console.log(chalk.yellow('\n⚠️  Please restart your terminal or run:'));
    console.log(chalk.cyan('   source ~/.zshrc\n'));
    console.log(chalk.gray('Quick start:'));
    console.log(chalk.gray('  1. cd into your project directory'));
    console.log(chalk.gray('  2. Run: copilot-init wizard'));
    console.log(chalk.gray('  3. Answer a few questions'));
    console.log(chalk.gray('  4. Start using automated workflows!\n'));

  } catch (error) {
    if (spinner) spinner.fail('Setup failed');
    throw error;
  }
}

function getInitScriptTemplate() {
  return fs.readFileSync(path.join(__dirname, '../templates/init-script.sh'), 'utf8');
}

function getGlobalConfigTemplate() {
  const templatePath = path.join(__dirname, '../templates/global-config.json');
  return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
}

function getZshrcSnippet() {
  return fs.readFileSync(path.join(__dirname, '../templates/zshrc-snippet.sh'), 'utf8');
}

module.exports = setup;
