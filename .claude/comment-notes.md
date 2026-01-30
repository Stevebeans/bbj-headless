Alright, I want to start a new project for comment section.  This one will be tricky as it has multiple parts but let me try to explain. 

 ## Comment Project
 IN C:\xampp\htdocs\bbj-app\old_reference I have a comment system I generally like that I built a while ago, however it just wasn't complete.  But it had things like rankings and titles based on how many posts they have.  
 
 ## Old Likes Count
 Now, if you look through the api and trace it to my folder, what I used to do is pull the old likes/dislikes from the wpdiscuz table. I believe it is the `wp_wc_users_voted` table.  You can view it in MCP mysql-bbj-live. I think I may want to create a new table like wp_bbj_comment_likes and create a script that essneitally copies the entire structure from wp_wc_users_voted so we can just start using that and stray completley away from the WPDiscuz plug. 

 ## Rankings and Badges 
 In C:\xampp\htdocs\bbj-app\old_reference\src\utils\rankCalc.js you can see the rankings I want to use for people. The only problem is I don't remember where I got hte actual ranks from the `comment.user_rank` section in CommentCard.jsx so you may have to look that up. 

 ## Other Features 
 I would also like some other features that WPDiscuz has like a downvote and a report comment feature that will do something. Feel free to suggest a good way to handle reporting and hiding comments until approved/deleted.  In addition, Having a the gear icon they have that opens the dropdown.  If it's the author of the post, general 'Edit' 'Delete' is showing, however if it's an admin / comment moderator / etc then show the rest like 'Delete' 'Unapprove' 'Spam' 'Blacklist' (prevents user ID or IP from commenting)

## Suggestions
Again based on everything you know about comment systems online feel free to offer any suggestions on a nice comment system that's not only highly functional and fluid but fast and doesn't bog down the server. Ideally also a way to handle a lot of comments whethre pagination or lazy load or scroll. 



x", "-y", "@benborla29/mcp-server-mysql"],
      "env": {
        "MYSQL_HOST": "45.55.225.162",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "duesaptjae",
        "MYSQL_PASS": "YSuT8T89au",
        "MYSQL_DB": "duesaptjae"
      }