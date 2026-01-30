# Git Push to Main

Push all changes to the main branch on GitHub.

## Instructions

1. Run `git status` to see what's changed
2. If there are no changes to commit, let the user know and stop here
3. Run `git diff --stat` to summarize the changes
4. Run `npm run build` to ensure the production build succeeds
   - If the build fails, show the errors and DO NOT proceed with the commit
   - The user must fix build errors before pushing
5. Stage all changes with `git add -A`
6. Create a commit with a descriptive message based on the changes. The message should:
   - Summarize what was added/changed/fixed
   - Be concise (1-2 lines)
   - End with: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
7. Push to origin main with `git push`
8. Confirm success and remind user that Vercel will auto-deploy

## Notes from user (if provided):
$ARGUMENTS
