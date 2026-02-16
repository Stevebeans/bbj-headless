# Full Push Live - Git + Vercel + WordPress Plugin (PRODUCTION)

Push all changes to git and deploy the WordPress plugin to PRODUCTION. Use with caution.

## Instructions

1. **Stage and commit all changes to git:**
   - Run `git status` to see changes
   - Run `git diff --stat` to review what changed
   - Add all relevant files with `git add`
   - Create a commit with a descriptive message
   - Push to the current branch

2. **If on a feature branch, offer to merge to main:**
   - Ask user if they want to merge to main
   - If yes, checkout main, pull, merge, and push

3. **Deploy WordPress plugin to PRODUCTION:**
   - Run the deploy command:
   ```bash
   cd /c/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data && \
   tar -cf /tmp/plugin.tar --exclude='node_modules' --exclude='.git' --exclude='.DS_Store' . && \
   gzip -f /tmp/plugin.tar && \
   scp /tmp/plugin.tar.gz bbj-prod:~/plugin.tar.gz && \
   ssh bbj-prod "cd /home/1358704.cloudwaysapps.com/duesaptjae/public_html/wp-content/plugins/bigbrotherjunkies-data && rm -rf src vendor assets build && tar -xzf ~/plugin.tar.gz && rm ~/plugin.tar.gz" && \
   rm /tmp/plugin.tar.gz
   ```

4. **Report success:**
   - Confirm git push completed
   - Confirm Vercel will auto-deploy (if pushed to main)
   - Confirm WordPress plugin deployed to **production**

## Notes
- ⚠️ This pushes to PRODUCTION - make sure changes are tested on staging first
- Vercel only auto-deploys from `main` branch (per project settings)
- WordPress plugin is deployed from local `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data`
- Use `/full-push` for staging deployments
