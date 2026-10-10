# Translation review needed

Hindi (`src/locales/hi.json`) and Telugu (`src/locales/te.json`) were written for this build, aiming for short, natural, student-friendly
phrasing rather than word-for-word output. **A native speaker should review everything before release.** Items I was least sure of:

| Key | English | Concern |
| --- | --- | --- |
| `story.b3.*` | "Nani" / grandmother | Hindi uses नानी (maternal grandmother), Telugu uses అమ్మమ్మ. Confirm the relationship wording fits the intended family context (dadi / nanamma?). |
| `story.b3.quote` | "This is what we could save. The rest is up to you." | Tone: gentle and plain. Telugu "మేము ఇంతే దాచగలిగాం" may read slightly formal; consider "మేం". |
| `pillars.invest.*` | "compounding" | Hindi चक्रवृद्धि and Telugu కాంపౌండింగ్ (transliterated) chosen for familiarity; check what students actually say. |
| `pillars.safe.hook` | "Spot the scam before it spots you." | Wordplay; Hindi/Telugu versions keep the idea, not the pun. |
| `pillars.save.hook` | "Two bad weeks are coming." | "बुरे हफ़्ते" / "కష్టమైన వారాలు": check register. |
| `recap.sampleTitle` | "Opportunity cost" | Hindi अवसर लागत, Telugu అవకాశ వ్యయం: formal textbook terms; a simpler explainer phrase may land better. |
| `personas.earner.name` | "First-generation earner" | Hindi पहली कमाई वाला / Telugu మొదటి సంపాదన are loose; the English concept (first in the family to earn) is not fully carried. |
| `hud.*` Lite mode | "Lite mode" | Left as लाइट / లైట్ (loanword). |
| `buttons.rewind` | "Rewind" | Left as रिवाइंड / రివైండ్ (loanword). |
| `story.b4.stamp` | "DUE" | बाकी / బాకీ (= outstanding). Confirm it reads right on a fee receipt. |

Text rendered inside the scene art (shop signs, OFFER! board) comes from `world.*` keys in the same files.

## Festival Countdown (Pillar 1)

Strings live in `src/games/festival/content/{en,hi,te}.json` (namespace `festival`). A test checks every key and `{{placeholder}}`
exists in all three files, but not the wording. Please review especially:

| Key | English | Concern |
| --- | --- | --- |
| `jars.*` | Needs, Gift, Fun, Spare | Telugu uses అవసరాలు / బహుమతి / సరదా / మిగులు; check these read naturally for money jars. |
| `borrow.*` | "borrow from another jar" | Rendered as उधार लो / అప్పు తీసుకో; it means moving money between your own jars, so check it doesn't sound like a loan from a person. |
| `ideas.*.name` | Opportunity cost, Emergency buffer, Comparison shopping | Plain phrases were used instead of textbook terms; confirm they land with students. |
| `shops.*.hello`, `haggle.*` | Shopkeeper lines | Should sound like light, natural Hyderabadi bazaar talk in each language. |
| `festivals.*.items` | Item names per festival | Check each festival's items with someone who celebrates it. |
| `invites.*` | Friends' messages | Casual register ("bhai", "bro"); check it matches how 16-year-olds actually talk. |
