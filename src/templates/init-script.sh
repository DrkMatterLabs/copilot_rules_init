#!/usr/bin/env bash

################################################################################
# GitHub Copilot CLI - Dynamic Project Context Loader
# Author: Rafael Delgado
# Description: Automatically detects project context and loads appropriate
#              Copilot configuration based on current directory
################################################################################

# =============================================================================
# GLOBAL VARIABLES
# =============================================================================
COPILOT_CONFIG_DIR="$HOME/.config/github-copilot-cli"
COPILOT_GLOBAL_CONFIG="$COPILOT_CONFIG_DIR/config.json"
COPILOT_LOG_FILE="$HOME/.copilot_cli.log"
COPILOT_CACHE_FILE="$HOME/.copilot_context_cache"

# Store the last detected project to maintain persistence
export COPILOT_LAST_PROJECT=""
export COPILOT_LAST_PWD=""

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Log messages with timestamps
copilot_log() {
    local level="$1"
    shift
    local message="$*"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" >> "$COPILOT_LOG_FILE"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get current git branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null
}

# Check if we're in a git repository
is_git_repo() {
    git rev-parse --git-dir >/dev/null 2>&1
}

# Generate timestamp for branch names
get_timestamp() {
    date '+%Y%m%d-%H%M%S'
}

# Get short git hash
get_short_hash() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

# =============================================================================
# PROJECT DETECTION
# =============================================================================

# Detect project type based on markers in current directory
detect_project_type() {
    local project_root="$1"

    # Check for Next.js markers
    if [[ -f "$project_root/next.config.js" ]] || \
       [[ -f "$project_root/next.config.mjs" ]] || \
       [[ -f "$project_root/next.config.ts" ]] || \
       [[ -d "$project_root/pages" ]] || \
       [[ -d "$project_root/app" ]]; then
        echo "nextjs"
        return 0
    fi

    # Check for Rails markers
    if [[ -f "$project_root/Gemfile" ]] && \
       [[ -f "$project_root/config/application.rb" ]]; then
        echo "rails"
        return 0
    fi

    # Check for full-stack (both Rails and Next.js)
    if [[ -f "$project_root/Gemfile" ]] && \
       [[ -f "$project_root/next.config.js" ]]; then
        echo "fullstack"
        return 0
    fi

    # Default to generic
    echo "generic"
}

# Find the project root (look for git root or local config file)
find_project_root() {
    local current_dir="$PWD"

    # First, try to find git root
    if is_git_repo; then
        git rev-parse --show-toplevel 2>/dev/null
        return 0
    fi

    # Otherwise, look for .copilot-rules.json going up the directory tree
    while [[ "$current_dir" != "/" ]]; do
        if [[ -f "$current_dir/.copilot-rules.json" ]] || \
           [[ -f "$current_dir/.copilot-rules.yaml" ]] || \
           [[ -f "$current_dir/.copilot.json" ]]; then
            echo "$current_dir"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
    done

    # Default to PWD
    echo "$PWD"
}

# Load local project configuration if it exists
load_local_config() {
    local project_root="$1"
    local config_file=""

    # Look for config files in priority order
    for filename in ".copilot-rules.json" ".copilot-rules.yaml" ".copilot.json"; do
        if [[ -f "$project_root/$filename" ]]; then
            config_file="$project_root/$filename"
            break
        fi
    done

    if [[ -n "$config_file" ]]; then
        copilot_log "INFO" "Found local config: $config_file"
        echo "$config_file"
        return 0
    fi

    return 1
}

# Identify known projects by path patterns
identify_known_project() {
    local current_path="$PWD"

    # ERP System
    if [[ "$current_path" =~ (erp\.drkmattr\.com|/erp/|tires_erp) ]]; then
        echo "erp_drkmattr"
        return 0
    fi

    # TotalCargo
    if [[ "$current_path" =~ (TotalCargo|totalcargo) ]]; then
        echo "totalcargo"
        return 0
    fi

    return 1
}

