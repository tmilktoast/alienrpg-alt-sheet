# Changelog

Notable changes to the Alien RPG Companion (formerly the Alien RPG Alternate Sheet). Versions follow the `version` field in
`module.json`.

## 0.3.3 — 2026-10-11

### Changed

- Rolling a field event in the builder no longer posts the roll to chat.

### Fixed

- A nickname or callsign that is part of a word in the character's name, like Ford in Stanford
  Daemonn, is shown in the name. It was taken as already being there.

## 0.3.2 — 2026-10-11

### Added

- **Marine Talents** — a compendium pack with Watchful, Killer and Hidden Stash, which the MOSs
  and field events give and the Evolved rules' compendiums lack. The builder uses them when the
  world has no item of that name.
- The Life Path Tables pack has the table an artificial womb soldier's early life experience is
  rolled on, EL - And Experienced (AW Soldier).

### Fixed

- The builder reads a career whose description links its talents the way Foundry stores a link now
  (`@UUID[Item.…]{Banter}`). It took the whole link for the talent's name, so every such talent
  showed as not in the world's Items.
- A release's stylesheet carries the version in its file name, so a browser or host can't go on
  serving the last release's styles after an update.

## 0.3.1 — 2026-10-11

### Added

- The sheet's header, when not in Edit mode, shows the character's name with their rank's
  abbreviation before it and their nickname or callsign inside it, as in PVT Kalah “Dagger”
  Hardnick. A Colonial Marines rank is abbreviated; any other is shown as written. Chat messages
  show the speaker's name the same way.

### Changed

- A character's career has its own line under the name in the sheet's header, leaving the name the
  full width.
- Verified with Alien RPG system 4.1.18 on Foundry 14.369.

## 0.3.0 — 2026-10-11

### Changed

- **MOS talents evened out** — in the builder every MOS also offers Precise Shooter; the Agility
  MOSs offer Nimble and the Wits MOSs Inquisitive; the Rifleman offers Weapon Specialist (M41A
  Pulse Rifle), the Comtech Marine Tech Savvy, the Forward Observer Investigator and the CBRN
  Specialist Calm Breather. Past the Limit is True Grit, which only the Strength MOSs offer;
  Field Surgeon is Field Medic, and Nerves of Steel isn't offered.
- **Renamed** — the module is now the Alien RPG Companion, since it has grown past a character
  sheet. Its id is still `alienrpg-alt-sheet`, so nothing saved in a world changes.
- Each sheet is listed under its own name in Configure Sheet — Alternate Character Sheet,
  Alternate Synthetic Sheet, Alternate Creature Sheet, Alternate Vehicle Sheet, Alternate Item Sheet,
  Alternate Career Sheet, Alternate System Sheet, Alternate Journal Sheet and so on — in place of "Alternate Sheet" for all of them.
- The ranged attack dialog starts on Short range instead of Adjacent. A weapon that only reaches
  Adjacent still starts there.

### Added

- **Gear, cash, agenda and signature item by the book** — after the talent, building by the book
  now offers the career's personal agendas and signature items, two picks from its list of gear,
  and its roll for cash, read from the rulebook's character chapter in the world's Journal.
- **Builder for synthetics** — the Builder button is on a synthetic's sheet as well. An android
  is built by the book, then adds +3 to two attributes of its choice.
- **Artificial womb soldiers** — the character builder asks whether the character is a human or an
  artificial womb soldier, and the Bio tab has a Type field for it. A womb soldier is always a
  marine, can raise Strength to 7, can't raise Wits or Empathy above 3, and starts with Overkill.
  On the life path their origin, upbringing and reason for joining are fixed, and what they
  experienced is rolled on a table of their own.
- **Nickname** — a Nickname field on the character sheet's Bio tab, labelled Callsign when the
  character's career is a marine's or a pilot's. Chat shows it after the first word of the
  character's name, as in Ellen “Boss” Ripley.
- **Builder creation methods** — the character builder now starts by asking how to create the
  character. By the book is the builder as it was. Colonial Marine Life Path, for a Colonial
  Marines campaign, adds its own steps first. Command asks whether you are the unit commander: the
  commander is a Corporal; anyone else picks Private or Private First Class. Origin rolls a
  supernation, sub-affiliation and home on the Life Path Tables. Early Life rolls what you were
  as a youth, in whose company and what you experienced, and gives the skill point that comes with
  it (your pick, where the table offers a choice) on top of the points you spend. Joining lists
  the reasons a marine joined up, to pick one or roll for it. The career step becomes MOS and
  offers the eight marine MOSs, whose skills can be raised to 4 rather than 3; Close Combat,
  Stamina and Ranged Combat can be raised to 3, and each of those and the MOS's starts at 1. The Early Life
  skill point counts toward the skill's limit. The commander may
  take an Officer talent instead of an MOS one. Field Event, after the talent, rolls an event from
  the marine's career (and a second, NCO event for the commander) and adds the skill point,
  attribute point or talent it gives; these may pass the creation limits but no score goes above 5.
  Agenda offers a list of personal agendas to pick from or roll for, or room to write your own.
  Gear shows the basic gear every marine starts with and the gear of their MOS, asks for one pick
  from each of two bonus lists, gives the commander an NCO's gear as well, and adds it all to the
  character. Signature Item offers examples to pick from or roll for, or room to write your own. Finishing
  Touches, after the review, says what is left to fill in on the sheet.
  Rolls show in chat.
- **Rank, origin, early life, joining and field events** — Rank, Supernation, Sub-affiliation,
  Home, Early life, Joining the Marines and Field events fields on the character sheet's Bio tab.
  Rank, Joining the Marines and Field events show for marines only.
