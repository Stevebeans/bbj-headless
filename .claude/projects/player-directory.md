### Player Directory

This is going to be pretty basic. I am going to have a root /bigbrother-players/ page that will be a filterable directory of players similar to what I had here
`https://bigbrotherjunkies.com/player-directory/`

Ohhh maybe I should have this...

Directory [link] ->

(tabbed)
Seasons | Players | Map

---

Seasons is a basic list of seasons nothing too complex with links to the seasons
Players is a searchalble/filterable directory similar to this https://bigbrotherjunkies.com/player-directory/ except using the same theme (player cards?) that I have here http://localhost:3000/bigbrother-seasons/big-brother-27
Map will be a US google map with player thumbnail where they live (based on the city which I pull a general city listing in google)
Feel free to suggest anything for any of those.
Feel free to also suggest any premium only features

--- Also be sure to add areas for ad blocks. Nothing major though but ads here and therre

Notes from feedback

- Player geo is actually in wp_bbj_geo and remember that because I'll likely be importing more players soon
- Map is not a priority if it's a complex project. Maybe better to wait until I import more players so we have a better understanding of how it would look with a full DB
- Premium yea you can build that in now. Assuming we have a 'is_premium' flag somewhere built in (check code) if not we can put a pin in that for other premium features later on.

-- Be sure to update the breadcrumsb on profile pages to reflect the new hub

Todo:

- [x] Add sidebar to players / seasons / stats page
- [x] Add dropdown for players per page on the directory with the default to 25 but have 10/25/50/100
- [x] Ensure the status is based on their best result (winner > runner_up > afp > active - done in PlayerRoutes.php)
- [x] With the seasons I'd rather have it look like this https://bigbrotherjunkies.com/bigbrother-seasons/ (table format with winner/afp/runner-up and 'edit' link for admins)

Note: Need to push SeasonRoutes.php and PlayerRoutes.php changes to production for winner/afp/runner-up data to appear.

- [x] Make the player directory 3 across on desktop
- [x] Add small buttons for winner and afp (trophy icon for winner, star icon for AFP)
- [x] Show the highest rank they made either evicted or jury (status now shows winner > runner_up > afp > jury > evicted)
- [x] Make the background of the seasons table white or the same as all the other containers
- [x] Add filter for Winners/AFP/Runner Ups
- [x] Add filter button with modal (checkboxes for gender + achievement)
- [x] Add sort button with modal (first name, last name, age, season - A-Z/Z-A)
- [x] Shrink per-page dropdown

Note: PlayerRoutes.php updated to support multi-value filters (comma-separated) and new sort options (first_name, last_name, age). Push to production required.