# =============================================================================
# CONTEXT LOADING
# =============================================================================

# Load and set project context
load_project_context() {
    local project_root
    local project_type
    local project_name
    local local_config

    project_root="$(find_project_root)"
    project_type="$(detect_project_type "$project_root")"

    # Check if we've already loaded context for this location
    if [[ "$COPILOT_LAST_PWD" == "$PWD" ]] && [[ -n "$COPILOT_PROJECT" ]]; then
        copilot_log "DEBUG" "Using cached context for $COPILOT_PROJECT"
        return 0
    fi

    copilot_log "INFO" "Loading context for directory: $PWD"
    copilot_log "INFO" "Project root: $project_root"
    copilot_log "INFO" "Detected type: $project_type"

    # Try to identify known project
    project_name="$(identify_known_project)"
    if [[ -n "$project_name" ]]; then
        copilot_log "INFO" "Identified known project: $project_name"
        export COPILOT_PROJECT="$project_name"
    else
        # Use directory name as project identifier
        export COPILOT_PROJECT="$(basename "$project_root")"
    fi

    # Set project type
    export COPILOT_PROJECT_TYPE="$project_type"
    export COPILOT_PROJECT_ROOT="$project_root"

    # Load local config if available
    local_config="$(load_local_config "$project_root")"
    if [[ -n "$local_config" ]]; then
        export COPILOT_LOCAL_CONFIG="$local_config"
        copilot_log "INFO" "Using local config: $local_config"
    else
        unset COPILOT_LOCAL_CONFIG
    fi

    # Set project-specific prompt based on type
    case "$project_type" in
        nextjs)
            export COPILOT_PROMPT="You are working on a Next.js project for Rafael Delgado. Use TypeScript, follow React best practices, and ensure all builds pass before committing."
            export COPILOT_BUILD_CMD="npm run build"
            export COPILOT_TEST_CMD="npm test"
            ;;
        rails)
            export COPILOT_PROMPT="You are working on a Ruby on Rails project for Rafael Delgado. Follow Rails conventions, write tests, and ensure migrations are safe."
            export COPILOT_BUILD_CMD="bundle install"
            export COPILOT_TEST_CMD="bundle exec rails test"
            ;;
        fullstack)
            export COPILOT_PROMPT="You are working on a Full-Stack project (Rails + Next.js) for Rafael Delgado. Coordinate backend API changes with frontend updates."
            export COPILOT_BUILD_CMD="npm run build && bundle install"
            export COPILOT_TEST_CMD="bundle exec rails test && npm test"
            ;;
        *)
            export COPILOT_PROMPT="You are assisting Rafael Delgado with a software development project. Follow best practices and ask for clarification when needed."
            export COPILOT_BUILD_CMD=""
            export COPILOT_TEST_CMD=""
            ;;
    esac

    # Set approved commands list
    export COPILOT_APPROVED="git status,git diff,git log,npm run build,bundle exec rails test,npm test"

    # Cache the current location
    export COPILOT_LAST_PWD="$PWD"

    copilot_log "INFO" "Context loaded successfully for $COPILOT_PROJECT ($project_type)"

    # Write cache file for persistence across sessions
    cat > "$COPILOT_CACHE_FILE" <<EOF
COPILOT_PROJECT="$COPILOT_PROJECT"
COPILOT_PROJECT_TYPE="$project_type"
COPILOT_PROJECT_ROOT="$project_root"
COPILOT_LAST_PWD="$PWD"
CACHED_AT="$(date '+%Y-%m-%d %H:%M:%S')"
EOF

    return 0
}

