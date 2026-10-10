# Changelog

Notable changes to the Alien RPG Alternate Sheet. Versions follow the `version` field in
`module.json`.

## Unreleased

### Added

- **Creature sheet** — an alternate sheet for `creature` actors. Health, speed and armor sit in the
  header; the Creature tab has the signature attack with a list of what each roll on its table
  does, mobility, observation and acid splash as roll buttons, special abilities and critical
  injuries. Stats, tables and special abilities only change while Edit is on.
- **Vehicle sheet** — an alternate sheet for `vehicles` actors. Hull, armor, speed and
  manoeuvrability sit in the header. The Vehicle tab lists the crew with a seat picker, a Piloting
  roll for the pilot and a stress response (or panic roll) for each crew member, plus the mounted
  weapons with ammo and an Attack button. The Cargo tab lists weapons, armor and items.
- **Gear sheets** — an alternate sheet for `weapon`, `armor` and `item` items, with Details, Notes
  and Modifiers tabs. Details shows only the fields that kind of gear uses; a computer's skill dice
  are roll buttons.
- The pilot's Piloting roll adds the vehicle's manoeuvrability, which the system's sheet leaves out.

### Changed

- The ranged attack dialog starts on Short range instead of Adjacent. A weapon that only reaches
  Adjacent still starts there.

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
