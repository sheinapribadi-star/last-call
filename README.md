# Last Call

When to have your last coffee tonight, for any drink, any size and any bedtime, built on a 2023 meta-analysis of 24 sleep studies.

**Live:** https://sheinapribadi-star.github.io/last-call/

## The idea in plain English

Most people run on a rule like "no coffee after 2." It ignores what you drank, how big it was, how fast your body clears caffeine, and when you actually go to bed.

A 2023 meta-analysis by Gardiner and colleagues pooled 24 studies and found caffeine cost an average of 45 minutes of sleep. It named two cut-offs: a cup of coffee (107 mg) at least 8.8 hours before bed, and a pre-workout scoop (217.5 mg) at least 13.2 hours before bed. Those are useful, but they cover two drinks, and only the last one you had.

So I looked for one rule underneath both. If caffeine halves every 4.3 hours, both published cut-offs leave the same amount in your body at lights out: **about 27 mg, a little less than a can of cola.** That becomes the line. Last Call keeps you under it from lights out until morning, whatever you drink and however many you stack.

The site has three parts:

1. **Tonight's last calls.** A café letterboard where the prices are replaced by the latest time you can have each drink. Set your bedtime and it updates. Times that have already passed today are struck out.
2. **Your day so far.** An order ticket where you log what you actually drank. It shows what will still be on board at lights out, the last call for one more of your usual, and, if you are over the line, the smallest fix (move your last drink to a specific time, or swap it for something lighter).
3. **How the line was drawn.** The method, a live self-check against the paper, and every source.

## Sources

| Source | Used for |
| --- | --- |
| Gardiner C, Weakley J, Burke LM, Roach GD, Sargent C, Maniar N, Townshend A, Halson SL. [The effect of caffeine on subsequent sleep: a systematic review and meta-analysis](https://doi.org/10.1016/j.smrv.2023.101764). *Sleep Medicine Reviews* 69 (2023) 101764. Open access, CC BY 4.0 ([PDF](https://eprints.leedsbeckett.ac.uk/id/eprint/9625/)). | The 8.8 h and 13.2 h cut-offs, the 47 mg black tea result, and the 45 min average sleep loss |
| Drake C, Roehrs T, Shambroom J, Roth T. [Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed](https://doi.org/10.5664/jcsm.3170). *J Clin Sleep Med* 9(11) (2013) 1195 to 1200. | Supporting evidence: 400 mg six hours before bed still cut objectively measured sleep by more than an hour |
| Institute of Medicine. [Caffeine for the Sustainment of Mental Task Performance, ch. 2](https://www.ncbi.nlm.nih.gov/books/NBK223808/) (2001). | One-compartment, first-order model; mean half-life about 5 h, range 1.5 to 9.5 h; peak 15 to 120 min |
| Abernethy DR, Todd EL. [Impairment of caffeine clearance by chronic use of low-dose oestrogen-containing oral contraceptives](https://doi.org/10.1007/BF00544361). *Eur J Clin Pharmacol* 28 (1985) 425 to 428. | "Slower" preset (7.88 h vs 5.37 h) and the 0.79 h time to peak |
| Parsons WD, Neims AH. [Effect of smoking on caffeine clearance](https://doi.org/10.1002/cpt197824140). *Clin Pharmacol Ther* 24 (1978) 40 to 45. | "Faster" preset (3.5 h vs 6.0 h) |
| [USDA FoodData Central](https://fdc.nal.usda.gov/), SR Legacy records 171890, 171891, 173227, 174120, 171917, 174852, 173210, 171937, 170273, 171889 | Caffeine per 100 g and serving weights for every drink on the menu, pulled from the FDC API on November 20, 2026 (`data/drinks.json` shows the math for each) |
| U.S. FDA. [Spilling the Beans: How Much Caffeine is Too Much?](https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much) | The 400 mg a day reference shown on the ticket |

No numbers on the page are made up. The pre-workout serve (217.5 mg) is the one Gardiner et al. used, since there is no single USDA record for it.

## Method

- **Model.** Caffeine on board after one drink is `dose x B(t)`, where `B` is the one-compartment Bateman curve with first-order absorption and elimination. Absorption is set so the peak lands 0.79 h after drinking. Drinks add up.
- **The line.** `scripts/derive.py` searches for the half-life at which the paper's two cut-offs leave equal amounts on board at bedtime. Answer: 4.30 h, with 26.9 mg left from both (shown as 27 mg). Output is in `data/model.json`, with a sensitivity table for 3.5 to 6 h.
- **Last call.** The latest time a drink can be added to what you have already logged so that caffeine on board stays at or under 26.9 mg for the whole 8 hours after lights out. Protecting the whole night (not just the moment you lie down) is what stops a drink right at bedtime from looking safe just because it has not been absorbed yet.
- **Self-check.** The page recomputes the paper's three examples live at 4.3 h for a 10 PM bedtime: coffee 8.8 h (paper 8.8 h), pre-workout 13.2 h (paper 13.2 h), black tea 3.7 h (paper: no cut-off).
- **The black tea gap, stated plainly.** The paper only names a cut-off once the 95% confidence interval for lost sleep clears zero, which a 47 mg dose never did. "No cut-off" is not "no effect," so I kept the stricter reading. For small drinks this app is more cautious than the paper.
- **Your half-life.** The presets move the curve; the line stays at 26.9 mg on board. That treats the line as an amount in the body, which is what sleep responds to, and is an assumption the paper did not test.

## Design decisions

- **The menu board is the product.** Most of the time the question is "can I still have this?" A letterboard answers it for every drink at once with only one input, your bedtime.
- **Stacking lives on a separate ticket.** Keeping the board on an otherwise caffeine-free day means it never turns into a wall of "closed." The ticket handles real days and gives one concrete fix rather than a score.
- **One chart, one line.** An ink curve, a dashed 27 mg line, a shaded night. No gauges, no traffic lights, no secondary axis.
- **Metabolism is three honest choices.** Faster, average, slower, each tied to a study, plus a fine-tune slider. No body-weight or genetics quiz, because the evidence for turning those into personal minutes is thin.
- **Plain words and visible sources.** "On board" instead of "plasma concentration." Every number has a footnote.
- **Look.** Cream paper, espresso ink, a black felt letterboard in a wood frame, one red rubber stamp for the last call. Fraunces for display, IBM Plex for text and times, Barlow Condensed for the board letters. No build step and no framework: one HTML file, one stylesheet, one script.
- **Private by default.** Your ticket is saved in your browser's localStorage and never leaves it.

## The metric that would show it works

- **North star:** share of logged nights where caffeine at lights out is under the line.
- **Outcome check (the one that decides if the line is right):** within the same person over 3 to 4 weeks, sleep onset latency and total sleep from Oura or HealthKit on under-the-line nights vs over-the-line nights. If under-the-line nights are not better for most people, refit the line.
- **Guardrail:** morning caffeine should not fall. The product moves the last drink earlier; it is not trying to make anyone quit.
- **Product health:** day-7 return rate among people who logged at least one drink.

## Limits

Not medical advice and not a dose limit. It ignores body weight, genetics, tolerance and food. Pregnancy slows caffeine clearance far beyond the slider (about 10 h by 17 weeks, per [Grosso et al., Am J Epidemiol 2006](https://doi.org/10.1093/aje/kwj125)). The meta-analysis modeled only the final dose; extending it to stacked drinks is this app's assumption.

## Run it

Static site, no build. `python3 -m http.server` in this folder and open `localhost:8000`. `python3 scripts/derive.py` regenerates `data/model.json`.

Made by [Sheina Pribadi](https://sheinapribadi-star.github.io/).