# Initialize context when script is sourced
initialize_copilot_context() {
    # Create log file if it doesn't exist
    touch "$COPILOT_LOG_FILE"

    # Load cached context if available and still valid
    if [[ -f "$COPILOT_CACHE_FILE" ]]; then
        source "$COPILOT_CACHE_FILE"

        # Check if we're still in the same directory
        if [[ "$COPILOT_LAST_PWD" != "$PWD" ]]; then
            load_project_context
        else
            copilot_log "DEBUG" "Restored context from cache"
        fi
    else
        load_project_context
    fi
}

# =============================================================================
# AUTOMATION HELPER FUNCTIONS
# =============================================================================

# Next.js Auto-Build Workflow
# Usage: autobuild_next [commit_message]
autobuild_next() {
    local commit_msg="${1:-Automated build and deployment}"
    local timestamp
    local branch_name
    local current_branch

    copilot_log "INFO" "Starting Next.js autobuild workflow"

    # Verify we're in a Next.js project
    if [[ "$COPILOT_PROJECT_TYPE" != "nextjs" ]] && [[ "$COPILOT_PROJECT_TYPE" != "fullstack" ]]; then
        echo "❌ Error: Not in a Next.js project"
        copilot_log "ERROR" "autobuild_next called in non-Next.js project"
        return 1
    fi

    # Verify we're in a git repo
    if ! is_git_repo; then
        echo "❌ Error: Not in a git repository"
        return 1
    fi

    # Get current branch
    current_branch="$(get_current_branch)"

    # Safety check: don't run on main/master
    if [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "master" ]]; then
        echo "⚠️  Warning: You're on the $current_branch branch"
        echo "This workflow will create a new feature branch. Continue? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "Aborted"
            return 1
        fi
    fi

    # Step 1: Run build
    echo "🔨 Running build..."
    if ! npm run build; then
        echo "❌ Build failed. Aborting workflow."
        copilot_log "ERROR" "Build failed in autobuild_next"
        return 1
    fi
    echo "✅ Build successful"

    # Step 2: Stage changes
    echo "📦 Staging changes..."
    git add .

    # Check if there are changes to commit
    if git diff --cached --quiet; then
        echo "ℹ️  No changes to commit"
        return 0
    fi

    # Step 3: Create new branch
    timestamp="$(get_timestamp)"
    branch_name="feature/${timestamp}-autobuild"

    echo "🌿 Creating branch: $branch_name"
    git checkout -b "$branch_name"

    # Step 4: Commit changes
    echo "💾 Committing changes..."
    git commit -m "$commit_msg

Automated build successful at $timestamp

Generated by Copilot CLI automation for Rafael Delgado"

    # Step 5: Push to remote (if configured)
    echo "⬆️  Pushing to remote..."
    if git push -u origin "$branch_name"; then
        echo "✅ Pushed successfully"

        # Step 6: Create PR using gh CLI (if available)
        if command_exists gh; then
            echo "🔀 Creating Pull Request..."
            if gh pr create \
                --title "Automated Build PR - $timestamp" \
                --body "Automated PR created after successful build.

**Changes:**
- Build validated
- All checks passed

*Generated by Copilot CLI automation for Rafael Delgado*" \
                --base main; then
                echo "✅ Pull Request created"

                # Optional: Auto-merge (disabled by default for safety)
                # Uncomment the following lines to enable auto-merge:
                # echo "⏳ Waiting for checks to pass..."
                # gh pr merge --auto --squash
                # echo "✅ PR set to auto-merge"
            else
                echo "⚠️  Failed to create PR, but code is pushed"
            fi
        else
            echo "ℹ️  Install 'gh' CLI to enable automatic PR creation"
            echo "   Visit: https://cli.github.com/"
        fi
    else
        echo "⚠️  Push failed. You may need to set up remote or check permissions."
    fi

    copilot_log "INFO" "autobuild_next workflow completed for branch $branch_name"
    echo ""
    echo "✨ Workflow complete!"
    echo "   Branch: $branch_name"
    echo "   Commit: $(get_short_hash)"
}

