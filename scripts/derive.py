"""Derive the bedtime caffeine line from the two cut-offs in Gardiner et al. (2023).

Gardiner et al., Sleep Medicine Reviews 69 (2023) 101764, report that to avoid a
significant loss of total sleep time:
  * a cup of coffee (107 mg) should be finished at least 8.8 h before bed
  * a pre-workout serve (217.5 mg) at least 13.2 h before bed
  * a cup of black tea (47 mg) has no cut-off

Under a one-compartment model with first-order absorption and elimination
(IOM 2001: caffeine follows first-order kinetics and a one-compartment open model),
the amount left at bedtime is dose * B(t). We look for the half-life at which the two
published cut-offs leave the SAME amount on board, and call that amount "the line".
Time to peak is set to 0.79 h, the control-group value in Abernethy & Todd (1985).
"""
import json, math

TMAX = 0.79  # h, Abernethy & Todd 1985, controls

def ka_for(ke, tmax=TMAX):
    # solve ln(ka/ke)/(ka-ke) = tmax for ka > ke by bisection
    lo, hi = ke * 1.0001, 50.0
    f = lambda ka: math.log(ka / ke) / (ka - ke) - tmax
    for _ in range(200):
        mid = (lo + hi) / 2
        if f(mid) > 0: lo = mid
        else: hi = mid
    return (lo + hi) / 2

def frac(t, half):
    ke = math.log(2) / half
    ka = ka_for(ke)
    return ka / (ka - ke) * (math.exp(-ke * t) - math.exp(-ka * t))

def gap(half):
    return 107 * frac(8.8, half) - 217.5 * frac(13.2, half)

lo, hi = 2.0, 10.0
for _ in range(200):
    mid = (lo + hi) / 2
    if gap(lo) * gap(mid) <= 0: hi = mid
    else: lo = mid
half = (lo + hi) / 2
line = 107 * frac(8.8, half)
check = 217.5 * frac(13.2, half)
tea_peak = max(47 * frac(t / 100, half) for t in range(1, 600))
out = {
    "half_life_h": round(half, 2),
    "line_mg": round(line, 1),
    "check_preworkout_mg": round(check, 1),
    "tmax_h": TMAX,
    "tea_peak_mg": round(tea_peak, 1),
    "sensitivity": {str(h): {"coffee_8.8h": round(107 * frac(8.8, h), 1), "preworkout_13.2h": round(217.5 * frac(13.2, h), 1)} for h in (3.5, 4.0, 4.5, 5.0, 6.0)},
}
print(json.dumps(out, indent=2))
json.dump(out, open("data/model.json", "w"), indent=2)
