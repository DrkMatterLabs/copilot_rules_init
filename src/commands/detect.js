const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { detectProjectStructure } = require('../detectors/monorepo');
const { detectNextJs } = require('../detectors/nextjs');
const { detectRails } = require('../detectors/rails');
const { generateConfig } = require('../generators/config-generator');
const { generateAgentProfile } = require('../generators/agent-generator');

async function detect() {
  console.log(chalk.cyan.bold('\n🔍 Auto-Detecting Project Configuration'));
  console.log(chalk.cyan('━'.repeat(50)) + '\n');

  const cwd = process.cwd();
  const spinner = ora('Analyzing project structure...').start();

  try {
    const structure = await detectProjectStructure(cwd);
    const hasNextJs = detectNextJs(cwd);
    const hasRails = detectRails(cwd);

    spinner.succeed('Project structure analyzed');

    if (structure.detectedProjects.length === 0) {
      console.log(chalk.yellow('\n⚠ No recognizable project structure detected'));
      console.log(chalk.gray('Supported: Next.js, Ruby on Rails'));
      console.log(chalk.gray('Try running: copilot-init wizard (for manual setup)\n'));
      return;
    }

    // Show detection results
    console.log(chalk.green('\n✓ Detected:'));
    structure.detectedProjects.forEach(proj => {
      const location = proj.path ? `in ${proj.path}/` : 'in root';
      console.log(chalk.gray(`  • ${proj.type} ${location}`));
    });

    // Determine project name from directory
    const projectName = path.basename(cwd);

    // Build tech stack
    const techStack = [];
    if (hasNextJs.detected) {
      techStack.push(hasNextJs.version || 'Next.js');
      if (hasNextJs.hasTypeScript) techStack.push('TypeScript');
    }
    if (hasRails.detected) {
      techStack.push(hasRails.version || 'Ruby on Rails');
    }

    // Generate configurations
    const configData = {
      projectName,
      projectType: structure.suggestedType,
      domain: 'Auto-detected project',
      features: ['Auto-configured'],
      techStack,
      monorepo: {
        frontendDir: structure.frontendDir,
        backendDir: structure.backendDir
      },
      workflow: {
        branchPrefix: 'feature',
        autoBuild: true,
        targetBranch: 'main'
      }
    };

    const config = generateConfig(configData);
    const agentProfile = generateAgentProfile(configData);

    // Check if files exist
    const configPath = path.join(cwd, '.copilot-rules.json');
    const agentsDir = path.join(cwd, '.github', 'agents');
    const agentPath = path.join(agentsDir, 'project.md');

    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow('\n⚠ .copilot-rules.json already exists'));
      console.log(chalk.gray('Run copilot-init wizard to recreate it\n'));
      return;
    }

    // Save configurations
    const saveSpinner = ora('Generating configuration files...').start();

    // Save .copilot-rules.json
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    saveSpinner.text = 'Created .copilot-rules.json';

    // Create .github/agents directory and save custom agent
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }
    fs.writeFileSync(agentPath, agentProfile);
    saveSpinner.succeed('Configuration files created successfully');

    console.log(chalk.green.bold('\n✓ Auto-detection complete!'));
    console.log(chalk.green('\nGenerated files:'));
    console.log(chalk.gray('  ✓ .copilot-rules.json') + chalk.dim(' (shell context)'));
    console.log(chalk.gray('  ✓ .github/agents/project.md') + chalk.dim(' (GitHub Copilot CLI agent)'));

    console.log(chalk.cyan('\nDetected configuration:'));
    console.log(chalk.gray(`  Type: ${structure.suggestedType}`));
    console.log(chalk.gray(`  Tech: ${techStack.join(', ')}`));

    if (structure.isMonorepo) {
      console.log(chalk.gray(`  Structure: Monorepo`));
      if (structure.frontendDir) console.log(chalk.gray(`    Frontend: ${structure.frontendDir}/`));
      if (structure.backendDir) console.log(chalk.gray(`    Backend: ${structure.backendDir}/`));
    }

    console.log(chalk.cyan('\n📋 Next steps:'));
    console.log(chalk.gray('  1. Review the generated files (customize if needed)'));
    console.log(chalk.gray('  2. Commit to git:'));
    console.log(chalk.cyan('     git add .copilot-rules.json .github/agents/'));
    console.log(chalk.gray('  3. Reload shell context: ') + chalk.cyan('source ~/.zshrc'));
    console.log(chalk.gray('  4. Check status: ') + chalk.cyan('copilot_status\n'));

  } catch (error) {
    spinner.fail('Detection failed');
    throw error;
  }
}

module.exports = detect;
