# Elmendorp Tours & Travel

A one-page website for a Kenyan tour company. It opens with three full-screen films that change as you scroll down:

1. **Safari** · the real Land Cruiser and the Baba Yaga nganya on a murram track in the Maasai Mara ("Travel in style" / "Or by party bus")
2. **Maasai** · warriors doing the adumu jumping dance at sunset
3. **Coast** · the turquoise lagoon at Malindi, with the reef, palms and a dhow under sail ("End at the ocean" / "And much more")

One swipe on a phone, one notch of the mouse wheel or one press of the arrow keys moves on one film: the next one rises up over the last and the page settles on it. Swiping back down goes back a film. After the third film, the list of ten places slides up over it, and from there the page scrolls normally through the places, the fleet, a booking form with a calendar that opens WhatsApp, and the footer. The films loop on their own; there is no pause button.

There are no frameworks and no build step. It is plain HTML, CSS and JavaScript, so it runs on GitHub Pages as it is.

## Put it online with GitHub Pages

1. Create a new repository on GitHub, for example `elmendorp-tours`.
2. Upload everything in this folder, keeping the folders as they are (`index.html` must sit at the top level). You can drag the files into **Add file → Upload files**, or from a terminal:
   ```bash
   git init
   git add .
   git commit -m "Elmendorp Tours site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/elmendorp-tours.git
   git push -u origin main
   ```
3. In the repository go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/elmendorp-tours/`.
5. Optional custom domain (for example `elmendorptours.co.ke`): add it under **Settings → Pages → Custom domain**, then create a `CNAME` DNS record at your registrar that points `www` to `<your-username>.github.io`.

To preview on your own computer first, run `python3 -m http.server 8000` in this folder and open <http://localhost:8000>.

## Change the words, the places and the contact details

Everything you are likely to edit is in **`assets/js/content.js`**:

- `whatsapp`: the business number in international format without the plus sign, for example `'254712345678'`. When it is set, WhatsApp buttons appear and the booking form opens WhatsApp with the customer's request already typed out. Nothing needs a server.
- `phone`, `email`, `base`: shown in the booking section. The e-mail address is also used by the form when there is no WhatsApp number.
- `chapters`: the three films. For each one: the small label (`eyebrow`), the headlines (`beats`), the coordinates shown bottom right, the button text and the video files.
- `places`: the ten places in the list, in order. Each has a title, a length, one line of text and a picture (`img`). A tap on a tile opens the booking form with that place filled in, and the form's trip list updates itself.
- `rides`: extra choices at the end of the form's trip list (ride hire, transfers).

The fleet section (the two vehicles) is written directly in `index.html`; search for `id="fleet"`.

## Use your own footage

The films in `assets/media/` are original 3D renders. Real drone footage of your own vehicles is the best upgrade you can make, and swapping a clip only takes a new file:

| File | Shown on | Size |
|---|---|---|
| `safari-wide.mp4` | laptops, tablets and phones held sideways | 1920 × 1080 |
| `safari-tall.mp4` | phones held upright | 1080 × 1920 |
| `maasai-wide.mp4`, `maasai-tall.mp4` | as above | as above |
| `coast-wide.mp4`, `coast-tall.mp4` | as above | as above |

Each clip has a poster image with the same name ending in `.jpg`; it shows while the video loads, so it should be the clip's first frame.

The fleet section plays two short clips cut from the safari film: `assets/media/fleet-cruiser.mp4` and `assets/media/fleet-nganya.mp4` (960 × 640, with `.jpg` posters). They only load and play while the fleet is on screen.

The ten place pictures are in `assets/img/places/` (640 × 480 JPEGs, shown at 4:3). Replace any of them with your own photo under the same name.

Convert any clip into the right format with [ffmpeg](https://ffmpeg.org) (replace the file names):

```bash
# wide version (16:9)
ffmpeg -i my-clip.mov -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" \
  -c:v libx264 -preset slow -crf 20 -maxrate 12M -bufsize 24M -pix_fmt yuv420p -g 30 \
  -movflags +faststart -an assets/media/safari-wide.mp4

# tall version (9:16), cut from the centre of the same clip
ffmpeg -i my-clip.mov -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -c:v libx264 -preset slow -crf 20 -maxrate 12M -bufsize 24M -pix_fmt yuv420p -g 30 \
  -movflags +faststart -an assets/media/safari-tall.mp4

# poster from the first frame
ffmpeg -i assets/media/safari-wide.mp4 -frames:v 1 -q:v 3 assets/media/safari-wide.jpg
ffmpeg -i assets/media/safari-tall.mp4 -frames:v 1 -q:v 3 assets/media/safari-tall.jpg
```

Keep clips between 5 and 12 seconds and without sound (browsers only autoplay muted video). Each film loops while its chapter is on screen. If a clip is a different length, update the `at` times of its headlines in `content.js`.

## How it stays light and smooth

- Each film change takes one screen of scrolling, and the page settles on every film by itself. On phones the films follow the finger, and when it lifts the page glides on to the next film (or back, after a small nudge) at the speed of the swipe, one film per swipe. With a mouse, trackpad or keyboard the page finishes the move in the direction you were going. Once the list of places is on screen, scrolling is completely normal.
- The films are video, decoded by the phone's or laptop's video hardware.
- Only the chapter on screen plays, plus the next one while it is coming in. Once a film can play through, the next one starts loading, so it is ready when the visitor swipes. Every film stops once the list of places has covered them.
- The scroll effect only moves and fades layers (no re-layout), and nothing on top of the films uses blur, which is a common cause of stutter on phones.
- Phones held upright get their own vertical cut instead of a cropped landscape video.
- Visitors who ask their device for reduced motion get still posters instead of the films, a simple wipe and ordinary scrolling with no gliding.
- If a phone blocks autoplay (for example an iPhone in Low Power Mode), the films start on the visitor's first tap or swipe, and a **Play the films** button appears in the meantime.
- The place pictures load lazily as the list scrolls into view.
- To make the glides quicker or slower, change `280 + 200` in the `glideTo` function in `assets/js/site.js` (milliseconds for a glide, plus extra per screen travelled).

## What is in the folder

```
index.html                 the page
assets/css/site.css        layout, type and the scroll effect's styles
assets/js/content.js       words, places, contacts and video paths (edit this one)
assets/js/site.js          the scrolling films, the place tiles, the calendar and the booking form
assets/media/              the six films, the two fleet clips and their posters
assets/img/                the tab icon, and places/ with the ten place pictures
assets/fonts/              Archivo and IBM Plex Mono, served from this site (SIL Open Font License, see the .txt files)
.nojekyll                  tells GitHub Pages to serve the files as they are
```

## Credits and notes

- The films and the place pictures were rendered for this site with Blender's Cycles path tracer: the landscapes, animals, people and boats were all modelled for it, and no stock footage is used.
- The Land Cruiser and the nganya in the safari film and the fleet clips are photographs of the real vehicles, cut out and placed on the 3D vehicles frame by frame (rolling wheels, shadows, dust in front). The photos are not ours: the Land Cruiser is from JaeTravel Expeditions and the "Baba Yaga" nganya from a YouTube video. Get the owners' permission before the site goes live, or send photos of your own vehicles to have them swapped in.
- The place descriptions are written for this site. Lengths are typical; check them, and add prices if you want them on the page.
- Fonts: [Archivo](https://fonts.google.com/specimen/Archivo) by Omnibus-Type and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) by IBM, both under the SIL Open Font License 1.1.
