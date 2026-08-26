---
name: ui-evidence
description: Prove a finished UI change actually works by driving a browser against the user's localhost dev server — a private headless Chrome by default, or their real signed-in Chrome when the app sits behind a login you must not type past — capturing screenshots as evidence into .claude/ui/ (or .claude/pr/<slug>/ when called from pr-description), and sending them back as captioned PNGs plus a paste-ready markdown block for a PR description. Use this at the end of ANY implementation whose effect is visible in a browser page — a component, route, style, form, copy change, layout fix — even when the user never mentions screenshots or testing. Also use when the user says "dev test", "verify in the UI", "screenshot the change", "prove it works", or asks for evidence a change landed.
subagent-role: worker
argument-hint: "optional output directory (defaults to .claude/ui/ in the repo; pr-description passes .claude/pr/<slug>/)"
compatibility: claude-code
---
 
# UI Evidence
 
A change isn't demonstrated by a passing typecheck. This skill produces the artefact
a reviewer actually wants: pictures of the running app with captions saying what each
one proves.
 
Run it when you'd otherwise write "the change is complete" about something a person
could see in a browser. The screenshots also catch your own mistakes — more than once
a change that compiled and tested clean looked wrong on screen.
 
**What this needs, and what to say if it's missing.** A dev server already up, always.
Beyond that it depends which browser Step 3 picks: the **headless** path needs Node 22+
and a Chrome install and nothing else, while the **real-Chrome** path needs macOS, the
Claude-in-Chrome tools connected, Chrome running with the user signed into the app, and
Screen Recording permission granted to the app running the session. If a prerequisite is absent, name it and
offer the user a choice rather than improvising around it — Step 3 says what that choice
is. A teammate on Linux, or with the extension disconnected, should get one clear
question, not a pile of failed capture attempts. Everything past capture — the markdown block, the captions — is
plain text with no tooling dependency at all.
 
## Step 1 — Decide whether there's anything to see
 
Ask one question: **would this change alter what a page renders, or how it behaves
when clicked?** If yes, continue. If no, say so in a single line and stop — a browser
session that proves nothing wastes the user's time and clutters their tabs.
 
Not worth a run: type-only changes, test files, build config, backend logic with no
surfaced output, work that isn't wired into a route yet, refactors with no visual delta.
 
Worth a run even though it's tempting to skip: copy changes, disabled/hidden states,
spacing and alignment fixes, anything where the acceptance criteria are visual.
 
If the change is visual and the page **already exists**, capture the "before" state
*before* you start editing. A before/after pair is the strongest evidence there is,
and it costs one extra capture. You can only do this if you think of it early — so
when a task looks visual, take the before shot as your first action, not your last.
 
## Step 2 — Pick the pages and the states
 
List the pages the change touches, then for each one the *states* that demonstrate it.
States are where the evidence lives: a hidden-until-valid button needs both the empty
form and the filled one. One screenshot per claim in the acceptance criteria is a good
rule of thumb.
 
Keep it tight — 2 to 5 shots proves most changes. Ten near-identical screenshots read
as noise and bury the one that matters.
 
You need concrete URLs, which often means finding real IDs first (a patient, an order,
a record). Get them by navigating the app's own list/search pages rather than guessing
IDs, and reuse them across shots so the report reads coherently.
 
## Step 3 — Drive a browser
 
**Pick the path first, because it decides everything after it.** One question: *does
reaching the state need a session you cannot create yourself?* A real login — WorkOS,
Auth0, SSO, an account you must not type a password for — means yes. A dev server with
seeded data, a mock backend, a fixture credential that is committed to the repo, or no
auth at all means no.
 
- **Yes → the user's real Chrome**, below. It is the only way in, because you must never
  type credentials past a sign-in wall and their Chrome is already through it.
- **No → a private headless Chrome**, further below. Prefer it whenever it is available:
  it is better evidence and less intrusive, and the reason for the Chrome path simply
  does not apply.
 
Say which you picked and why in one clause. A reviewer who sees a desktop-width shot of
something that should have been a phone deserves to know it was a constraint, not a
choice.
 
### The user's real Chrome, when a session is required
 
Use the `claude-in-chrome` tools, not the in-app Browser pane: the in-app browser has no
session and lands on the sign-in wall. The user's Chrome is already signed in. Driving it
without asking is expected for this workflow.
 
**Check they are actually connected before going further, and if they are not, stop and
ask.** This is a real fork and not a formality: the tools are frequently absent, and the
three wrong reactions are all tempting. Do not silently fall back to headless — you
picked this path because a session is required, and headless will land on the sign-in
wall and screenshot it. Do not type a credential to get past that wall, ever, even one
the user pasted into the chat earlier. Do not quietly finish without evidence: a
report that drops it without saying so implies a check that never happened.
 
