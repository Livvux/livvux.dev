# Obscura vs agent-browser — Speed Benchmark

**Date:** 2026-09-22  
**Machine:** macOS (Darwin), Apple Silicon  
**Tools:** obscura `0.2.3` · agent-browser `0.38.1`  
**Raw data:** [`browser-speed-report.json`](./browser-speed-report.json) · [`browser-speed-report.csv`](./browser-speed-report.csv)

---

## 1. What each tool is

| | **Obscura** | **agent-browser** |
|---|---|---|
| Engine | Embedded V8 + own DOM/render pipeline (Rust). **No Chromium process.** | Real Chrome/Chromium over CDP. |
| Typical entry | One-shot CLI: `obscura fetch` / `scrape` | Long-lived daemon + CLI: `agent-browser open` … |
| Session model | Process-per-call by default; optional `obscura serve` CDP server | Warm daemon reused across commands until idle timeout |
| Strength | Bulk fetch, stealth fingerprints, cheap cold start | Interactive automation (snapshot → `@eN` refs → click/fill), auth, Electron, debugging |
| Stealth | Built-in `--stealth` (TLS/headers/navigator/WebGL + tracker block) | None |

---

## 2. Method

- **Clock:** wall time via Python `time.perf_counter()` around full shell invocations (includes process spawn + CLI + protocol).
- **Runs:** median of N after 1 warmup (N noted per row in CSV).
- **Local fixture:** static pages on `127.0.0.1:8765` (500-row DOM; separate interactive form page). Obscura used `--allow-private-network`.
- **Remote:** `example.com`, `example.org`, `iana.org` (friendly pages — measures engine/overhead, not bot defence).
- **Interactive fixture:** text input `#name`, button `#submit`, live `#count`. One *round* = fill → click → read count. **5 rounds per timed run.**
- **agent-browser session:** named session `bench-speed` (not the shared default).
- **Obscura CDP path:** `obscura serve` + raw CDP (`Target.createTarget` → attach → `Page.navigate` → `Runtime.evaluate`). WebSocket connects with `suppress_origin=True` (origin-less handshake required).

### What “cold” vs “warm” means here

| Mode | Obscura | agent-browser |
|---|---|---|
| **Cold** | New process every run (`fetch` exits after one page) | `close` → `open` → `get title` → `close` (Chrome launch + teardown every run) |
| **Warm** | Still a **new process per `fetch`** (no shared engine); batch/`scrape` and `serve` amortize that | Chrome daemon already running; only CDP round-trips |

---

## 3. Results (median ms, lower = faster)

### 3.1 Navigation & extraction

| Scenario | Obscura | agent-browser | Winner | Ratio (AB / Obscura) |
|---|---:|---:|---|---:|
| Cold one-shot local | **21.0** | 970.7 | Obscura | ~46× |
| Cold one-shot remote (example.com) | **71.1** | 1027.6 | Obscura | ~14× |
| Warm sequential 5 pages local | **109.2** | 595.4 | Obscura | ~5.5× |
| Batch 5 pages one process (`scrape`) | **26.1** | 595.4 | Obscura | ~23× |
| Warm sequential 3 pages remote | 886.9 | **448.2** | agent-browser | ~2× |
| Screenshot warm local | **45.5** | 133.0 | Obscura | ~2.9× |

**Read:**

- **Cold start is the headline.** Obscura never pays Chromium launch (~0.9–1.2 s for agent-browser). For “run once, grab title/HTML/screenshot, exit”, Obscura is an order of magnitude faster.
- **Local warm sequential:** each `obscura fetch` is still a cheap ~20 ms process; agent-browser pays CLI + CDP per `open`/`get` (~120 ms/page) even with a warm daemon.
- **Batch:** `obscura scrape` keeps 5 URLs in one process (~26 ms total local) vs five agent-browser command chains (~595 ms).
- **Warm remote flips the ranking.** Real network latency dominates; a **warm Chrome reuses connections, TLS sessions, and HTTP cache** across navigations. Obscura’s process-per-fetch tears that down every page → agent-browser wins ~2× on 3 remote pages.
- **Screenshots:** same pattern as local nav — lighter capture path in Obscura wins on a warm local page.

