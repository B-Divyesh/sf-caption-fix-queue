# Demo sandbox

Open <https://caption-fix-queue.sociobot.in/?demo=1> or `/demo` on a local
preview. Both addresses enter the isolated demo in one click.

The sample is `garden-workshop-sample.srt`. It contains seven realistic garden
workshop cues and one finding for each of the six checks: repeat, blank cue,
hidden character, reading load, speaker name, and glossary variant.

Demo work uses IndexedDB database `demo:caption-fix-queue`, store `workspace`,
key `current`. Real work uses database `caption-fix-queue`. Demo code does not
open the real database.

“Reset demo” deletes and rebuilds the demo record. “Start for real” deletes the
demo record and returns to `/`, where any existing real workspace is restored.
The persistent banner identifies demo mode and exposes both actions.

Claim tests start in a fresh browser context and use only this sample. The
demo-isolation test seeds real work, changes and resets the demo, then compares
the real record byte for byte.