- **Life Path Tables** — a compendium pack of fourteen roll tables for a Colonial Marines life
  path: Life Path - Origin and its six sub-affiliation and home tables, Early Life and its three EL
  tables, Joining the Marines, and the Enlisted and NCO event tables. The character builder uses
  the Origin, Early Life, Joining the Marines and event tables.
- **Creature sheet** — an alternate sheet for `creature` actors. Health, speed and armor sit in the
  header; the Creature tab has the signature attack with a list of what each roll on its table
  does, mobility, observation and acid splash as roll buttons, special abilities and critical
  injuries. Stats, tables and special abilities only change while Edit is on.
- **Vehicle sheet** — an alternate sheet for `vehicles` actors. Hull, armor, speed and
  manoeuvrability sit in the header. The Vehicle tab lists the crew with a seat picker, a Piloting
  roll for the pilot and a stress response (or panic roll) for each crew member, plus the mounted
  weapons with ammo and an Attack button. The Cargo tab lists weapons, armor and items.
- **Spacecraft sheet** — an alternate sheet for `spacecraft` actors, with Ship, Combat, Cargo and
  Notes tabs. Picking a major component damage result by hand works here; the system's own dialog
  for it fails to open.
- **Territory sheet** — an alternate sheet for `territory` actors: systems grouped by sector, and
  an About tab.
- **Colony sheet** — an alternate sheet for `colony` actors: stats, development level, details and
  initiatives.
- **Planet sheet** — an alternate sheet for `planet` actors: star system, world and surface regions.
- **Gear sheets** — an alternate sheet for `weapon`, `armor` and `item` items, with Details, Notes
  and Modifiers tabs. Details shows only the fields that kind of gear uses; a computer's skill dice
  are roll buttons.
- **Career and system sheets** — alternate sheets for `specialty` (Career/Specialty) and
  `planet-system` (Planet/System) items, built on the gear sheet.
- **Talent sheet** — an alternate sheet for `talent` items: the career it belongs to, its
  description and notes.
- **Ship module sheet** — an alternate sheet for `spacecraftmods` items: size class, quantity,
  capacity, cost, description and notes.
- **Ship weapon sheet** — an alternate sheet for `spacecraftweapons` items: offensive or
  defensive, with the fields that kind uses.
- **Skill stunts sheet** — an alternate sheet for `skill-stunts` items: the skill picked from a
  list, and its stunts.
- **Agenda sheet** — an alternate sheet for `agenda` items: the name and the agenda itself.
- **Critical injury sheet** — an alternate sheet for `critical-injury` items: time limit, healing
  time, whether it is fatal, its effect and its modifiers.
- **Ship damage sheet** — an alternate sheet for `spacecraft-crit` items: minor or major, the
  repair roll and the effect.
- **Colony initiative sheet** — an alternate sheet for `colony-initiative` items: policy,
  installation or project, what it adds to each colony stat, whether it is completed, and notes.
- **Journal sheet** — an alternate sheet for journal entries: Foundry's journal sheet with the
  sidebar, title, headings and links restyled to match the other alternate sheets.
- A journal page's editor window takes the alternate journal look when its journal uses the
  Alternate Journal Sheet.
- **Character builder** — a step-by-step builder for characters, opened from the character sheet
  while Edit is on: career, attributes (14 points), skills (10 points) and a starting talent, with
  the Evolved rules' limits enforced. Nothing changes on the character until the last step.
- **Readable chat** — a per-player setting, on by default, that restyles chat messages for easier
  reading while keeping the terminal green for the sender, headings and labels.
- The pilot's Piloting roll adds the vehicle's manoeuvrability, which the system's sheet leaves out.

### Fixed

- A Notes tab no longer shows "[object Object]" for the many items and actors whose notes a past
  system migration left holding that text. They show as empty, and saving a note replaces it.

## 0.2.1 — 2026-10-09

### Added

- The Rules tab has an Actions heading with a link to the rulebook's Full Actions & Quick Actions
  page. The link shows when the official journals are imported and the player can read the page.

## 0.2.0 — 2026-10-09

### Added

- **Rules tab** — a quick reference listing the full and quick actions you can take in a round,
  with the skill each one rolls, interrupt tags and a short note on actions that have an effect.
- Condition chips show what a stress or panic response does on hover, read from the world's
  Stress Response and Panic Response tables.

### Changed

- The header shows the character's Career and Specialty items in place of the career dropdown.
  Click one to open it, drag it, or remove it while Edit is on. Drag a Career or Specialty item
  onto the sheet to set it.
- A career set on the system's own sheet is still shown until a Career item replaces it.
- The Talents panel moved to the top of the Play tab's second column.

### Fixed

- Ranged attacks threw an error after the range/cover dialog. The Ranged Attack buttons now carry
  the weapon's item id, which the system's dice roller needs for its ammo supply roll.

## 0.1.0 — 2026-10-02

Initial version: an alternate sheet for `character` and `synthetic` actors in the `alienrpg`
system, registered alongside the system's own sheet.

- **Play tab** — attributes and skills, equipped weapons, conditions, critical injuries, radiation
  and supplies, with every roll as a button showing its dice count.
- **Gear tab** — weapons, armor and items with an Equipped / Carried / Stowed switch, ammo and
  quantities edited in place, and an encumbrance bar.
- **Bio tab** — appearance, agenda, buddy and rival, experience, story points and agenda cards.
- **Notes tab**.
- **Edit lock** — attributes, skill ranks, name, career and portrait only change while Edit is on.