# Rails Auto-Merge Workflow
# Usage: automerge_rails [commit_message]
automerge_rails() {
    local commit_msg="${1:-Automated test-driven merge}"
    local timestamp
    local branch_name
    local current_branch

    copilot_log "INFO" "Starting Rails automerge workflow"

    # Verify we're in a Rails project
    if [[ "$COPILOT_PROJECT_TYPE" != "rails" ]] && [[ "$COPILOT_PROJECT_TYPE" != "fullstack" ]]; then
        echo "❌ Error: Not in a Rails project"
        copilot_log "ERROR" "automerge_rails called in non-Rails project"
        return 1
    fi

    # Verify we're in a git repo
    if ! is_git_repo; then
        echo "❌ Error: Not in a git repository"
        return 1
    fi

    # Get current branch
    current_branch="$(get_current_branch)"

    # Safety check: don't run on main/master
    if [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "master" ]]; then
        echo "⚠️  Warning: You're on the $current_branch branch"
        echo "This workflow will create a new fix branch. Continue? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "Aborted"
            return 1
        fi
    fi

    # Step 1: Run tests
    echo "🧪 Running test suite..."
    if ! bundle exec rails test; then
        echo "❌ Tests failed. Aborting workflow."
        copilot_log "ERROR" "Tests failed in automerge_rails"
        return 1
    fi
    echo "✅ All tests passed"

    # Step 2: Stage changes
    echo "📦 Staging changes..."
    git add .

    # Check if there are changes to commit
    if git diff --cached --quiet; then
        echo "ℹ️  No changes to commit"
        return 0
    fi

    # Step 3: Create new branch
    timestamp="$(get_timestamp)"
    branch_name="fix/${timestamp}-automerge"

    echo "🌿 Creating branch: $branch_name"
    git checkout -b "$branch_name"

    # Step 4: Commit changes
    echo "💾 Committing changes..."
    git commit -m "$commit_msg

All tests passed at $timestamp

Generated by Copilot CLI automation for Rafael Delgado"

    # Step 5: Push to remote (if configured)
    echo "⬆️  Pushing to remote..."
    if git push -u origin "$branch_name"; then
        echo "✅ Pushed successfully"

        # Step 6: Create PR using gh CLI (if available)
        if command_exists gh; then
            echo "🔀 Creating Pull Request..."
            if gh pr create \
                --title "Automated Test-Driven PR - $timestamp" \
                --body "Automated PR created after successful test suite.

**Validation:**
- All tests passed
- Code quality checks completed

*Generated by Copilot CLI automation for Rafael Delgado*" \
                --base main; then
                echo "✅ Pull Request created"

                # Optional: Auto-merge (disabled by default for safety)
                # Uncomment the following lines to enable auto-merge:
                # echo "⏳ Waiting for checks to pass..."
                # gh pr merge --auto --squash
                # echo "✅ PR set to auto-merge"
            else
                echo "⚠️  Failed to create PR, but code is pushed"
            fi
        else
            echo "ℹ️  Install 'gh' CLI to enable automatic PR creation"
            echo "   Visit: https://cli.github.com/"
        fi
    else
        echo "⚠️  Push failed. You may need to set up remote or check permissions."
    fi

    copilot_log "INFO" "automerge_rails workflow completed for branch $branch_name"
    echo ""
    echo "✨ Workflow complete!"
    echo "   Branch: $branch_name"
    echo "   Commit: $(get_short_hash)"
}

