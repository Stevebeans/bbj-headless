# New Feature Plan

Start a new feature development with a dedicated git branch.

## Instructions

1. **Get feature info from user arguments**
   - The user should provide: `branch-name: description of feature`
   - Example: `/new-plan comment-avatars: Add avatar upload system for comments`
   - If no arguments provided, ask the user for a branch name and feature description

2. **Parse the input**
   - Extract branch name (everything before the colon, kebab-case)
   - Extract feature description (everything after the colon)
   - If no colon, treat the whole argument as description and generate a branch name from it

3. **Create and switch to new branch**
   - Run `git status` to ensure working directory is clean
   - If there are uncommitted changes, warn the user and ask if they want to stash them first
   - Create branch with: `git checkout -b feature/{branch-name}`
   - Confirm the branch was created

4. **Launch feature-dev skill**
   - Use the Skill tool to invoke `feature-dev:feature-dev`
   - Pass the feature description so it understands what to build

## User input:
$ARGUMENTS
