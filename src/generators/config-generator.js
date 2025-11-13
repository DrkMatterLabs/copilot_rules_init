/**
 * Generate .copilot-rules.json configuration based on wizard answers
 */
function generateConfig(options) {
  const {
    projectName,
    projectType,
    domain,
    features,
    techStack,
    monorepo,
    workflow
  } = options;

  const config = {
    project_name: projectName,
    description: domain,
    type: projectType,
    tech_stack: techStack.length > 0 ? techStack : [`${projectType} project`],
    context: {
      domain: domain,
      features: Array.isArray(features) ? features : [features]
    },
    workflow: {
      branch_prefix: workflow.branchPrefix || 'feature',
      auto_build: workflow.autoBuild !== false,
      auto_test: true,
      auto_pr: false,
      auto_merge: false,
      target_branch: workflow.targetBranch || 'main'
    }
  };

  // Add monorepo structure if applicable
  if (monorepo && (monorepo.frontendDir || monorepo.backendDir)) {
    config.structure = {
      type: 'monorepo',
      frontend: monorepo.frontendDir || null,
      backend: monorepo.backendDir || null
    };
  }

  // Add project-specific commands based on type
  config.commands = generateCommands(projectType, monorepo);

  // Add system prompt based on type
  config.system_prompt = generateSystemPrompt(projectType, domain);

  // Add approved commands
  config.approved_commands = generateApprovedCommands(projectType);

  return config;
}

function generateCommands(projectType, monorepo) {
  const commands = {};

  switch (projectType) {
    case 'nextjs':
      commands.build = 'npm run build';
      commands.test = 'npm test';
      commands.dev = 'npm run dev';
      commands.lint = 'npm run lint';
      break;

    case 'rails':
      commands.build = 'bundle install';
      commands.test = 'bundle exec rails test';
      commands.dev = 'rails server';
      commands.console = 'rails console';
      commands.db_migrate = 'rails db:migrate';
      break;

    case 'fullstack':
      if (monorepo.frontendDir && monorepo.backendDir) {
        commands.build = `cd ${monorepo.frontendDir} && npm run build && cd ../${monorepo.backendDir} && bundle install`;
        commands.test = `cd ${monorepo.backendDir} && bundle exec rails test && cd ../${monorepo.frontendDir} && npm test`;
        commands.dev_frontend = `cd ${monorepo.frontendDir} && npm run dev`;
        commands.dev_backend = `cd ${monorepo.backendDir} && rails server`;
      } else {
        commands.build = 'npm run build && bundle install';
        commands.test = 'bundle exec rails test && npm test';
      }
      break;

    default:
      commands.build = 'echo "No build command configured"';
      commands.test = 'echo "No test command configured"';
  }

  return commands;
}

function generateSystemPrompt(projectType, domain) {
  const prompts = {
    nextjs: `You are working on a Next.js project. ${domain ? `This is a ${domain}.` : ''} Always:
- Use TypeScript with strict mode
- Follow React best practices
- Ensure builds pass before committing
- Use Next.js App Router conventions when applicable
- Consider performance and SEO`,

    rails: `You are working on a Ruby on Rails project. ${domain ? `This is a ${domain}.` : ''} Always:
- Follow Rails conventions
- Write comprehensive tests
- Use strong parameters for security
- Avoid N+1 queries
- Ensure migrations are reversible`,

    fullstack: `You are working on a Full-Stack project (Rails API + Next.js). ${domain ? `This is a ${domain}.` : ''} Always:
- Coordinate API changes with frontend updates
- Follow Rails conventions for backend
- Follow React best practices for frontend
- Ensure type safety across the stack
- Write tests for both backend and frontend`,

    generic: `You are assisting with a software development project. ${domain ? `This is a ${domain}.` : ''} Follow best practices and ask for clarification when needed.`
  };

  return prompts[projectType] || prompts.generic;
}

function generateApprovedCommands(projectType) {
  const common = [
    'git status',
    'git diff',
    'git log --oneline -10',
    'git branch'
  ];

  const specific = {
    nextjs: [
      'npm run build',
      'npm test',
      'npm run lint',
      'npm list --depth=0'
    ],
    rails: [
      'bundle exec rails test',
      'bundle exec rspec',
      'rails routes',
      'rails db:migrate:status',
      'bundle list'
    ],
    fullstack: [
      'npm run build',
      'npm test',
      'bundle exec rails test',
      'bundle exec rspec',
      'rails routes'
    ]
  };

  return [...common, ...(specific[projectType] || [])];
}

module.exports = {
  generateConfig
};
