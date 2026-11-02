## Why keep a trading journal at all

Memory is unreliable, and it is especially unreliable about your own losing trades. A trading journal replaces guesswork with a record: what setup you took, why you took it, what you planned to do, and what you actually did. Over weeks and months, that record is what turns a string of isolated trades into a pattern you can act on — but only if the review process goes further than just re-reading old entries.

## 1. Record every trade, not just the interesting ones

Skipping the boring or embarrassing trades defeats the purpose. The small mistakes and the trades that barely worked out are usually where the real patterns live.

## 2. Capture the setup and the reasoning, not just the numbers

Entry price, exit price and P&L tell you what happened. They do not tell you why you took the trade or whether it matched your plan. Add the setup, the market context and the reasoning behind the entry and exit.

## 3. Attach a screenshot

A chart screenshot at the moment of entry captures information that is easy to misremember later — where support and resistance actually were, what the broader trend looked like, how clean or messy the setup really was.

## A template for each entry

You don't need a complex format, just a consistent one. A workable entry covers:

- **Instrument and side** — what you traded, long or short.
- **Entry and exit price, size, and timestamp.**
- **Setup** — the specific pattern or condition you were trading (e.g. "pullback to 20EMA", "breakout retest").
- **Plan before entry** — your intended stop, target, and invalidation point, written down before you were in the trade, not reconstructed after.
- **What you actually did** — did you move the stop, exit early, add to the position? Note any deviation from the plan.
- **Context** — time of day, session, any news or event nearby, your state (rested, tired, after a loss).
- **Screenshot** at entry, and ideally one at exit.
- **Tags** — see below.

A filled-in example, for illustration:

> *EURUSD, short, 1.0862 → 1.0831, 1 lot, 09:40 London.*
> *Setup: rejection at prior day's high, bearish engulfing on the 15m.*
> *Plan: stop at 1.0880 (18 pips), target 1.0820 (42 pips), invalidation if price closes back above the high.*
> *What happened: held to target, no deviation.*
> *Context: London session, no major news, first trade of the day.*
> *Tags: short, rejection, 15m, london-session, plan-followed.*

The value isn't in this specific trade — it's in having fifty or a hundred entries in the same shape, so a review can actually compare like with like.

## 4. Tag trades by condition, not just by feeling

A tag like "revenge trade" is only useful if it is recorded consistently. The more reliably you tag trades by condition — side, time of day, setup, what happened right before the trade — the more a review can actually separate what costs you money from what you just remember as costing you money.

A starting tag taxonomy that covers most of what matters:

- **Side**: long, short.
- **Session**: london, new-york, asia, overlap.
- **Setup**: breakout, pullback, reversal, range, news-driven.
- **Trade management**: plan-followed, stop-moved, exited-early, added-to-position.
- **State**: after-loss, after-win, first-trade, last-trade, tired.
- **Outcome driver**: as-planned, stopped-out, target-hit, discretionary-exit.

Keep the list short enough that you'll actually apply it consistently. A taxonomy with forty tags that nobody fills in correctly is worse than one with ten that you use every time.

## 5. Let the data find the pattern instead of guessing

Most traders suspect one or two habits are hurting them, and they are usually only half right. A manual review tends to confirm whatever you already believe. A statistical approach is more honest: it tests every condition and every pair of conditions in your history against the rest of your trades, and only flags the ones where the difference is unlikely to be chance — not just "trades after 2pm look worse" but a confidence estimate attached to that claim.

JORU's Blackweb does exactly this. It ranks the conditions actually costing you money — by total impact, by how often they show up in your worst 10% of trades, and by a confidence score — instead of leaving you to eyeball a spreadsheet.

**A hypothetical walkthrough, to show the shape of this review:** say your journal has 30 entries tagged consistently as above. A manual skim might leave you with a vague sense that "Fridays feel worse." A condition-by-condition pass instead checks every tag combination against the rest: side, session, setup, state, and their pairs. It might turn up that trades tagged both `after-loss` and `exited-early` have a noticeably lower win rate than the rest of the sample — not because Fridays are unlucky, but because a specific behavior (cutting winners short right after a loss) shows up disproportionately in the worst trades. That's a concrete, testable claim, not a feeling, and it's the kind of finding a manual re-read of 30 entries is unlikely to surface on its own.

## 6. Turn the worst pattern into a rule, then track whether you actually follow it

Finding a costly pattern is only half the work. The harder part is changing behavior. Blackweb's rehabilitation loop lets you commit to a rule that targets your costliest condition, then tracks a live window of trades afterward to see whether the rule holds: kept, almost kept, or failed, based on how many new violations show up. An integrity score reflects this over time, and a pattern you thought you fixed is flagged again if it comes back.

## 7. Review performance at the strategy level, not just the trade level

Individual trade review catches habits. Reviewing by strategy catches whether the strategy itself is working. JORU's Equity & Metrics and Robustness Analytics tools add a rotatable 3D equity curve, a Trade X-ray view of every individual trade's result, a calendar heatmap, and Monte Carlo simulation of your equity curve to estimate risk of ruin and the real distribution of drawdowns — so "is this strategy actually working" gets an answer built on simulated paths, not just the one path you happened to live through.

## Doing this with dedicated software

All of the above can be done by hand, but finding real patterns in your own trade history without statistical tooling is genuinely hard — most of what looks like a pattern in a spreadsheet is noise. [JORU](https://www.gandr.site/) is a desktop trading journal built around this exact process: trade logging with screenshots and tags, the Genesis Matrix for building and testing strategy rules visually, Blackweb for finding and fixing costly patterns, and Robustness Analytics for testing whether results hold up under simulation.

It is free to start, available for Windows and macOS. [Download it here](https://www.gandr.site/download) or see the [pricing page](https://www.gandr.site/pricing) for the full comparison.
