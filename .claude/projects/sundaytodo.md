- Test all the settings in the season edit
- Create edit player page similar to season

Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

--- Continue: Player Import Tool

We were building a player/season data import tool. Here's the status:

Completed:

- Created players.md with all BB1-BB27 players (hometown, finish_place,  
  evicted_date)
- Created cities_with_coords.csv with lat/lng for all cities
- Updated ImportPage.php to read both files and merge geo data
- Added "Run Migration" buttons to Dev Tools page for adding hometown columns  
  and finish_place column
- Moved Dev Tools to be submenu of bbjd-dashboard

Next steps:

1. Set up local MySQL MCP (you were about to do this)
2. Clear orphaned player data locally: DELETE FROM wp_bbj_v2_player_season;  
   DELETE FROM wp_bbj_players;
3. Run the migrations on Dev Tools page (add hometown cols + finish_place col)
4. Import seasons first (if not done)
5. Import players

Key files:

- .claude/data/players.md - player data from ChatGPT
- .claude/data/cities_with_coords.csv - geo coordinates
- wp-plugin/.../Admin/Pages/ImportPage.php - import logic
- wp-plugin/.../Admin/Pages/DevToolsPage.php - migration buttons
