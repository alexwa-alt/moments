# Seesaw Showdown ⚖️

A pair-work game for Y10 Physics: **moments (turning effects)** and **centre of gravity**.
Students take a photo of themselves and their partner. Those faces become the characters
on the seesaw and the bus, and the balloons when they get an answer right.

## What is in the game

| Round type | Skill |
|---|---|
| Spanner turn | moment = force × distance (includes cm to m conversions) |
| Balance the seesaw | principle of moments, find an unknown distance or weight |
| Which way will it turn? | compare total clockwise and anticlockwise moments (1 or 2 loads per side) |
| Find the centre of gravity | drag a pin onto the CoG of rectangles, triangles, L, T and house shapes |
| Topple test | does the line of action of the weight fall inside the base of a bus on a slope? |

Pairs take turns. The other person is the "checker" and a **Talk it over** prompt is shown on
screen every round. Each question allows two tries, then shows the worked answer.

## Privacy

Photos are kept in the browser's memory only. They are never uploaded, stored or sent anywhere,
and vanish when the tab is closed or refreshed. There is also a "use cartoon faces" button
for anyone who prefers not to use a photo.

## Put it on GitHub Pages (no software to install)

1. On github.com, click **New repository**. Name it, for example, `seesaw-showdown`. Choose **Public**.
2. On the new repository page click **uploading an existing file**.
3. Drag in **everything from this folder**: `index.html`, `style.css`, `README.md` and the whole `js` folder.
   Keep the `js` folder as a folder (the files inside must stay in `js/`).
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**,
   branch **main**, folder **/ (root)**, then **Save**.
6. After a minute or two your game is at `https://YOUR-USERNAME.github.io/seesaw-showdown/`.

The camera only works on secure (**https**) pages. GitHub Pages is https automatically.
The first time, the browser will ask each student for permission to use the camera.

## Using it inside Moodle

Add the link as a **URL** resource, or embed it with an iframe. If you use an iframe you **must**
include `allow="camera"` or the camera will be blocked:

```html
<iframe src="https://YOUR-USERNAME.github.io/seesaw-showdown/"
        allow="camera" width="100%" height="900" style="border:0"></iframe>
```

If the camera is still blocked, the "Take / choose photo" button on each card works as a backup
(on iPads and phones it opens the camera directly).

## Changing things

| To change... | Edit |
|---|---|
| The numbers used in questions (weights, distances, shapes, angles) | `js/questions.js` |
| Which rounds are in each game, and how many | `buildRounds` in `js/game.js` |
| Colours | the `:root { ... }` block at the top of `style.css` |
| Celebration phrases | `WIN_LINES` at the top of `js/effects.js` |
| Points per question | `finishRound` in `js/game.js` |

## Files

```
index.html        the page: four screens (photos, menu, game, results)
style.css         how it looks
js/faces.js       camera, photo capture, drawing faces
js/questions.js   makes the physics questions and checks answers
js/scenes.js      draws the spanner, seesaw, bus and pin pictures
js/effects.js     balloons, confetti, sounds, banners
js/game.js        the game flow, scoring and buttons
```
