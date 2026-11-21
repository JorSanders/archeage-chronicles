# ArcheAge Chronicles rift timers

I kept missing the rifts in ArcheAge Chronicles because the times are in UTC and I never remember the offset. So I made a tiny page that shows when the next Crimson Rift and Brutal Nightmare start in my own time zone, and pings me 10 minutes before.

Live at **https://aac.jor.dev/**

## Features

1. Two rifts, every day, 30 minutes each:
   - Crimson Rift at 03:00, 11:00 and 19:00 UTC
   - Brutal Nightmare at 04:00, 12:00 and 20:00 UTC
2. The daily reset at 04:00 UTC. No notification for that one.
3. A timeline of today, laid out like the daily schedule in the game: one row per event, a column per hour, a bar for each rift, a triangle for the reset and a line for now. Rifts that are over fade out, the one that is running gets an outline.
4. Next to each row, a countdown to the next start, or "Live now" with a countdown to the end while it runs.
5. The timeline runs from midnight to midnight in your browser's time zone. Hover a bar to see its UTC time.
6. Browser notifications 10 minutes before each rift starts:
   - turn them on with the button, the browser asks for permission once
   - the choice is remembered, so reopening the page keeps them on
   - "Send a test" shows what a reminder looks like
7. What I tested: Chromium on desktop, with a faked clock to check the reminder fires at exactly 10 minutes before. I have not tried Firefox, Safari or a phone yet.

## How the notifications work

There is no server. The page checks every second whether a rift is 10 minutes away and shows the notification itself, so it only works while the page is open in a tab. A background tab is fine, but browsers slow down timers in background tabs, so a reminder can arrive up to about a minute late. Closing the tab or the browser stops them.

Real push notifications that arrive with the tab closed would need a push server and a subscription per browser. I kept it simple for now.

On an iPhone or iPad, Safari only allows notifications for pages added to the home screen, and this page does not have a web app manifest yet, so it will say notifications are not supported there.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Notifications work on `localhost` too, browsers treat it as a secure origin.

## Files

```
index.html            the page
src/main.js           renders the timeline and countdowns, wires up the buttons
src/schedule.js       the rifts and daily reset in UTC
src/notifications.js  permission, the on or off choice, and the reminders
src/format.js         time and countdown formatting
src/style.css         styles on top of the brand tokens
service-worker.js     shows notifications on Android and focuses the page on a click
brand/                jor.dev brand copied by brand/scripts/install.sh
favicon.svg           the jor.dev icon, from brand/logo/icon.svg
favicon.ico           32x32 icon from brand/logo/png/
apple-touch-icon.png  180x180 icon, also the notification icon
og-image.png          1200x630 social preview
CNAME                 aac.jor.dev
.nojekyll             disables Jekyll on GitHub Pages
robots.txt            crawler policy with the sitemap URL
sitemap.xml           sitemap
LICENSE               the Unlicense
.editorconfig         editor settings shared across my projects
```

## Disclaimer

The schedule and reset time are what I was told and saw in game, not from an official source. If the times change or are wrong, let me know. ArcheAge Chronicles is a trademark of its owners, this is an unofficial fan page.

## Any issues?

This is a hobby project I have spent quite some hours on. If you have any issues, feel free to open a GitHub issue or contact me. Otherwise, this code is unlicensed, so do whatever you want with it: https://unlicense.org/

## Buy me a coffee

Don't. If you let me know you used or enjoyed this, you have already made the best donation.
