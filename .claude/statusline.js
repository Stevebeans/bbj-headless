const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read JSON input from stdin
let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(inputData);
    
    // Extract data
    const model = data.model?.display_name || 'Claude';
    const currentDir = data.workspace?.current_dir || '';
    const remaining = data.context_window?.remaining_percentage;
    
    // Get directory name
    const dirname = currentDir ? path.basename(currentDir) : '';
    
    // Get git branch (if in a git repo)
    let branch = '';
    try {
      if (currentDir) {
        branch = execSync('git branch --show-current', {
          cwd: currentDir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
      }
    } catch (e) {
      // Not a git repo or git not available
    }
    
    // Build status line
    const parts = [];
    
    if (remaining !== null && remaining !== undefined) {
      parts.push(`ctx:${Math.round(remaining)}%`);
    }
    
    parts.push(model);
    
    if (branch) {
      parts.push(`git:${branch}`);
    }
    
    if (dirname) {
      parts.push(dirname);
    }
    
    process.stdout.write(parts.join(' | '));
    
  } catch (error) {
    process.stdout.write('Error reading status');
  }
});
