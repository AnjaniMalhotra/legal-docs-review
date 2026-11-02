# Image prompts (Excalidraw style)

Save each image in `presentation/images/` with the exact file name below. The deck picks it up
automatically. Until then, the slide shows a placeholder naming the file.

| File | Slide | Aspect ratio |
|---|---|---|
| `01-tech-stack.png` | 5 · Tech stack | 16:9 |
| `02-architecture.png` | 6 · Architecture | 16:9 |
| `03-pipeline.png` | 8 · Pipeline | 3:1 (wide strip) |
| `04-observability.png` | 19 · Observability | 16:9 |
| `05-air-gap.png` | 3 · The promise | 16:9 |
| `06-safety-layers.png` | 13 · Safety nets | 3:4 (portrait) |

## Shared style (paste in front of every prompt)

> Excalidraw-style hand-drawn whiteboard diagram. Rough, slightly wobbly black outlines (2px marker),
> flat fills only, some shapes with diagonal hatch fill. Palette: warm cream background #F6F0E4,
> seal red #B2382B, navy #23305E, muted green #2E6B4E, mustard #B7791F. Icons instead of words; at most
> 1–3 handwritten words per label (Virgil-style hand font). No logos, no brand marks, no photos,
> no gradients, no drop shadows, lots of white space, clean left-to-right reading order.

## Prompt 1 · Tech stack (`01-tech-stack.png`)

> A layered stack drawn as five stacked hand-drawn trays inside one big dashed rounded rectangle
> labelled "one machine". Top tray: a browser window icon ("UI"). Second: a small server with a
> lightning bolt ("API"). Third: a flowchart of three circles with a pause symbol on the last one
> ("workflow"). Fourth, split in two: a database cylinder ("vectors") and a stack of three chips
> ("models"). Fifth: a gateway arch with a checklist ("gateway") next to a magnifying-glass-over-
> graph icon ("tracing"). A small gauge icon off to the side ("evals"). Outside the dashed
> rectangle, a cloud crossed out with a big red X. Tiny lock icon on the rectangle's edge.

## Prompt 2 · Architecture (`02-architecture.png`)

> System diagram inside one big dashed rectangle ("PayNest laptop"). Left: a person with a
> briefcase at a browser window. Arrow to a central box with a gear and a small flowchart ("app").
> From the app: an arrow down to a database cylinder ("Chroma"). An arrow right into a navy-dashed
> sub-box ("Docker") holding a gateway arch ("Bifrost") above an eye-over-chart icon
> ("Langfuse"). From the gateway, an arrow right to a box with three chips, sitting on a GPU card
> ("Ollama"). Thin mustard dotted arrows from the app and the gateway to Langfuse (traces). At the
> far right, outside the big rectangle, a cloud ("internet") behind a red brick wall; one thin
> arrow tries to reach it and stops at the wall with a red X. Small "one-time download" arrow
> coming IN from the cloud to the chips box, drawn faint.

## Prompt 3 · Pipeline (`03-pipeline.png`)

> A wide left-to-right journey of 8 hand-drawn stations connected by one continuous wobbly arrow,
> like a board-game track: (1) a PDF page; (2) scissors cutting the page into strips; (3) strips
> turning into little barcodes; (4) a magnifying glass picking 6 strips from a pile; (5) a robot
> head reading a strip, with a speech bubble containing a tag; (6) a shield with a tick checking
> the strip against the PDF; (7) a balance scale with a dial at "high"; (8) a person signing with
> a pen, a pause symbol above them. One-word labels under each: upload, chunk, embed, retrieve,
> classify, verify, score, sign. Stations 5 and 8 slightly larger. A red dashed boundary line
> around the whole track with a small lock.

## Prompt 4 · Observability (`04-observability.png`)

> Three stacked lenses looking at the same flow of dots moving left to right across the page.
> Top lens (navy): a gateway arch with a stopwatch, looking at the arrows ("which model, how
> long"). Middle lens (red): an eye over a tree of nested boxes, like a trace with steps ("every
> step"). Bottom lens (green): a judge's gavel next to a tick-mark checklist ("is it faithful").
> All three feed into one dashboard sketch on the right with a small bar chart and a line chart.
> Everything sits inside a dashed rectangle with a lock icon; outside it, a crossed-out cloud.

## Prompts 5 and 6

**Air-gap concept (`05-air-gap.png`, 16:9):**
> A small house-shaped office with a padlock, containing a contract, a brain-shaped chip and a
> database cylinder. Around it, a thick red dashed fence. Outside, three different cloud shapes
> each crossed out. Little dots circulate only inside the fence.

**Safety layers (`06-safety-layers.png`, 4:3):**
> A contract clause dropping through four stacked sieves like a funnel: (1) a shield with a tick
> (quote checked), (2) a red flag (walk-away words), (3) a ruler with numbers (days and percent),
> (4) a pause button with a person (lawyer). Arrows show that items can only move toward "stricter"
> (red side), never back. A tiny robot at the top drops the clause in.