---

### 3.2 Stealth mode (obscura only)

| Scenario | Obscura plain | Obscura `--stealth` | Overhead |
|---|---:|---:|---:|
| Cold remote | 71.1 | **81.2** | +10 ms (~+14%) |
| Cold local | 21.0 | **21.9** | +0.9 ms (~+4%, noise-level) |
| Warm remote 3 pages | 886.9 | **802.1** | −85 ms (variance; not a slowdown) |
| Batch 3 remote (`scrape --stealth`) | — | **183.8** | one process, concurrency 10 default |

**Read:**

- Stealth costs **almost nothing on localhost** (no TLS fingerprint work that matters there).
- On remote cold fetches it adds **~10 ms** — negligible next to network RTT.
- agent-browser has **no equivalent mode**; matching stealth would require extra extensions/launch flags and still wouldn’t cover Obscura’s TLS impersonation.
- **This benchmark does not measure stealth efficacy** (blocked vs allowed). Friendly sites like example.com always load. Stealth’s value is **success rate on bot-sensitive targets**, not raw ms — but the speed tax is tiny enough that enabling it by default is free insurance.

---

### 3.3 Interactive click/fill loops (5× fill → click → read)

| Path | Median | What it actually runs |
|---|---:|---|
| **obscura fetch + one JS eval** | **18.9 ms** | One process: navigate, run all 5 rounds in a single `Runtime.evaluate`-style eval, print count. Not multi-round agent judgment — batched DOM work. |
| **obscura serve + raw CDP** | **78.0 ms** | Warm server; true multi-step CDP: navigate once, 5× (set value, click, read) over WebSocket. Fair “real interactive protocol” comparison. |
| **agent-browser daemon** | **766.3 ms** | Warm Chrome; each step is a full CLI: `fill` / `click` / `get text` (15 CLI invocations per run ≈ 51 ms/step). |

**Read:**

- **True interactive protocol (CDP vs CDP-ish):** Obscura serve ≈ **78 ms** vs agent-browser ≈ **766 ms** → agent-browser is **~10× slower per loop**, almost entirely **CLI process + command framing per step**, not Chrome being slow.
- **agent-browser’s design tax:** each command is a new CLI process talking to the daemon. Great for agents (human-readable, refs, snapshots); expensive in a tight fill/click micro-loop.
- **obscura fetch-eval (18.9 ms)** shows the ceiling when you don’t need an agent in the loop — collapse the whole interaction into one JS blob. Not a substitute for snapshot-driven automation.
- **Fairness caveat:** agent-browser also does richer work per step (accessibility validation, ref resolution). Raw speed ≠ agent ergonomics. If you batch via `agent-browser` one shell chain you still pay per-command spawn.

**Interactive was the scenario the first pass skipped** — it is agent-browser’s *product* strength (refs, snapshots, auth), but on pure latency Obscura’s CDP path wins by an order of magnitude.

---

### 3.4 `obscura serve` cold start

| | Median |
|---|---:|
| Time until `/json/version` responds | **60.7 ms** |

Even the “long-lived Obscura” path boots in ~60 ms — still **~15× faster** than launching Chrome for agent-browser cold (~970 ms). Amortize serve over a session and interactive CDP stays cheap.

---

## 4. Scoreboard by use case

| Use case | Faster choice | Why |
|---|---|---|
| One-shot fetch / title / HTML / screenshot | **Obscura** | No browser launch; ~20–70 ms |
| Bulk scrape (tens–thousands of URLs) | **Obscura** | One process, concurrency, no daemon |
| Local dev checks, fixture QA screenshots | **Obscura** | Sub-50 ms |
| Stealth / anti-bot fetches | **Obscura** | Built-in; ~+10 ms remote |
| Tight programmatic interaction loops (CDP) | **Obscura serve** | ~10× faster than AB CLI steps |
| Agent-driven UI flows (snapshot, `@eN`, fill, login vault) | **agent-browser** | Designed for it; speed secondary |
| Long remote session, repeated nav, cache reuse | **agent-browser** | Warm Chrome beats process-per-fetch |
| Electron, Slack, persistent auth, dashboard | **agent-browser** | Obscura doesn’t cover these |

