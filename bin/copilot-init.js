#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const setup = require('../src/commands/setup');
const wizard = require('../src/commands/wizard');
const status = require('../src/commands/status');
const detect = require('../src/commands/detect');

const program = new Command();

program
  .name('copilot-init')
  .description('Smart context management and automated workflows for GitHub Copilot CLI')
  .version('1.0.2');

program
  .command('setup')
  .description('Initial setup - installs scripts and configures shell integration')
  .action(async () => {
    try {
      await setup();
    } catch (error) {
      console.error(chalk.red('Error during setup:'), error.message);
      process.exit(1);
    }
  });

program
  .command('wizard')
  .description('Interactive wizard to create project configuration')
  .action(async () => {
    try {
      await wizard();
    } catch (error) {
      console.error(chalk.red('Error running wizard:'), error.message);
      process.exit(1);
    }
  });

program
  .command('detect')
  .description('Auto-detect project structure and generate configuration')
  .action(async () => {
    try {
      await detect();
    } catch (error) {
      console.error(chalk.red('Error during detection:'), error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current Copilot configuration and context')
  .action(async () => {
    try {
      await status();
    } catch (error) {
      console.error(chalk.red('Error showing status:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
