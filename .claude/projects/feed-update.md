## Feed Update Project

This is my core bread and butter of the site. I currently have it as a CPT as live-feed-updates but I'm not even sure I need that. I mean it's good to dig into that for historical feed updates, but the reality is, most of my feed updates consist of 1-2 line updates. Sometimes a bit longer but basically just 'soando is currently doing this' or 'soandso has voted to evict ....' you get it. Basically recalling whatever is happening on the live feeds or the show. Although sometimes I do live update during a CBS show and I wonder if I should have a note that I'm doing live updating or feed updating. Maybe a different tab? Would pretty really care?

Anway what I right now for an updater is the updater.jpg file in this folder It just lets me toss feed updates into the home page as well as wherever I display feed updates (feed update section, sometimes add as a block in my posts). Ideally it's something smiliar to the image unless you know of a better UX experience. Also, if we go with just a custom table for feed updates rather tahn CPT and new wp_posts every update, then we probably just need one field that has basic html elements like paragraph breaks and stuff (a basic WYSIWYG editor)

People who h ave access to feed updates are obviously admin, updater (wordpress role), second_in_command

## Premium Feature

On the home page and the feed update page, premium users will get an auto update on feeds if they turn it om (toggle in the user settings). Ideally maybe other fun stuff for premium.

## API

I would like to connect to bluesky, facebook, and twitter and auto push updates there. I want Bluesky checked by default with X and FB not

For all, add the hashtag of the current season abbreviation #bb27

For Facebook, Ideally have something like
<<< Feed Update - Spoiler Warning >>>
<few line break so they don't see>
[Update (time) - Jack went into the back room to talk to Susan and they are plotting]

For X and Bluesky, just

[Update (time) - Jack went into the back room to talk to Susan and they are plotting]

Essentially warn facebook of a feed update. And also recommend that I include an image if I have facebook checked. This will post to my big brother page

## SEO Impacts

I want to ensure everything is best for SEO so if creating a new sperate page for feed updates where people can comment on them, upvote them, etc is good or not. Please advise.

## Note

Absolutely ask any questions or offer suggestions I'd love to hear your input on the best way to handle feed updates that are great for hte server, great for speed,

## Questions from Claude

1 - If the performance is nothing, then keep CPT. My only concern with that was the performance. I don't mind CPT otherwise
2 - Both. I definitely want it available on all pages plus an admin page would be nice
3 - Twitter doesn't have a free tier? If not, scrap that. Bluesky is fine, and Facebook is nice because I post there a lot so I'd like to be abel to post to FB from my site rather than repeating it
4 - Isn't there a way to have the component auto update when something is added or is that an issue with caching and such where we need to just refresh it every 30 seconds
4b - Yes, a teaser is great
5 - Using a 1-10 scale
Sorting - 6
Date Range - 5
Search within - 6
Upvote / Downvote - 4
Comments on updates - 8 if it's a nice system that ideally just uses the default comment system we have
Pagination vs infinate - Pagination defaults to a decent amount but premium get to change their default to xx per page

6 - Yea that's what I'm thinking. Maybe a toggle on the feed update box that stays until I toggle otherwise and have some visial indicator on the feed updates 'Feed Update' or 'Show Update' because I may do other shows and will likely be using the same system to live comment on the other shows I cover

7 -
A - Yea, I think so. People react better to images
B - what do you mean?
C - Auto generate preview?
