# Full Push - Git + Vercel + WordPress Plugin (STAGING)

Push all changes to git (triggers Vercel staging deployment) and deploy the WordPress plugin to staging.

## Instructions

1. **Stage and commit all changes to git:**
   - Run `git status` to see changes
   - Run `git diff --stat` to review what changed
   - Add all relevant files with `git add`
   - Create a commit with a descriptive message
   - Push to the current branch

2. **Deploy WordPress plugin to STAGING:**
   - Run the deploy command:
   ```bash
   bash /c/xampp/htdocs/bbj-app/.claude/scripts/deploy-plugin.sh --staging
   ```

3. **Report success:**
   - Confirm git push completed
   - Confirm Vercel will auto-deploy staging
   - Confirm WordPress plugin deployed to **staging**

## Notes
- This pushes to STAGING - safe for testing
- Use `/full-push-live` when ready to deploy to production
- WordPress plugin is deployed from local `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data`
