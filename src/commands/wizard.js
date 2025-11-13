const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const { detectProjectStructure } = require('../detectors/monorepo');
const { detectNextJs } = require('../detectors/nextjs');
const { detectRails } = require('../detectors/rails');
const { generateConfig } = require('../generators/config-generator');

async function wizard() {
  console.log(chalk.cyan.bold('\n🪄  Project Setup Wizard'));
  console.log(chalk.cyan('━'.repeat(50)) + '\n');

  const cwd = process.cwd();

  // Auto-detect project structure
  const spinner = ora('Analyzing project structure...').start();

  const structure = await detectProjectStructure(cwd);
  const hasNextJs = detectNextJs(cwd);
  const hasRails = detectRails(cwd);

  spinner.succeed('Project structure analyzed');

  // Show what was detected
  if (structure.detectedProjects.length > 0) {
    console.log(chalk.green('\n✓ Auto-detected:'));
    structure.detectedProjects.forEach(proj => {
      console.log(chalk.gray(`  • ${proj.type} in ${proj.path || 'root'}`));
    });
    console.log('');
  }

  // Ask questions
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(cwd),
      validate: (input) => input.length > 0 || 'Project name is required'
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Project type:',
      choices: [
        { name: 'Next.js', value: 'nextjs' },
        { name: 'Ruby on Rails', value: 'rails' },
        { name: 'Full-Stack (Rails + Next.js)', value: 'fullstack' },
        { name: 'Monorepo (Multiple projects)', value: 'monorepo' },
        { name: 'Other', value: 'generic' }
      ],
      default: structure.suggestedType || 'generic'
    }
  ]);

  // Ask about monorepo structure if applicable
  let monorepoInfo = {};
  if (answers.projectType === 'fullstack' || answers.projectType === 'monorepo') {
    const { hasSubdirs } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasSubdirs',
        message: 'Are frontend and backend in separate directories?',
        default: structure.isMonorepo
      }
    ]);

    if (hasSubdirs) {
      monorepoInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'frontendDir',
          message: 'Frontend directory name:',
          default: structure.frontendDir || 'frontend',
          when: () => answers.projectType === 'fullstack' || answers.projectType === 'monorepo'
        },
        {
          type: 'input',
          name: 'backendDir',
          message: 'Backend directory name:',
          default: structure.backendDir || 'backend',
          when: () => answers.projectType === 'fullstack' || answers.projectType === 'monorepo'
        }
      ]);
    }
  }

  // Ask about domain/purpose
  const { domain, features } = await inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'What does this project do? (brief description):',
      default: 'Web application'
    },
    {
      type: 'input',
      name: 'features',
      message: 'Main features (comma-separated):',
      default: 'User management, Dashboard',
      filter: (input) => input.split(',').map(s => s.trim())
    }
  ]);

  // Tech stack detection
  const techStack = [];
  if (hasNextJs.detected || answers.projectType === 'nextjs' || answers.projectType === 'fullstack') {
    techStack.push(hasNextJs.version || 'Next.js');
    if (hasNextJs.hasTypeScript) techStack.push('TypeScript');
  }
  if (hasRails.detected || answers.projectType === 'rails' || answers.projectType === 'fullstack') {
    techStack.push(hasRails.version || 'Ruby on Rails');
  }

  // Workflow preferences
  const { branchPrefix, autoBuild } = await inquirer.prompt([
    {
      type: 'list',
      name: 'branchPrefix',
      message: 'Branch naming prefix:',
      choices: ['feature', 'feat', 'fix', 'chore'],
      default: 'feature'
    },
    {
      type: 'confirm',
      name: 'autoBuild',
      message: 'Enable automatic build/test before commits?',
      default: true
    }
  ]);

  // Generate configuration
  const config = generateConfig({
    projectName: answers.projectName,
    projectType: answers.projectType,
    domain,
    features,
    techStack,
    monorepo: monorepoInfo,
    workflow: {
      branchPrefix,
      autoBuild,
      targetBranch: 'main'
    }
  });

  // Save configuration
  const configPath = path.join(cwd, '.copilot-rules.json');
  const saveSpinner = ora('Generating configuration...').start();

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    saveSpinner.succeed('Configuration saved to .copilot-rules.json');

    console.log(chalk.green.bold('\n✓ Setup complete!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Review .copilot-rules.json (optional)'));
    console.log(chalk.gray('  2. Commit it to git: git add .copilot-rules.json'));
    console.log(chalk.gray('  3. Reload context: source ~/.zshrc'));
    console.log(chalk.gray('  4. Check status: copilot_status'));
    console.log(chalk.gray('\nAutomated workflows available:'));
    console.log(chalk.cyan('  • autobuild_next') + chalk.gray(' - Next.js build → PR workflow'));
    console.log(chalk.cyan('  • automerge_rails') + chalk.gray(' - Rails test → PR workflow'));
    console.log(chalk.cyan('  • autobuild_fullstack') + chalk.gray(' - Full-stack workflow\n'));

  } catch (error) {
    saveSpinner.fail('Failed to save configuration');
    throw error;
  }
}

module.exports = wizard;
