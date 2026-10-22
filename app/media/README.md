# Exercise media slot

This directory is **empty on purpose**, and IronLog ships **no third-party
exercise media**.

## Why the dataset's GIFs are not here

The exercise dataset this project draws on
([`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset))
is MIT licensed — but its `LICENSE` carries an explicit **MEDIA EXCEPTION** that
carves the media out of that MIT grant:

> The MIT license above covers ONLY the code, tooling, dataset structure, and
> instruction text/translations in this repository.
>
> It DOES NOT cover the exercise media in the `images/` and `videos/`
> directories. That media is © Gym visual (https://gymvisual.com/) and is
> included here with the rights holder's written permission, at 180×180
> resolution, and must retain the attribution "© Gym visual —
> https://gymvisual.com/". Its use and reuse are governed by Gym visual's Terms
> & Conditions and by `NOTICE.md` in this repository — NOT by the MIT license
> above. **Cloning this repository does not grant you any license to the media;
> obtain your own from Gym visual.**

So the thumbnails and animation GIFs are somebody else's copyright, and having a
copy of the repo is not permission to publish them. Redistributing them from a
public site would infringe, regardless of what the rest of the dataset allows.

The instruction **text** is a different matter: that is inside the MIT grant, so
IronLog ships all ten language packs and keeps the attribution with them. See
[`NOTICE`](../../NOTICE).

There is a second, more mundane reason: the media is **138 MB** (1,324 images and
1,324 videos). It would dominate a repository whose entire application code is
under 1 MB.

## What renders instead

`app/js/diagrams.js` draws an original **movement diagram** for every exercise —
animated vector geometry generated from the dataset's own MIT-licensed fields
(`category`, `muscle`, `muscleGroup`, `target`, `equipment`,
`secondaryMuscles`).

It is deliberately not a picture of a person. It is a lever, an arc, a travel
path and a force vector: the mechanics of the movement. That makes it themeable
(light and dark), sharp at any size, a few hundred bytes instead of a few
hundred kilobytes, and it animates — which a 180×180 GIF does not do well.

Alongside it, a **muscle graph** places the primary muscle at the centre with
its secondaries ranged around it, joined by linework that draws itself in.

## Supplying your own media

If you have media you are entitled to publish — your own footage, a licence from
Gym Visual, or anything else you hold the rights to — drop it in this directory
named by the exercise id:

```
app/media/ds-0289.gif
app/media/ds-0289.webp
app/media/ds-0289.mp4
app/media/ds-0289.jpg
```

The id is the one shown in the exercise detail sheet, and for catalogue entries
it is the `ds-` prefixed id. `MEDIA_EXTENSIONS` in `app/js/diagrams.js` lists the
extensions probed, in order, and `mediaPath(id, ext)` builds the path.

Then call `exerciseMedia(exercise, { mediaUrl, mediaCredit })` with the resolved
URL. It renders an `<img>` with `loading="lazy"`, `decoding="async"` and explicit
`width`/`height` so it cannot shift the layout, plus a `<figcaption>` carrying
whatever credit you pass.

**If you do supply Gym Visual media, the credit is not optional** — their terms
require `© Gym visual — https://gymvisual.com/` to travel with it, and
`exerciseMedia()` uses exactly that string as its default for this reason.

## The guard

`tests/catalogue.test.js` asserts that no media reference survives into the
shipped data, and the deploy workflow has a step (`Assert no third-party media
is shipped`) that fails the build if a binary media file is committed anywhere
outside `assets/img/` and `app/icons/`. Adding files here deliberately will trip
that step; that is the guard working, not a bug. If you are adding media you
have the rights to, update the workflow's exclusion list in the same commit so
the intent is recorded.
