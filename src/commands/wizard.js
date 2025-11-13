const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const { detectProjectStructure } = require('../detectors/monorepo');
const { detectNextJs } = require('../detectors/nextjs');
const { detectRails } = require('../detectors/rails');
const { generateConfig } = require('../generators/config-generator');
const { generateAgentProfile } = require('../generators/agent-generator');

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

  // Generate configurations
  const configData = {
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
  };

  const config = generateConfig(configData);
  const agentProfile = generateAgentProfile(configData);

  // Save configurations
  const configPath = path.join(cwd, '.copilot-rules.json');
  const agentsDir = path.join(cwd, '.github', 'agents');
  const agentPath = path.join(agentsDir, 'project.md');

  const saveSpinner = ora('Generating configuration files...').start();

  try {
    // Save .copilot-rules.json for shell context
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    saveSpinner.text = 'Created .copilot-rules.json';

    // Create .github/agents directory and save custom agent
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }
    fs.writeFileSync(agentPath, agentProfile);
    saveSpinner.succeed('Configuration files created successfully');

    console.log(chalk.green.bold('\n✓ Setup complete!'));
    console.log(chalk.green('\nGenerated files:'));
    console.log(chalk.gray('  ✓ .copilot-rules.json') + chalk.dim(' (shell context)'));
    console.log(chalk.gray('  ✓ .github/agents/project.md') + chalk.dim(' (GitHub Copilot CLI agent)'));

    console.log(chalk.cyan('\n📋 Next steps:'));
    console.log(chalk.gray('  1. Review the generated files (optional)'));
    console.log(chalk.gray('  2. Commit to git:'));
    console.log(chalk.cyan('     git add .copilot-rules.json .github/agents/'));
    console.log(chalk.cyan('     git commit -m "chore: add copilot configuration"'));
    console.log(chalk.gray('  3. Reload shell context: ') + chalk.cyan('source ~/.zshrc'));
    console.log(chalk.gray('  4. Check context status: ') + chalk.cyan('copilot_status'));

    console.log(chalk.cyan('\n🤖 Using with GitHub Copilot CLI:'));
    console.log(chalk.gray('  The custom agent will be automatically available.'));
    console.log(chalk.gray('  To use it explicitly:'));
    console.log(chalk.cyan('  gh copilot --agent=project "your question"'));

    console.log(chalk.cyan('\n⚡ Automated workflows available:'));
    console.log(chalk.cyan('  • autobuild_next') + chalk.gray(' - Next.js build → PR workflow'));
    console.log(chalk.cyan('  • automerge_rails') + chalk.gray(' - Rails test → PR workflow'));
    console.log(chalk.cyan('  • autobuild_fullstack') + chalk.gray(' - Full-stack workflow\n'));

  } catch (error) {
    saveSpinner.fail('Failed to save configuration');
    throw error;
  }
}

module.exports = wizard;
