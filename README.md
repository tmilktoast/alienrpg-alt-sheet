# Alien RPG Alternate Sheet

An alternate character sheet for the [Alien RPG system](https://github.com/pwatson100/alienrpg)
(`alienrpg` 4.x, Foundry v13–v14), built for the **Evolved** rules. It registers alongside the
system's sheet for `character` and `synthetic` actors, so either can be used per character.

- **Play tab** — attributes and skills, equipped weapons, conditions, critical injuries, radiation
  and supplies on one screen. Every roll is a button showing the number of dice it rolls. The
  slider button beside it (or shift-click, or right-click) asks for modifiers first.
- **Gear tab** — weapons, armor and items with an Equipped / Carried / Stowed switch on each row,
  ammo and quantities edited in place, and an encumbrance bar.
- **Bio tab** — appearance, agenda, buddy and rival, experience, story points and agenda cards.
- **Edit lock** — attributes, skill ranks, name, career and portrait only change when the Edit
  button in the header is on. A blank character opens unlocked.

The sheet subclasses the system's own sheet class and calls the system's roll methods, so dice,
pushes, panic and supply rolls behave exactly as they do on the original sheet.

## Using it

Open a character, click the ⋮ menu in the window header → **Configure Sheet**, and pick
**Alternate Sheet**. To make it the default for every character, set it under *Default Sheet* in the
same dialog (GM only).

## Local development

Symlink this folder into a Foundry data directory that has the `alienrpg` system installed, then
enable the module in an Alien RPG world:

```sh
ln -s "$PWD" "<foundry data>/Data/modules/alienrpg-alt-sheet"
```

Changes to `module.json` need a return to Setup; everything else only needs F5.

## How it hooks in

`scripts/alt-sheet.mjs` waits for `ready`, looks up the system's registered sheet class for each
actor type in `CONFIG.Actor.sheetClasses`, and registers a subclass of it. What it relies on from the
system:

- the sheet's `_prepareContext` (items, encumbrance, `statuses`, `talents`, `agendas`, `critInj`,
  `specialities`), its `toggleStatus` action and its static `_onRadPointClick`
- actor methods `abilityRoll`, `rollStress`, `rollResolve`, `rollCrit`, `consumablesCheck` and their
  `…Mod` / `rollCritMan` variants, and `item.roll`

If a system update renames any of those, that is where to look.