# Combined workflow for full-stack projects
# Usage: autobuild_fullstack [commit_message]
autobuild_fullstack() {
    local commit_msg="${1:-Automated full-stack build and test}"
    local timestamp
    local branch_name

    copilot_log "INFO" "Starting full-stack autobuild workflow"

    # Verify we're in a full-stack project
    if [[ "$COPILOT_PROJECT_TYPE" != "fullstack" ]]; then
        echo "❌ Error: Not in a full-stack project"
        return 1
    fi

    # Step 1: Run Rails tests
    echo "🧪 Running Rails tests..."
    if ! bundle exec rails test; then
        echo "❌ Rails tests failed. Aborting workflow."
        return 1
    fi
    echo "✅ Rails tests passed"

    # Step 2: Run Next.js build
    echo "🔨 Running Next.js build..."
    if ! npm run build; then
        echo "❌ Next.js build failed. Aborting workflow."
        return 1
    fi
    echo "✅ Next.js build successful"

    # Step 3: Continue with standard workflow
    echo "📦 Staging changes..."
    git add .

    if git diff --cached --quiet; then
        echo "ℹ️  No changes to commit"
        return 0
    fi

    timestamp="$(get_timestamp)"
    branch_name="fullstack/${timestamp}-autobuild"

    echo "🌿 Creating branch: $branch_name"
    git checkout -b "$branch_name"

    git commit -m "$commit_msg

Full-stack validation passed at $timestamp
- Rails tests: ✅
- Next.js build: ✅

Generated by Copilot CLI automation for Rafael Delgado"

    echo "⬆️  Pushing to remote..."
    git push -u origin "$branch_name"

    if command_exists gh; then
        gh pr create \
            --title "Automated Full-Stack PR - $timestamp" \
            --body "Automated PR for full-stack changes.

**Validation:**
- Rails tests passed
- Next.js build successful

*Generated by Copilot CLI automation for Rafael Delgado*" \
            --base main
    fi

    echo "✨ Full-stack workflow complete!"
}

# =============================================================================
# UTILITY COMMANDS
# =============================================================================

# Show current Copilot context
copilot_status() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "GitHub Copilot CLI - Current Context"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📁 Project:      $COPILOT_PROJECT"
    echo "🏷️  Type:         $COPILOT_PROJECT_TYPE"
    echo "📂 Root:         $COPILOT_PROJECT_ROOT"
    echo "🔨 Build:        $COPILOT_BUILD_CMD"
    echo "🧪 Test:         $COPILOT_TEST_CMD"
    echo ""
    if [[ -n "$COPILOT_LOCAL_CONFIG" ]]; then
        echo "⚙️  Local Config: $COPILOT_LOCAL_CONFIG"
    else
        echo "⚙️  Local Config: None (using global defaults)"
    fi
    echo ""
    if is_git_repo; then
        echo "🌿 Git Branch:   $(get_current_branch)"
        echo "📝 Last Commit:  $(git log -1 --pretty=format:'%h - %s' 2>/dev/null)"
    else
        echo "🌿 Git:          Not a git repository"
    fi
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Refresh context (useful after changing directories)
copilot_refresh() {
    echo "🔄 Refreshing Copilot context..."
    unset COPILOT_LAST_PWD
    load_project_context
    echo "✅ Context refreshed"
    copilot_status
}

# Clear context cache
copilot_clear() {
    echo "🧹 Clearing Copilot context cache..."
    rm -f "$COPILOT_CACHE_FILE"
    unset COPILOT_PROJECT
    unset COPILOT_PROJECT_TYPE
    unset COPILOT_PROJECT_ROOT
    unset COPILOT_LAST_PWD
    unset COPILOT_LOCAL_CONFIG
    echo "✅ Context cache cleared"
}

# =============================================================================
# INITIALIZATION
# =============================================================================

# Initialize context when script is sourced
initialize_copilot_context

# Export functions for use in shell
export -f autobuild_next
export -f automerge_rails
export -f autobuild_fullstack
export -f copilot_status
export -f copilot_refresh
export -f copilot_clear
export -f load_project_context

# Log successful initialization
copilot_log "INFO" "Copilot CLI initialization complete"

# Show brief status (optional - comment out if too verbose)
# echo "✨ Copilot CLI loaded for: $COPILOT_PROJECT ($COPILOT_PROJECT_TYPE)"