Put it to the user as a choice, in one short message:
 
- **Connect the extension** and say when — then carry on from here.
- **Skip the evidence** for this change — then say plainly in your final message that it
  went unverified in a browser and why, so the gap is on the record rather than implied.
- **Point you at a way in that needs no real session** — a seeded account, a bypass flag,
  a fixture credential already committed to the repo, a mock backend. Any of those turns
  the question above into a "no", and the headless path opens up.
 
Wait for the answer. Don't guess which they'd prefer, and don't start capturing something
adjacent to prove you were busy.
 
The same applies in reverse, less often: if the headless path is the right one but Node
or Chrome is missing, say which and offer the same choice rather than improvising.
 
Two side effects to keep in mind, and to mention if they matter: clicking a
copy-to-clipboard control overwrites the user's clipboard, and any action you take is
attributed to their account (audit logs, "last edited by"). Verify with reads and
non-destructive interactions where you can. Don't click save, publish, or delete just
to get a screenshot — set up the state, capture it, then discard via Cancel.
 
**Mark the tab.** Navigate with a `#ccshot=<marker>` fragment appended to the URL:
 
```
http://localhost:3000/patients/<id>/action-plans/new#ccshot=7f3a91
```
 
Use a different short random marker per page. A fragment never reaches the router, so
it changes nothing about what renders — it exists so the capture step can identify
*this* tab. That matters more than it sounds: the user frequently has their own tabs
open on the same localhost origin, and capturing one of those produces evidence that
looks convincing and is wrong.
 
Then set up each state with `computer` clicks/typing — but **don't click in the same
breath as a `navigate`**. A click sent to a page that is still hydrating is silently
swallowed: the tool reports success, nothing happens, and you get a screenshot of an
empty form you believe is filled. Give the page a beat, then confirm the state actually
took hold before capturing:
 
```js
[...document.querySelectorAll('textarea,input')].map(e => e.value).filter(Boolean).join(' | ')
```
 
Read the values back, don't assume them. This costs one call and is the difference
between evidence and fiction.
 
Watch for state you didn't intend, too — a stray "Required" error under a field you
tabbed out of, or a hover tooltip left under the cursor. Reviewers read those as bugs
in your change. Reset and retake instead of explaining them away in a caption.
 
### A private headless Chrome, when no session is required
 
`capture-headless.mjs`, next to this file, launches a throwaway Chrome on a scratch
profile and drives it over CDP. No dependencies — Node 22+ ships the WebSocket client
that is all CDP needs. Import it and write a short script; it both drives and captures,
so **the tab marker above and Step 4's region and banner apparatus do not apply here.**
 
```js
import { open } from '<skill-dir>/capture-headless.mjs';
 
const page = await open({ out: '.claude/pr/GH-12' });   // viewport defaults to a phone
await page.goto('http://localhost:5173/');
await page.type('input[type=password]', 'fixture-not-a-real-password');
await page.click('button');
await page.shot('01-signed-in');
await page.close();
```
 
`goto`, `type` (real key events, not assigned `.value`), `click`, `evaluate`, `sleep`,
`shot` and `close`. Pass `viewport` to `open()` when a phone is the wrong shape.
 
Why prefer it, so the choice is not arbitrary:
 
- **The viewport is exact and is often itself the claim.** "Thumb-reachable, one tap
  deep, used one-handed" cannot be demonstrated by a desktop window, and cropping cannot
  fake it.
- **No banner, so no waiting.** The 20-second wait in Step 4 exists only because CDP
  against the user's Chrome raises a debugging banner. A private instance has none.
- **It touches nothing of the user's** — no tabs, clipboard, history, account, or Screen
  Recording grant, and no window stealing focus mid-session.
- **It is scriptable**, so states come from the app's own control surfaces rather than
  hand-clicking, and a rerun produces the same shots.
 
The tab-marker problem does not exist here either: the browser has exactly one tab, on a
scratch profile, and nobody else can put one on the same origin.
 
## Step 4 — Capture to real files

**Resolve the output directory first.** If an argument was passed, treat it as the
output directory — this is how `pr-description` calls this skill, passing
`.claude/pr/<slug>/` so the evidence lands next to the PR it's for. With no argument,
default to `.claude/ui/` in the repo root. Either way, before the first write, check the
repo's `.gitignore` for an entry covering that directory (or a broader `.claude/`
entry); if none exists, add it — this is skillset working state, not project
documentation, and shouldn't be committed.

**On the headless path the files already exist** — `page.shot(name)` wrote each one as
you went. Skip to "Check your own work" below; none of the apparatus in between applies.

### Capturing from the user's Chrome

The browser MCP's screenshot returns an image into the conversation but writes nothing
to disk (`save_to_disk` produces no file), and a report needs files. So capture with
the bundled script, which fronts the marked tab via AppleScript and shoots it with
macOS `screencapture`, writing straight into the resolved output directory:
 
