# 🤖 Copilot Init

> **Smart context management and automated workflows for GitHub Copilot CLI**

Automatically detect your project structure, load the right context, and automate your development workflows across Next.js, Rails, and full-stack projects.

[![npm version](https://img.shields.io/npm/v/@drkmattrlabs/copilot_init.svg)](https://www.npmjs.com/package/@drkmattrlabs/copilot_init)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🎯 **Auto-Detection** - Automatically identifies Next.js, Rails, and full-stack projects
- 🏗️ **Monorepo Support** - Detects separate frontend/backend directories
- 🧙 **Interactive Wizard** - Answer a few questions, get a complete configuration
- 🔄 **Dynamic Context** - Context switches automatically when you change projects
- 🚀 **Automated Workflows** - Build → Test → PR → Merge workflows for Next.js and Rails
- 💾 **Persistent Context** - Maintains context while working in the same project
- 🛡️ **Safety First** - Protects against destructive operations
- 📦 **Easy to Extend** - Add new projects with simple config files

---

## 📦 Installation

```bash
npm install -g @drkmattrlabs/copilot_init
```

---

## 🚀 Quick Start

### 1. Setup (First Time)

```bash
copilot-init setup
```

This installs the initialization script, creates global configuration, and updates your shell.

**Restart your terminal** or run:
```bash
source ~/.zshrc
```

### 2. Configure Your Project

Navigate to your project directory:

```bash
cd ~/Projects/my-project
```

Run the interactive wizard:

```bash
copilot-init wizard
```

Answer a few questions:
- Project name
- Project type (Next.js, Rails, Full-Stack, etc.)
- Directory structure (if monorepo)
- What your project does
- Workflow preferences

That's it! 🎉

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `copilot-init setup` | Install/reinstall the system |
| `copilot-init wizard` | Interactive project configuration |
| `copilot-init detect` | Auto-detect and configure (no questions) |
| `copilot-init status` | Show installation and project status |

### Shell Functions (Available After Setup)

| Function | Description |
|----------|-------------|
| `copilot_status` or `copilot` | Show current project context |
| `copilot_refresh` or `crefresh` | Reload context |
| `autobuild_next` or `nextbuild` | Next.js automated workflow |
| `automerge_rails` or `railsmerge` | Rails automated workflow |
| `autobuild_fullstack` | Full-stack workflow |

---

## 🎯 How It Works

### Automatic Project Detection

When you `cd` into a directory, Copilot Init:

1. **Finds the project root** (looks for `.git` or config files)
2. **Detects project type**:
   - Sees `next.config.js` → identifies as Next.js
   - Sees `Gemfile` + `config/application.rb` → identifies as Rails
   - Sees both → identifies as Full-Stack
   - Checks subdirectories → detects monorepos
3. **Loads configuration**:
   - First: `.copilot-rules.json` in project root
   - Fallback: Global defaults
4. **Sets context** - Available to all shell functions

### Context Hierarchy

```
~/Projects/my-erp/               → Full-Stack context
├── frontend/                    → Next.js context (when in this dir)
│   ├── next.config.js
│   └── ...
├── backend/                     → Rails context (when in this dir)
│   ├── Gemfile
│   └── ...
└── .copilot-rules.json         → Project configuration
```

---

## 🔧 Configuration

### Project Configuration (`.copilot-rules.json`)

Created automatically by the wizard or detect command:

```json
{
  "project_name": "My Project",
  "type": "fullstack",
  "tech_stack": ["Next.js 14", "Rails 7", "PostgreSQL"],
  "context": {
    "domain": "E-commerce platform",
    "features": ["Product catalog", "Shopping cart"]
  },
  "workflow": {
    "branch_prefix": "feature",
    "auto_build": true,
    "target_branch": "main"
  },
  "structure": {
    "type": "monorepo",
    "frontend": "frontend",
    "backend": "backend"
  }
}
```

### Supported Project Types

- `nextjs` - Next.js projects
- `rails` - Ruby on Rails projects
- `fullstack` - Rails API + Next.js frontend
- `monorepo` - Multiple projects in subdirectories
- `generic` - Other projects (basic context)

---

## 🚀 Automated Workflows

### Next.js Workflow

```bash
# Make your changes
code components/Dashboard.tsx

# Run automated workflow
nextbuild "feat: add dashboard widget"
```

**What it does:**
1. ✅ Runs `npm run build`
2. ✅ Creates branch: `feature/TIMESTAMP-autobuild`
3. ✅ Commits changes
4. ✅ Pushes to remote
5. ✅ Creates Pull Request (if `gh` CLI installed)

### Rails Workflow

```bash
# Make your changes
code app/controllers/users_controller.rb

# Run automated workflow
railsmerge "fix: resolve authentication issue"
```

**What it does:**
1. ✅ Runs `bundle exec rails test`
2. ✅ Creates branch: `fix/TIMESTAMP-automerge`
3. ✅ Commits and pushes
4. ✅ Creates Pull Request

### Safety Features

- ⚠️ Aborts if build/tests fail
- ⚠️ Warns when on main/master branch
- ⚠️ Prevents force push to main/master
- ⚠️ Only commits if changes exist

---

## 📖 Examples

### Example 1: Setting Up a New Project

```bash
# Create new Next.js project
npx create-next-app@latest my-app
cd my-app

# Configure with wizard
copilot-init wizard

# Answer questions...
# ✓ Configuration created!

# Check status
copilot_status
```

### Example 2: Working Across Multiple Projects

```bash
# Morning: Work on ERP system
cd ~/Projects/erp
copilot  # Shows: ERP Full-Stack context

# Make changes
nextbuild "feat: add inventory report"

# Afternoon: Switch to another project
cd ~/Projects/blog-app
copilot  # Automatically switches to blog-app context

# Context is dynamic!
```

### Example 3: Monorepo Detection

```bash
cd ~/Projects/my-monorepo
copilot-init detect

# Output:
# ✓ Detected:
#   • Next.js in frontend/
#   • Rails in backend/
# ✓ Configuration saved
# Type: fullstack
# Structure: Monorepo
```

---

## 🤔 FAQ

### Do I need GitHub Copilot to use this?

No! While designed to complement GitHub Copilot CLI, this tool provides:
- Project context management
- Automated build/test/PR workflows
- Multi-project support

It's useful for any developer working across multiple projects.

### What shells are supported?

Currently: **zsh** (macOS/Linux default)

Support for bash and fish coming soon.

### How do I add a new project?

Two ways:

1. **Automatic (recommended)**:
   ```bash
   cd /path/to/project
   copilot-init wizard
   ```

2. **Manual**:
   Create `.copilot-rules.json` in project root (see Configuration section)

### Can I customize workflows?

Yes! Edit `~/.copilot_init.sh` to add custom functions:

```bash
my_custom_workflow() {
    echo "Running custom workflow..."
    # Your logic here
}
export -f my_custom_workflow
```

### How do I uninstall?

```bash
# Remove files
rm ~/.copilot_init.sh
rm -rf ~/.config/github-copilot-cli

# Remove from .zshrc (manual step)
# Delete the "GitHub Copilot Init" section

# Uninstall npm package
npm uninstall -g @drkmattrlabs/copilot_init
```

---

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/DrkMatterLabs/copilot_rules_init.git
cd copilot_rules_init

# Install dependencies
npm install

# Link locally for testing
npm link

# Test commands
copilot-init status
```

---

## 📝 Requirements

- **Node.js** >= 14.0.0
- **Git** (for automated workflows)
- **zsh** shell (macOS/Linux)
- **gh CLI** (optional, for auto PR creation)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © [DrkMatterLabs](https://github.com/DrkMatterLabs)

---

## 🙏 Acknowledgments

Created by [Rafael Delgado](https://github.com/DrkMatterLabs) to simplify context management across multiple full-stack projects.

Inspired by the need for smarter, context-aware development tools.

---

## 📞 Support

- 🐛 [Report a bug](https://github.com/DrkMatterLabs/copilot_rules_init/issues)
- 💡 [Request a feature](https://github.com/DrkMatterLabs/copilot_rules_init/issues)
- 📖 [Documentation](https://github.com/DrkMatterLabs/copilot_rules_init#readme)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/DrkMatterLabs">DrkMatterLabs</a>
</p>
