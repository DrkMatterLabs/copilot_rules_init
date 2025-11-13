const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { detectProjectStructure } = require('../detectors/monorepo');
const { detectNextJs } = require('../detectors/nextjs');
const { detectRails } = require('../detectors/rails');
const { generateConfig } = require('../generators/config-generator');

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

    // Generate config
    const config = generateConfig({
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
    });

    // Save config
    const configPath = path.join(cwd, '.copilot-rules.json');

    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow('\n⚠ .copilot-rules.json already exists'));
      console.log(chalk.gray('Run copilot-init wizard to recreate it\n'));
      return;
    }

    const saveSpinner = ora('Generating configuration...').start();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    saveSpinner.succeed('Configuration saved to .copilot-rules.json');

    console.log(chalk.green.bold('\n✓ Auto-detection complete!'));
    console.log(chalk.gray('\nGenerated configuration:'));
    console.log(chalk.gray(`  Type: ${structure.suggestedType}`));
    console.log(chalk.gray(`  Tech: ${techStack.join(', ')}`));

    if (structure.isMonorepo) {
      console.log(chalk.gray(`  Structure: Monorepo`));
      if (structure.frontendDir) console.log(chalk.gray(`    Frontend: ${structure.frontendDir}/`));
      if (structure.backendDir) console.log(chalk.gray(`    Backend: ${structure.backendDir}/`));
    }

    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Review .copilot-rules.json (customize if needed)'));
    console.log(chalk.gray('  2. Reload context: source ~/.zshrc'));
    console.log(chalk.gray('  3. Check status: copilot_status\n'));

  } catch (error) {
    spinner.fail('Detection failed');
    throw error;
  }
}

module.exports = detect;
