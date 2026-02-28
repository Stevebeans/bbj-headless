Alright,
This is going to be a team project. I would like a deep thorough dive into authentication with nextjs between wordpress and ensure that it all looks correct based on new opus 4.6 standards. This means even little things like for example when I currently load in as an admin, it eventually shows my icon and bell for notifications but does not show the admin badge (which lets me visit admin screen) (/admin) until I refresh.

Once that is done, I would like to really fine tune my /admin/settings section on 'feature permissions' and probably go into brainstorm mode to really analyze better roles for people and waht they can actually see and do and then ideally build that into some sort of global function which can easily check permissiions. I know not everything will be permission based, take 'admin' for example. There are admin settings (comment reviews/moderation, player/season handling, etc) and then there are ADMIN settings (site settings, permissions, analytics, etc). I want to be able to tell you "Hmm, I think Manage Seasons and PLayers' should be a level of control and then you can not only build it in, you will add it to the 'feature permissions' table so I can select the role who gets to see that.

I'm not sure if that's the smartest approach on handling this but I essentially want a bucket of people who:

a) Are pure admin (me) super admin access to everyone.
b) Maybe second tier admin who have access to most (probably 'second in command') except for key sensitive issues related to the site
c) Comment moderator
d) PLayer/Season editor
e) Feed updater

I can't reallyt hink of anything else it's basically what we have now from looking at the screen so in reality it may not be a whole lot of coding other than building out the global functions to flag the permissions.

Another final thing would be to have an info icon next to admin, second in command, and pretty much everything except for 'supporter' that I can hover over and it'll show a modal with a list of everyone in that role.
