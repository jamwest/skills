---
name: ui-evidence
description: Prove a finished UI change actually works by driving a browser against the user's localhost dev server — a private headless Chrome by default, or their real signed-in Chrome when the app sits behind a login you must not type past — capturing screenshots as evidence into .claude/ui/ (or .claude/pr/<slug>/ when called from pr-description), and combining them into one annotated PDF (captions plus numbered boxes on what changed) with a paste-ready markdown block for a PR description. Use this when a PR is opened for any change visible in a browser page (pr-description calls it, following the /change-plan shot list) — a component, route, style, form, copy change, layout fix — even when the user never mentions screenshots or testing; and for quick check shots while building. Also use when the user says "dev test", "verify in the UI", "screenshot the change", "prove it works", or asks for evidence a change landed.
subagent-role: worker
model: sonnet
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
question, not a pile of failed capture attempts. Everything past capture — the PDF, the markdown block, the captions — is
plain text with no tooling dependency at all.
 
**Quick check mode.** When `/implement` uses this while building, to see whether a screen
is right, take the shots on the headless path and look at them (Step 4's checks), then stop.
No PDF, no markdown block: the PR's evidence is captured later, once.

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
 
**If the caller passed a shot list** (from the `/change-plan` plan, one line per shot: screen,
state, and the acceptance criterion it proves), take exactly those shots, and use each line's
criterion as the caption's claim. Add a shot only when one in the list can't show its criterion
alone, and say why. On a rework, the caller names which shots to retake; keep the others.

Without a list, list the pages the change touches, then for each one the *states* that demonstrate it.
States are where the evidence lives: a hidden-until-valid button needs both the empty
form and the filled one. One screenshot per claim in the acceptance criteria is a good
rule of thumb.

**One shot for each option that changes what renders.** If a choice shows or hides
fields or cards, or changes the next screen, take one shot per option, not just the
one the change is about. Example: a gender choice where only "Another" shows a text
box needs a shot of "Male" and of "Female" too, so the reviewer sees what each
option shows. A changed existing card needs every state it can be in. The shot you
skipped is often the one that shows the design is wrong.
 
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

**Before you answer yes, look for the repo's own way in.** Many repos behind a real login
already have a tool that signs in a test user without a browser: a screenshot or "screens"
script, an end-to-end suite, a Playwright `globalSetup` that logs in and saves a session,
a seed script that makes a signed-in account. Search for them: `**/screens/README.md`,
`playwright*.config.*` with a `globalSetup`, `e2e/` or `tests/e2e/` folders, and README
sections about screenshots. If one exists and its credentials are already set up, the
answer is no. Use that tool, or its sign-in helper with `capture-headless.mjs`, and
treat it as the headless path. Asking the user to connect the extension when the repo can
already sign in costs them a round trip for nothing.

A tool like this often rewrites its output folder on every run. Copy each shot into your
evidence folder as soon as you have checked it. A later run, even a diagnostic one, can
replace a good shot with one taken in a different state.
 
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

Then look at how it looks, not only which state it shows:
- **Spacing.** Compare the gaps around new elements with the gaps between the
  elements next to them. A gap twice the size of its neighbours usually means two
  paddings or margins added together.
- **Disabled, empty and placeholder states.** Each one must be clearly different
  from the background and from the enabled state. Grey on light grey fails.
- **Alignment.** New elements line up with the edges of their neighbours.
Say what you checked in the caption, or fix it before sending.
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

## Step 5 — Build the PDF and send it

The destination is almost always a Bitbucket PR description. Bitbucket's CLI can't
attach files, so the user uploads by hand in the web editor — and one dropped PDF is far
less work than several images. So **the deliverable is always one PDF**, even for a
single shot. Write it to `~/Desktop/PR evidence/<slug>.pdf`, where `<slug>` is the issue key
(or the branch name with `/` replaced by `-`). Bitbucket attaches files through a file
picker, not drag and drop, and a picker opens on the Desktop; one folder with one PDF
per ticket is quick to find there. The screenshots and `evidence.json` stay in the output
directory.

**Record what changed while you capture.** For each shot, note the box around every part
the change added or altered, in CSS pixels of the page — `page.rect(selector)` on the
headless path, `getBoundingClientRect()` plus `scrollX/scrollY` on the Chrome path. Take
it in the same state as the shot. Measuring by eye from the PNG works, but check the
result (below) because it is easy to be a few pixels off and cover a label.

**Write `<output-dir>/evidence.json`**, then build:

```json
{
  "title": "GROOV-2452 | Add copy button to action plan create",
  "summary": "Where and how it was captured: environment, viewport, flags, who was signed in.",
  "shots": [
    {
      "file": "02-create-filled.png",
      "title": "Create page, filled form",
      "caption": "Copy button appears once a field has content.",
      "scale": 2,
      "highlights": [{ "x": 300, "y": 96, "w": 72, "h": 32, "label": "New: Copy button" }]
    }
  ]
}
```

```bash
mkdir -p ~/Desktop/"PR evidence"
node <skill-dir>/build-pdf.mjs <output-dir>/evidence.json ~/Desktop/"PR evidence"/<slug>.pdf
```

`scale` is the capture's device scale factor (2 for the headless default, usually 2 on a
Retina Chrome). The PDF has a cover page listing the shots, then one landscape page per
shot: title, caption, a numbered legend, the full screen with red numbered outlines, and,
for tall phone shots, a zoomed copy of the boxed area so it can be read. Label each box
with what is new or different ("New: …", "Now required", "Moved above ethnicity"), not
what it is.

**Never cover the change.** Outlines have no fill and sit a few pixels outside the box,
and the zoomed copy carries no marks at all, so a reviewer can always see the change
exactly as it renders. Box the changed element itself, not a whole section around it.
The zoom pads the boxes; when that would cut a question or card in half, set the shot's
`"zoom": { "y": …, "h": … }` (CSS pixels) to the band that shows it whole.

**Check the PDF.** Render its pages and look at each one: boxes on the right element,
no badge covering a label, nothing important cut off by the zoom. Retake or re-measure
anything wrong. If `pdftoppm` is missing, PDFKit renders pages on macOS:

```swift
import PDFKit; import AppKit
let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
for i in 0..<doc.pageCount {
  let img = doc.page(at: i)!.thumbnail(of: NSSize(width: 1400, height: 1000), for: .mediaBox)
  try! NSBitmapImageRep(data: img.tiffRepresentation!)!.representation(using: .png, properties: [:])!
    .write(to: URL(fileURLWithPath: "\(CommandLine.arguments[2])/page-\(i + 1).png"))
}
```

**Send** the PDF's name (`PR evidence/<slug>.pdf` on the Desktop), plus this block for the
PR description. Bitbucket shows only images inline; a PDF is an attachment on the PR, so
the block says it is attached rather than leaving a spot to drop it:

```markdown
UI evidence is attached (`GROOV-2452.pdf`):

1. Create page, blank form: no Copy button while every field is empty.
2. Create page, filled form: Copy button appears once a field has content.
```

One line per shot, in PDF order, each saying what it proves. Strip `#ccshot=` markers
and shorten long IDs anywhere a URL appears.

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
