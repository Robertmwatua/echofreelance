# Footer map preview

The footer's "Visit & contact" card shows a static map of the school instead of an embedded
Google Maps frame. The card still links out to `SCHOOL_MAP_URL`, so Street View and directions
are one click away.

## Why static

- It paints immediately and always, with no third-party frame that can come back blank.
- No Google cookies or tracking are loaded on every page of the site.
- Two tones ship, so the map belongs to the light and the dark theme rather than glaring
  white inside the dark footer.
- Nothing in the footer can trap the page scroll.

## The files

| File | Used by |
| --- | --- |
| `apps/web/public/map-malindi-light.png` | `.school-footer-map-canvas` |
| `apps/web/public/map-malindi-dark.png` | `[data-theme="dark"] .school-footer-map-canvas` |

Both are 1000×400 device pixels, centred on the coordinates in `apps/web/lib/brand.ts`
(`-3.2196845, 40.1096298`) at zoom 17, with the school pinned in `--accent`.

## Regenerating

Run this only when the school's coordinates change — it fetches about fifteen tiles:

```bash
python3 apps/web/scripts/build-footer-map.py \
  apps/web/public/map-malindi-light.png \
  apps/web/public/map-malindi-dark.png
```

Edit `LAT`, `LON` and `ZOOM` at the top of the script to match `brand.ts` first. The script
needs Pillow (`pip install Pillow`).

## Attribution

Tiles come from OpenStreetMap, whose licence requires visible credit. The card carries
"Map data © OpenStreetMap" in its top-right corner (`.school-footer-map-credit`), outside the
link so it stays out of the link's accessible name. Keep that line if you change the card.
