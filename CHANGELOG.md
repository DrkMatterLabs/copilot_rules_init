# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-13

### Added
- **GitHub Copilot CLI Integration**: Automatically generates custom agent profiles in `.github/agents/project.md`
- New `agent-generator.js` module for creating project-specific Copilot agents
- Comprehensive agent profiles with:
  - Project type-specific guidelines (Next.js, Rails, Full-Stack, Monorepo)
  - Technology stack documentation
  - Development workflow instructions
  - Code quality standards
  - Communication style guidelines

### Changed
- `wizard` command now generates both `.copilot-rules.json` AND `.github/agents/project.md`
- `detect` command now generates both configuration files
- Updated output messages to show both generated files
- Enhanced README with detailed GitHub Copilot CLI integration documentation

### Fixed
- **Critical**: Fixed cache file format bug where `CACHED_AT` timestamp wasn't quoted, causing shell parsing errors
- Shell initialization now runs silently without echo output

### Documentation
- Added "How It Works" section explaining both configuration files
- Added "Generated Files" section with clear explanations
- Updated FAQ with GitHub Copilot CLI integration details
- Added examples of using custom agents with `gh copilot`

## [1.0.4] - 2025-11-13

### Changed
- Read version from package.json instead of hardcoding

## [1.0.3] - 2025-11-13

### Fixed
- Updated CLI version number

## [1.0.2] - 2025-11-13

### Changed
- Initial version improvements

## [1.0.0] - 2025-11-12

### Added
- Initial release
- Auto-detection of Next.js, Rails, and full-stack projects
- Monorepo support
- Interactive wizard for project configuration
- Dynamic context loading
- Automated workflows (autobuild_next, automerge_rails, autobuild_fullstack)
- Persistent context across sessions
- Safety features (prevent force push to main, build/test validation)
- Shell integration for zsh

[1.1.0]: https://github.com/DrkMatterLabs/copilot_rules_init/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/DrkMatterLabs/copilot_rules_init/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/DrkMatterLabs/copilot_rules_init/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/DrkMatterLabs/copilot_rules_init/compare/v1.0.0...v1.0.2
[1.0.0]: https://github.com/DrkMatterLabs/copilot_rules_init/releases/tag/v1.0.0
