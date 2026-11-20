# Last Call: research and design brief

## The everyday problem

"No coffee after 2" is the rule most people half follow. It ignores what you drank, how much, how fast your body clears it, and when you actually go to bed. The result is the familiar night where you are tired at 11 and still awake at 12:30, without connecting it to the 3 PM latte.

## What the research says

- **Gardiner et al. (2023), Sleep Medicine Reviews 69:101764.** A systematic review and meta-analysis of 24 studies. Caffeine cut total sleep time by 45 minutes and sleep efficiency by 7%, and added 9 minutes to falling asleep. A meta-regression on dose and timing gave cut-offs for a 10 PM bedtime: a cup of coffee (107 mg) at least 8.8 h before bed, a pre-workout serve (217.5 mg) at least 13.2 h before bed, and no cut-off for a cup of black tea (47 mg). Open access (CC BY 4.0). https://doi.org/10.1016/j.smrv.2023.101764
- **Drake, Roehrs, Shambroom and Roth (2013), J Clin Sleep Med 9(11):1195.** 400 mg taken 6 hours before bed still cut objectively measured sleep by more than an hour. https://doi.org/10.5664/jcsm.3170
- **Institute of Medicine (2001), Caffeine for the Sustainment of Mental Task Performance, ch. 2.** Caffeine follows first-order kinetics in a one-compartment model; mean half-life about 5 h, range 1.5 to 9.5 h; peak 15 to 120 min after drinking. https://www.ncbi.nlm.nih.gov/books/NBK223808/
- **Abernethy and Todd (1985), Eur J Clin Pharmacol 28:425.** Half-life 7.88 h on low-dose estrogen birth control vs 5.37 h in matched controls; time to peak 0.79 h in controls. https://doi.org/10.1007/BF00544361
- **Parsons and Neims (1978), Clin Pharmacol Ther 24:40.** Half-life 3.5 h in smokers vs 6.0 h in nonsmokers. https://doi.org/10.1002/cpt197824140
- **USDA FoodData Central (SR Legacy).** Caffeine per 100 g and serving weights for each drink on the menu. https://fdc.nal.usda.gov/
- **FDA, "Spilling the Beans".** 400 mg a day is the amount FDA cites as not generally associated with negative effects for most adults. https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much

## The insight the app is built on

The meta-analysis gives cut-offs only for three specific drinks, and only for the last one you had. People drink different sizes and stack them. So I asked: is there one bedtime amount that both published cut-offs agree on?

With a one-compartment model (time to peak 0.79 h), the coffee cut-off and the pre-workout cut-off leave the same amount on board at lights out when caffeine halves every **4.3 hours**. That amount is **about 27 mg**, a little less than a can of cola. 4.3 h sits inside the IOM range and a bit under its 5 h average. `scripts/derive.py` reproduces it.

So the app's rule is: **go to bed with less than 27 mg on board, and stay under it while you sleep.** That turns two data points into a rule that works for any drink, any size, any number of drinks, and any half-life.

Honest caveat: the rule is stricter than the paper for small doses. The paper found no cut-off for black tea (47 mg), while this rule says a cup of black tea needs about 3.7 hours before bed. The paper only names a cut-off once the 95% confidence interval for lost sleep clears zero, which a small dose may never do, so "no cut-off" is not the same as "no effect". I kept the stricter reading and say so on the page.

## Who it is for

A student or early-career person who drinks two or three caffeinated things a day, sleeps 7 or so hours, and tracks sleep loosely (Oura, Apple Watch, or just how they feel). They do not want to quit coffee. They want to know when the last one is.

## Jobs to be done

1. Before ordering: "Can I still have this?" Answer in one glance.
2. Planning the day: "If I have a latte at 1, when is my last cola?"
3. After a bad night: "Was it the caffeine?" See the curve at lights out.

## Design

- **The menu board is the product.** A café letterboard where the prices are replaced by tonight's last-call time for each drink. It answers job 1 with zero input beyond bedtime.
- **The ledger is the planner.** An order ticket where you log what you actually drank. Drinks stack, so the board updates to "last call given what you have already had".
- **One chart, one line.** An ink curve of caffeine on board over the day with a single dashed line at 27 mg and the sleep window shaded. No secondary axes, no gauges.
- **Metabolism is a choice, not a quiz.** Three labeled presets (faster, average, slower) tied to cited studies, plus a fine-tune slider. No body-weight or genetics questions.
- **Look and feel.** Cream paper, espresso ink, black felt letterboard with white letters, one red rubber-stamp accent for the last call. Serif display type, mono for times. No gradients, no emoji, no cards floating in space.
- **Plain words.** "On board" rather than "plasma concentration". Every number links to where it came from.

## The metric that would show it works

- **North star:** share of logged nights where lights-out caffeine is under the line.
- **Outcome check (the one that matters):** within the same person, minutes to fall asleep and total sleep (from Oura or HealthKit) on under-the-line nights vs over-the-line nights. If under-the-line nights are not better for most people after 3 to 4 weeks, the line is wrong and should be refit.
- **Guardrail:** morning caffeine should not drop. The goal is moving the last drink earlier, not quitting.
- **Product health:** day-7 return rate of people who logged at least one drink.

## Out of scope

Medical advice, pregnancy guidance (half-life can reach 10 h by 17 weeks; Grosso et al., Am J Epidemiol 2006, https://doi.org/10.1093/aje/kwj125), body-weight dosing, and anything that tells someone how much caffeine is safe to drink.