---

## 5. Key mechanisms (why the numbers look like this)

1. **Process model**  
   Obscura: tiny Rust binary + embedded engine per call (~20 ms local).  
   agent-browser: CLI → daemon → Chrome. Cold = full Chrome; warm = still one CLI spawn per command.

2. **Chrome launch tax (~0.9–1.2 s)**  
   Dominates every agent-browser cold number. Unavoidable if you close the browser each time.

3. **Network vs engine**  
   Local fixtures isolate engine/CLI cost. Remote pages add RTT; warm connection reuse then favors Chrome, which is why **warm_remote3 flips**.

4. **Batching**  
   `obscura scrape` amortizes process start across URLs (26 ms for 5 local pages). agent-browser has no multi-URL batch nav in one command — you loop the CLI.

5. **Stealth**  
   Consistent fingerprint + tracker block at transport layer. Cost ≈ free locally, ~10 ms remote. Not measured here: block-rate improvement.

6. **Interactive step granularity**  
   agent-browser: 1 OS process per `fill`/`click`/`get`.  
   Obscura CDP: all steps multiplexed on one WebSocket.  
   That single difference explains 78 ms vs 766 ms.

7. **Wait/settle policy**  
   Benchmarks used `--wait 0` (or default adaptive settle on remote) for Obscura where the title is ready at load. Real pages with late JS may need settle time on **both** tools — that would add similar network-bound delay and not change local rankings.

---

## 6. Caveats & limits

- **Friendly sites only** for remote tests — no Cloudflare/anti-bot success-rate data.
- **Medians of small N** (4–7) — good for order-of-magnitude, not ±2% claims.
- **Not tested:** click-heavy SPAs with long tasks, PDF, video, service workers, auth vaults, Electron.
- **agent-browser fairness:** timed the *documented CLI UX* (what agents actually run). A custom binary speaking CDP directly to Chrome would close some of the 10× interactive gap — that is not how the tool is used in practice.
- **Obscura fidelity ≠ Chrome** for long-tail CSS/Web APIs (see Obscura skill docs). Speed wins assume the page renders “good enough” for your job.
- **Interactive eval path (18.9 ms)** is not agent-equivalent — no snapshot, no refs, you must know selectors/JS up front.

---

## 7. Bottom line

| Question | Answer |
|---|---|
| What’s faster overall? | **Obscura** — wins 8 of 10 head-to-head speed rows; cold start and batch are blowouts. |
| When is agent-browser faster? | **Warm multi-page remote navigation** (connection reuse): ~448 ms vs ~887 ms for 3 pages. |
| Stealth tax? | **~10 ms remote cold, ~0 local** — effectively free. |
| Interactive loops? | **Obscura CDP ~78 ms vs agent-browser CLI ~766 ms** for the same 5-step fill/click/read (~10×). Use agent-browser when you need snapshots/refs/auth, not when you need raw loop Hz. |
| serve startup? | **~61 ms** — keep `obscura serve` up for interactive sessions. |

**Practical default:** Obscura for fetch/scrape/screenshots/stealth/bulk; agent-browser for agent-driven interaction, logins, and long warm remote sessions.

---

## 8. Reproduce

```bash
# Local fixture + server (port 8765), then:
obscura fetch http://127.0.0.1:8765/fixture.html --allow-private-network \
  --eval 'document.title' --wait 0

AGENT_BROWSER_SESSION=bench agent-browser open http://127.0.0.1:8765/fixture.html
agent-browser get title && agent-browser close

# Stealth
obscura fetch https://example.com --stealth --eval 'document.title'

# Interactive CDP (serve on 9223)
obscura serve --port 9223 --allow-private-network
python3 cdp_interactive.py 9223 http://127.0.0.1:8765/interactive.html 5
```

Scripts used for this report live under the session temp bench directory (`run.py`, `run_ext.py`, `cdp_interactive.py`); full per-run timings are in the JSON `runs_ms` arrays.
