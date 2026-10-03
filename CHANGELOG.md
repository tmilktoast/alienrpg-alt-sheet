# Changelog

Notable changes to the Alien RPG Alternate Sheet. Versions follow the `version` field in
`module.json`.

## Unreleased

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