```bash
<skill-dir>/capture-tab.sh <marker> <output-dir>/<NN>-<slug>.png [x,y,w,h]
```
 
`<skill-dir>` is this skill's own directory — the base directory reported when the
skill loads. Resolve it from that rather than assuming a path, so the skill works
whether it's installed personally or committed into a project's `.claude/skills/`.
 
Get the region from the page itself, immediately before capturing:
 
```js
({x: window.screenX, y: window.screenY + (window.outerHeight - window.innerHeight),
  w: window.innerWidth, h: window.innerHeight})
```
 
**Wait ~20 seconds after your last CDP call (any `computer` / `javascript_tool` /
`navigate` use) before capturing.** Chrome shows a `"Claude" started debugging this
browser` banner while automation is active, and on a fullscreen window it *overlays*
the top of the page — so it both uglifies the shot and hides the page header. Cropping
can't recover those pixels, because the pixels were never rendered. The banner
disappears on its own once CDP goes quiet, and the capture script itself uses no CDP,
so waiting is the whole fix:
 
```bash
python3 -c "import time; time.sleep(20)"   # foreground sleep is blocked; use this
```
 
Ten seconds was measured as sometimes-enough and sometimes not, so prefer twenty. If a
shot still shows the banner, wait again and retake — this is the single highest-value
habit in the whole skill, and the most tempting one to skip.
 
### Check your own work — both paths
 
**Read each PNG you captured.** Is it the right page, the right state, the framing you
expected, no banner, no stray hover tooltip? Retake anything that isn't right.
Screenshots are the deliverable, and shipping a wrong one is worse than shipping none.
 
This is not a formality, and scripting does not excuse it — a scripted run repeats a
setup mistake perfectly. One real example: a first-run form captured with a rollback
fixture still loaded from the previous shot, so it showed a state that made sense but
was not the one the caption claimed. Nothing but looking at it would have caught that.
 
Requirements worth knowing when something fails on the Chrome path:
- Screen Recording permission must be granted to the app running this session
  (System Settings → Privacy & Security → Screen & System Audio Recording). The script
  exits with this message if the capture comes back empty.
- Exit code 2 means no tab carried the marker — navigate with the fragment, then retry.

## Step 5 — Send the evidence
 
The PNGs already live under the output directory resolved in Step 4 — nothing more to
write there.
 
The destination for this evidence is almost always a Bitbucket PR description — a
markdown text box, not a document. The user pastes text into it and drags screenshots
onto it directly; Bitbucket auto-hosts each dropped image and inserts its markdown for
them. So the deliverable is PNGs plus text they can paste, not a bundled report file.
 
**Always** send the PNGs directly with `SendUserFile` (`display: "render"` so they show
inline), one caption line per shot saying what it proves.
 
**Two or more screenshots destined for a PR description** — also send a markdown block
shaped for pasting straight into that description:
 
```markdown
**UI evidence**

_Create page — blank form_
<!-- drop 01-create-blank.png here -->
No Copy button while every field is empty, so an empty skeleton can't be copied by accident.

_Create page — filled form_
<!-- drop 02-create-filled.png here -->
Copy button appears once a field has content.
```
 
One heading + placeholder comment + caption per shot, in capture order. The placeholder
names the exact file to drop at that spot — Bitbucket assigns the real URL only once the
user drops the image in the web editor, so there's nothing to template ahead of that.
Keep each caption to one line; this block gets read by a human skimming the PR for
context, not studied.
 
Strip `#ccshot=` markers and shorten long IDs anywhere a URL appears; they're for the
reader's orientation, not for replay. No file gets built here — it's plain text, so
there's nothing to render and self-check beyond reading it back once before sending.
 
### Captions carry the proof
 
A caption says what the image *proves*, not what it depicts. This is the difference
between evidence and a photo album.
 
- Weak: "Screenshot of the create page."
- Strong: "Copy button appears as soon as a field has content, centred beside the
  heading — the new affordance the ticket asked for."
State what's absent when absence is the point ("no Copy button while the form is
blank"), and name the acceptance criterion a shot satisfies when there is one.
 
## Finally
 
In your message, keep it to what the evidence shows and anything you *couldn't* prove
this way — a state you couldn't reach, a page behind a flow you declined to complete,
something that needs a real device. Silent gaps are how a verification report starts
lying. Name which browser you drove, too: a reader weighing a screenshot should know
whether it came from a private instance at a viewport you chose or from the user's own
window at whatever size it happened to be.
 
And clean up. On the headless path that is `page.close()`, which takes the scratch
profile with it. On the Chrome path it is the user's own browser: discard unsaved form
state you created (Cancel), and leave it roughly where you found it.
