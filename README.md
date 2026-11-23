# Finish the Line — redesign demo

A small demo of a new look for [Finish the Line](https://play.neilkakkar.com/finish-the-line/), the daily game where you see the first part of a real chart and draw what happened next.

This is a design demo, not the full game. It always shows the same three charts (day 6 of the live game), and it keeps no streak or statistics.

## What it shows

- **Play:** the page teaches the game on the chart itself. A hand-drawn hint traces from the dot to the right edge; there is no pop-up on the first visit.
- **Reveal:** the real line is drawn over yours, the space between is shaded, and the score counts up.
- **Results:** the total, a small chart for each of the three rounds, and a share button.
- **Two themes:** Paper (light) and Night (dark). The page follows the system setting; the "?" sheet has a switch.
- **Phone and desktop layouts.**

The scoring rules are the same as the live game: each chart is worth up to 100 points, a mean distance of one quarter of the chart's height scores zero, and "2× score" doubles one chart.

## Run it

There is no build step. Serve the folder with any static server:

```bash
python3 -m http.server 4610
```

Then open http://localhost:4610.

## Files

- `index.html`, `style.css`: the page and both themes.
- `src/app.js`: the chart, the drawing, the reveal and the results.
- `src/game.js`: the scoring rules.
- `src/series.js`: the data for the three charts.

## Data

World Bank Open Data and Our World in Data, from the World Inequality Database (CC BY 4.0).
