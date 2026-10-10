const MODULE_ID = "alienrpg-alt-sheet";
const SYSTEM_ID = "alienrpg";
const TEMPLATES = `modules/${MODULE_ID}/templates`;
const SHEET_TYPES = ["character", "synthetic"];

/** Rulebook order; the system's own config lists Wits before Agility. */
const ATTRIBUTES = ["str", "agl", "wit", "emp"];

/** The system stores where an item is as a string in `system.header.active`. */
const ITEM_STATES = { true: "equipped", false: "carried", fLocker: "stored" };
const STATE_ORDER = ["equipped", "carried", "stored"];

const WEAPON_RANGED = "1";
const WEAPON_MELEE = "2";
/** Item types (food & drink, consumables) whose food and water ratings get used up. */
const RATION_TYPES = ["7", "10"];

const RANGES = {
  1: "ALIENRPG.Engaged",
  2: "ALIENRPG.Short",
  3: "ALIENRPG.Medium",
  4: "ALIENRPG.Long",
  5: "ALIENRPG.Extreme",
};
/** The range a ranged attack's dialog starts on: Short. */
const DEFAULT_RANGE = 2;

/** World roll tables the system draws responses from; each result's description is the rule text. */
const RESPONSE_TABLES = { stress: "Stress Response Table", panic: "Panic Response Table" };

const TABS = {
  play: "fa-solid fa-dice-d6",
  gear: "fa-solid fa-toolbox",
  bio: "fa-solid fa-id-card",
  notes: "fa-solid fa-pen",
  rules: "fa-solid fa-book",
};
const CREATURE_TABS = {
  creature: "fa-solid fa-dice-d6",
  notes: "fa-solid fa-pen",
};
const VEHICLE_TABS = {
  vehicle: "fa-solid fa-dice-d6",
  cargo: "fa-solid fa-toolbox",
};

const ITEM_TABS = {
  details: "fa-solid fa-list",
  notes: "fa-solid fa-pen",
  modifiers: "fa-solid fa-sliders",
};

/** The item types that are gear, which the alternate item sheet covers. */
const GEAR_TYPES = ["weapon", "armor", "item"];
/** Which of the system's numbered item types (`item_types_list`) use each optional field. */
const ITEM_FIELDS = {
  power: ["3", "4", "8", "10"],
  food: ["7", "10"],
  water: ["7", "10"],
  airsupply: ["10"],
};
/** A computer or mainframe: its skill modifiers are dice the item itself rolls. */
const ITEM_COMPUTER = "9";
const COMPUTER_SKILLS = ["comtech", "piloting", "observation", "rangedCbt"];

/** Templates included from other templates, which Foundry has to load before a sheet renders. */
const PARTIALS = [`${TEMPLATES}/gear-list.hbs`];

/** What the system stores for a creature with no attack or critical injury table picked. */
const NO_TABLE = "None";

/**
 * Reference lists for the Rules tab: a string key under ALTSHEET.Rules, then the skill the action
 * rolls, if any. Quick actions flagged true can be taken out of turn as an interrupt.
 */
const FULL_ACTIONS = [
  ["CloseCombat", "closeCbt"],
  ["RangedAttack", "rangedCbt"],
  ["JumpClimb", "mobility"],
  ["FullCover", null],
  ["Terminal", "comtech"],
  ["Machinery", "heavyMach"],
  ["FirstAid", "medicalAid"],
  ["ClearJam", "heavyMach"],
  ["Persuade", "manipulation"],
  ["GiveOrders", "command"],
  ["Drive", "piloting"],
];
const QUICK_ACTIONS = [
  ["MoveZone"],
  ["MoveRange"],
  ["MoveDoor"],
  ["LockDoor"],
  ["PartialCover"],
  ["Defend", "closeCbt", true],
  ["Aim"],
  ["Dodge", "mobility", true],
  ["Reload"],
  ["PickUp"],
  ["Rally", "command"],
];

/** The rulebook's page on actions, at the ids it has once the official journals are imported. */
const ACTIONS_JOURNAL =
  "JournalEntry.L92GZt9CnwKtgm30.JournalEntryPage.Z0Y4W3DMfbqDO78Y#full-actions-and-quick-actions";

/** Classes the system's stylesheet hangs its CRT look on; dropped so it doesn't restyle this sheet. */
const SYSTEM_CLASSES = ["alienrpg", "ALIENRPG"];

const loc = (key) => game.i18n.localize(key);
const fmt = (key, data) => game.i18n.format(key, data);
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
const pips = (value, max) => Array.from({ length: max }, (_, i) => ({ n: i + 1, filled: i < value }));

/* -------------------------------------------- */
/*  View models                                 */
/* -------------------------------------------- */

export function prepareVitals(actor, { evolved, hasStress }) {
  const sys = actor.system;
  const { value, calculatedMax: max } = sys.header.health;
  const vitals = {
    health: {
      value,
      max,
      pct: max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0,
      cls: value <= 0 ? "danger" : value < max ? "warn" : "",
    },
    armor: sys.general.armor.value,
  };
  if (hasStress) {
    const stress = sys.header.stress.value;
    vitals.stress = {
      value: stress,
      mod: sys.header.stress.mod,
      pips: pips(stress, 10),
      cls: stress >= 7 ? "danger" : stress >= 4 ? "warn" : "",
    };
  }
  if (evolved && sys.header.resolve) {
    const { value: base, mod, calculatedMax } = sys.header.resolve;
    vitals.resolve = { base, mod, value: calculatedMax };
  }
  return vitals;
}

/** Attributes in rulebook order, each with the skills that roll on it. */
export function prepareAttributes(actor) {
  const { attributes, skills } = actor.system;
  const cfg = CONFIG.ALIENRPG;
  return ATTRIBUTES.filter((key) => attributes[key]).map((key) => {
    const attr = attributes[key];
    const label = loc(cfg.attributes[key]);
    return {
      key,
      label,
      base: attr.value,
      total: attr.mod,
      modified: attr.mod !== attr.value,
      tooltip: fmt("ALTSHEET.Breakdown", { base: attr.value, mod: signed(attr.mod - attr.value), total: attr.mod }),
      skills: Object.entries(cfg.skills)
        .filter(([skey, s]) => s.attrib === key && skills[skey])
        .map(([skey, s]) => {
          const skill = skills[skey];
          return {
            key: skey,
            label: loc(s.name),
            rank: skill.value,
            total: skill.mod,
            tooltip: fmt("ALTSHEET.SkillBreakdown", {
              rank: skill.value,
              attribute: label,
              attr: attr.mod,
              mod: signed(skill.mod - skill.value - attr.mod),
              total: skill.mod,
            }),
          };
        }),
    };
  });
}

function rangeLabel(value) {
  return RANGES[value] ? loc(RANGES[value]) : "—";
}

function itemState(item) {
  return ITEM_STATES[item.system.header.active] ?? "carried";
}

function weaponRow(item) {
  const { attributes: a, header } = item.system;
  const ranged = header.type.value === WEAPON_RANGED;
  const melee = header.type.value === WEAPON_MELEE;
  return {
    id: item.id,
    name: item.name,
    img: item.img,
    ranged,
    typed: ranged || melee,
    typeLabel: ranged ? loc("ALIENRPG.WepTypeRanged") : melee ? loc("ALIENRPG.WepTypeMelee") : "",
    damage: a.damage.value,
    bonus: signed(a.bonus.value || 0),
    range: rangeLabel(a.range.value),
    rounds: a.rounds.value,
    power: a.power.value,
    armorPiercing: header.armorpiercing,
    fullAuto: header.fullauto,
    empty: ranged && a.rounds.value <= 0,
  };
}

function sortedWeapons(actor) {
  return actor.items.filter((item) => item.type === "weapon").sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

/** Equipped weapons, with the dice pool an attack will roll. */
export function prepareWeapons(actor) {
  const skills = actor.system.skills;
  return sortedWeapons(actor)
    .filter((item) => itemState(item) === "equipped")
    .map((item) => {
      const row = weaponRow(item);
      const bonus = item.system.attributes.bonus.value || 0;
      return { ...row, pool: (skills[row.ranged ? "rangedCbt" : "closeCbt"]?.mod ?? 0) + bonus };
    });
}

function gearRow(item) {
  const cfg = CONFIG.ALIENRPG;
  const a = item.system.attributes;
  const state = itemState(item);
  const fields = [];
  // A field with a path is edited in place; one without is read-only.
  const field = (label, value, path) => fields.push({ label: loc(label), value, path });
  let meta = "";
  let power = 0;

  switch (item.type) {
    case "weapon": {
      const type = item.system.header.type.value;
      meta = cfg.weapon_type_list?.[type] ? loc(cfg.weapon_type_list[type].label) : "";
      field("ALIENRPG.Damage", a.damage.value);
      field("ALIENRPG.Range", rangeLabel(a.range.value));
      if (a.bonus.value) field("ALIENRPG.Bonus", signed(a.bonus.value));
      if (type === WEAPON_RANGED) field("ALIENRPG.ammo", a.rounds.value, "system.attributes.rounds.value");
      field("ALTSHEET.Qty", a.quantity.value, "system.attributes.quantity.value");
      power = a.power.value;
      break;
    }
    case "armor":
      field("ALTSHEET.Rating", a.armorrating.value);
      field("ALIENRPG.Air", a.airsupply.value, "system.attributes.airsupply.value");
      break;
    default: {
      const type = item.system.header.type.value;
      const rations = RATION_TYPES.includes(type);
      meta = cfg.item_types_list?.[type] ? loc(cfg.item_types_list[type].label) : "";
      field("ALTSHEET.Qty", a.quantity.value, "system.attributes.quantity.value");
      if (rations || a.food.value) field("ALIENRPG.Food", a.food.value, rations ? "system.attributes.food.value" : null);
      if (rations || a.water.value) field("ALIENRPG.Water", a.water.value, rations ? "system.attributes.water.value" : null);
      if (a.airsupply.value) field("ALIENRPG.Air", a.airsupply.value);
      power = a.power.value;
    }
  }

  return {
    id: item.id,
    name: item.name,
    img: item.img,
    meta,
    state,
    equipped: state === "equipped",
    carried: state === "carried",
    stored: state === "stored",
    fields,
    power,
    // The system's sheet works out totalWeight while preparing items; stowed items have none.
    weight: state === "stored" ? null : Math.round((item.totalWeight ?? 0) * 100) / 100,
  };
}

/** Weapons, armor and gear, each sorted equipped → carried → stowed. */
export function prepareGear(actor) {
  const sections = {
    weapon: { type: "weapon", label: loc("ALIENRPG.InventoryWeaponsHeader"), items: [] },
    armor: { type: "armor", label: loc("ALIENRPG.InventoryArmorHeader"), items: [] },
    item: { type: "item", label: loc("ALIENRPG.InventoryItemsHeader"), items: [] },
  };
  const sorted = [...actor.items].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  for (const item of sorted) sections[item.type]?.items.push(gearRow(item));
  for (const section of Object.values(sections)) {
    section.items.sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));
  }
  return Object.values(sections);
}

/** What a stress or panic response does, as written on the table the system rolls it from. */
function responseDescription(status) {
  if (!status.tableNumber) return "";
  const table = game.tables.getName(RESPONSE_TABLES[status.resp]);
  return table?.getResultsForRoll(status.tableNumber)[0]?.description ?? "";
}

/**
 * Sort the system's status effects into general, stress response and panic response groups.
 * @param {Record<string, object>} statuses  As built by the system sheet's _prepareStatusEffects
 */
export function prepareConditions(actor, statuses, { hasStress }) {
  const lists = { general: [], stress: [], panic: [] };
  for (const [id, status] of Object.entries(statuses ?? {})) {
    const group = id !== "keepingguard" && lists[status.resp] ? status.resp : "general";
    lists[group].push({
      id,
      label: loc(status.name),
      img: status.img,
      active: status.active === "active",
      disabled: status.disabled,
      level: status.tableNumber ?? 0,
      tooltip: status.tooltip || responseDescription(status),
    });
  }
  for (const list of Object.values(lists)) list.sort((a, b) => a.level - b.level);

  const groups = [{ key: "general", label: loc("ALTSHEET.General"), list: lists.general }];
  if (hasStress) {
    groups.push(
      { key: "stress", label: loc("ALIENRPG.StressResponses"), list: lists.stress },
      { key: "panic", label: loc("ALIENRPG.PanicResponses"), list: lists.panic },
    );
  }

  // Effects the system adds by itself (encumbered, radiation, …) have no toggle; list them read-only.
  const known = new Set(Object.keys(statuses ?? {}));
  const other = actor.effects
    .filter((effect) => effect.active && ![...effect.statuses].some((s) => known.has(s)))
    .map((effect) => ({ name: effect.name, img: effect.img }));

  const shown = groups.filter((g) => g.list.length);
  return { groups: shown, active: shown.flatMap((g) => g.list).filter((c) => c.active), other };
}

export function prepareRadiation(actor) {
  const { value, max, permanent, calculatedMax } = actor.system.general.radiation;
  return {
    value,
    permanent,
    // Permanent rads fill the track from the far end, as on the system's sheet.
    pips: Array.from({ length: max }, (_, i) => ({ filled: i < value, permanent: i >= calculatedMax })),
  };
}

export function prepareSupplies(actor) {
  return ["Air", "Food", "Water"].map((key) => ({
    key,
    label: loc(`ALIENRPG.${key}`),
    value: actor.system.consumables[key.toLowerCase()].value,
  }));
}

export function prepareRules() {
  const skills = CONFIG.ALIENRPG.skills;
  const entries = (group, actions) =>
    actions.map(([key, skill, interrupt]) => {
      const note = `ALTSHEET.Rules.${group}Notes.${key}`;
      return {
        label: loc(`ALTSHEET.Rules.${group}.${key}`),
        skill: skills[skill] ? loc(skills[skill].name) : "",
        interrupt: !!interrupt,
        // Only some actions have an effect worth spelling out.
        note: game.i18n.has(note) ? loc(note) : "",
      };
    });
  return { full: entries("Full", FULL_ACTIONS), quick: entries("Quick", QUICK_ACTIONS) };
}

/** A link to the rulebook's actions page, or nothing if the world lacks it or the user can't read it. */
async function prepareActionsLink() {
  const page = await fromUuid(ACTIONS_JOURNAL.split("#")[0]);
  if (!page?.testUserPermission(game.user, "OBSERVER")) return "";
  return foundry.applications.ux.TextEditor.enrichHTML(
    `@UUID[${ACTIONS_JOURNAL}]{${loc("ALTSHEET.Rules.ActionsLink")}}`,
  );
}

function prepareBio(actor) {
  const { xp, sp, career } = actor.system.general;
  // Careers are Career/Specialty items now. The system's older career field shares its list with
  // talents, where 0 means "general talent"; it is only shown until an item replaces it.
  const legacy = Number(career.value) ? CONFIG.ALIENRPG.career_list[career.value] : null;
  return {
    career: legacy ? loc(legacy.label) : "",
    xp: { value: xp.value, max: xp.max, pips: pips(xp.value, xp.max) },
    sp: { value: sp.value, max: sp.max, pips: pips(sp.value, sp.max) },
  };
}

function prepareInjuries(items) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    img: item.img,
    fatal: item.system.attributes?.fatal,
    effects: (item.system.attributes?.effects ?? "").replace(/<[^>]+>/g, " ").trim(),
  }));
}

function enrich(actor, html, relativeTo = actor) {
  return foundry.applications.ux.TextEditor.enrichHTML(html ?? "", {
    secrets: actor.isOwner,
    rollData: actor.getRollData(),
    relativeTo,
  });
}

/** A value the system rolls as that many dice. Creatures store "-" for a skill they lack. */
function dicePool(value) {
  const dice = Number(value);
  return String(value ?? "").trim() !== "" && Number.isInteger(dice) && dice >= 0 ? dice : null;
}

export function prepareCreatureVitals(actor) {
  const { header, attributes } = actor.system;
  const { value, max } = header.health;
  const armor = (key, label, spbutt) => ({
    key,
    label: loc(label),
    spbutt,
    value: attributes[key].value,
    // The system makes no roll for an armor rating of zero.
    rollable: attributes[key].value > 0,
  });
  return {
    health: {
      value,
      max,
      pct: max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0,
      cls: value <= 0 ? "danger" : value < max ? "warn" : "",
    },
    speed: attributes.speed.value,
    armor: [
      armor("armorrating", "ALIENRPG.InventoryArmorHeader", "armor"),
      armor("armorvfire", "ALIENRPG.ArmorVsFire", "armorVfire"),
    ],
  };
}

export function prepareCreatureSkills(actor) {
  const { general } = actor.system;
  const skill = (key) => {
    const dice = dicePool(general[key].value);
    return { key, label: general[key].label, value: general[key].value, dice, rollable: dice !== null };
  };
  return { skills: [skill("mobility"), skill("observation")], acid: skill("acidSplash") };
}

export function prepareVehicleVitals(actor) {
  const a = actor.system.attributes;
  const { value, max } = a.hull;
  return {
    hull: {
      value,
      max,
      pct: max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0,
      cls: value <= 0 ? "danger" : value < max ? "warn" : "",
    },
    // The system makes no roll for an armor rating of zero.
    armor: { value: a.armorrating.value, rollable: a.armorrating.value > 0 },
    speed: a.speed.value,
    manoeuvrability: { value: a.manoeuvrability.value, label: signed(a.manoeuvrability.value) },
  };
}

/** A vehicle's occupants in seat order, with the rolls each one makes from their own sheet's numbers. */
export function prepareCrew(actor, { evolved }) {
  const { crewPositionFlags: seats, crewPositionFlagsLocalized: labels } = CONFIG.ALIENRPG.vehicle;
  const manoeuvrability = actor.system.attributes.manoeuvrability.value;
  return actor.system.crew.occupants
    .map(({ id, position }) => {
      const member = game.actors.get(id);
      const row = {
        id,
        name: member?.name ?? loc("ALTSHEET.Vehicle.MissingCrew"),
        img: member?.img ?? "icons/svg/mystery-man.svg",
        missing: !member,
        seat: seats.indexOf(position),
        positions: seats.map((value) => ({ value, label: loc(labels[value]), selected: value === position })),
      };
      if (!member) return row;

      if (position === "PILOT") {
        const skill = member.system.skills.piloting.mod;
        row.piloting = {
          skill,
          manoeuvrability,
          total: skill + manoeuvrability,
          modified: manoeuvrability !== 0,
          label: `${actor.name} - ${loc("ALIENRPG.Skillpiloting")}`,
          tooltip: fmt("ALTSHEET.Vehicle.PilotingBreakdown", {
            skill,
            mod: signed(manoeuvrability),
            total: skill + manoeuvrability,
          }),
        };
      }

      const hasStress = member.type === "character" || !!member.system.header.synthstress;
      if (hasStress) {
        const vitals = prepareVitals(member, { evolved, hasStress });
        // Evolved rolls a stress response against Resolve; the first edition rolls panic against stress.
        if (!evolved) row.stress = { panicroll: vitals.stress.value, mod: vitals.stress.mod, label: loc("ALIENRPG.Panic") };
        else if (vitals.resolve) {
          row.stress = { roll: vitals.resolve.base, mod: vitals.resolve.mod, label: loc("ALIENRPG.Resolve") };
        }
      }
      return row;
    })
    .sort((a, b) => a.seat - b.seat || a.name.localeCompare(b.name));
}

/**
 * One of a creature's roll tables, by the name the system stores for it.
 * @param {string} name       The table's name, or "None"
 * @param {boolean} [results] List what each roll does, as the table's results describe it
 */
async function prepareCreatureTable(actor, name, results = false) {
  const table = name && name !== NO_TABLE ? game.tables.getName(name) : null;
  if (!table) return { name: "", missing: !!name && name !== NO_TABLE, results: [] };
  const rows = results ? [...table.results].sort((a, b) => a.range[0] - b.range[0]) : [];
  return {
    name: table.name,
    results: await Promise.all(
      rows.map(async (result) => {
        const [low, high] = result.range;
        return { range: low === high ? `${low}` : `${low}–${high}`, text: await enrich(actor, result.description) };
      }),
    ),
  };
}

/**
 * The fields of a weapon, armor or item, as the Details tab lays them out.
 * @returns {{types: object[]|null, fields: object[], checks: object[], computer: object[]}}
 */
export function prepareItemDetails(item, { evolved }) {
  const cfg = CONFIG.ALIENRPG;
  const { attributes: a, header, modifiers } = item.system;
  const type = header.type?.value;
  const options = (list, selected) =>
    Object.entries(list).map(([value, { label }]) => ({ value, label: loc(label), selected: value === String(selected) }));
  const fields = [];
  const field = (label, key, kind = "number", extra = {}) =>
    fields.push({ label: loc(label), name: `system.attributes.${key}.value`, value: a[key].value, kind, ...extra });
  const details = { types: null, fields, checks: [], computer: [] };

  switch (item.type) {
    case "weapon": {
      const ranged = type === WEAPON_RANGED;
      const ranges = evolved ? cfg.evolved_weapon_range_list : cfg.weapon_range_list;
      details.types = options(cfg.weapon_type_list, type);
      field("ALIENRPG.Damage", "damage");
      field("ALIENRPG.Bonus", "bonus");
      // Only Evolved gives ranged weapons a minimum range.
      if (evolved && ranged) field("ALIENRPG.minrng", "minrange", "select", { options: options(ranges, a.minrange.value) });
      field(evolved && ranged ? "ALIENRPG.maxrng" : "ALIENRPG.Range", "range", "select", {
        options: options(ranges, a.range.value),
      });
      if (ranged) field("ALIENRPG.ammo", "rounds");
      field("ALIENRPG.Power", "power");
      field("ALIENRPG.QuantityLabel", "quantity");
      field("ALIENRPG.Class", "class", "text");
      field("ALIENRPG.Weight", "weight", "decimal");
      field("ALIENRPG.Cost", "cost", "cash");
      if (evolved) {
        const check = (label, key) =>
          details.checks.push({ label: loc(label), name: `system.header.${key}`, checked: header[key] });
        check("ALIENRPG.ArmorPiercing", "armorpiercing");
        if (ranged) check("ALIENRPG.FullAuto", "fullauto");
      }
      break;
    }
    case "armor":
      field("ALIENRPG.ArmorRating", "armorrating");
      field("ALIENRPG.AirSupply", "airsupply");
      field("ALIENRPG.Weight", "weight", "decimal");
      field("ALIENRPG.Cost", "cost", "cash");
      break;
    default: {
      const uses = (key) => ITEM_FIELDS[key].includes(type);
      details.types = options(cfg.item_types_list, type);
      field("ALIENRPG.QuantityLabel", "quantity");
      if (uses("power")) field("ALIENRPG.Power", "power");
      if (uses("food")) field("ALIENRPG.Food", "food");
      if (uses("water")) field("ALIENRPG.Water", "water");
      if (uses("airsupply")) field("ALIENRPG.AirSupply", "airsupply");
      field("ALIENRPG.Weight", "weight", "decimal");
      field("ALIENRPG.Cost", "cost", "cash");
      if (type === ITEM_COMPUTER) {
        details.computer = COMPUTER_SKILLS.map((key) => ({
          key,
          label: loc(cfg.skills[key].name),
          name: `system.modifiers.skills.${key}.value`,
          value: modifiers.skills[key].value,
        }));
      }
    }
  }
  return details;
}

/** The bonuses an item gives whoever has it equipped: attributes first, then skills by attribute. */
export function prepareItemModifiers(item) {
  const cfg = CONFIG.ALIENRPG;
  const { modifiers, header } = item.system;
  // A computer's own dice sit on the Details tab; what is left here are bonuses to its user.
  const computer = item.type === "item" && header.type?.value === ITEM_COMPUTER;
  const row = (group, key, label) => ({
    label,
    name: `system.modifiers.${group}.${key}.value`,
    value: modifiers[group][key].value,
  });
  const groups = [];
  if (!computer) {
    groups.push({
      label: loc("ALIENRPG.Attributes"),
      rows: [...ATTRIBUTES, "health", "stress", "resolve"]
        .filter((key) => modifiers.attributes[key])
        .map((key) => row("attributes", key, loc(cfg.modifiers[key]))),
    });
  }
  for (const attr of ATTRIBUTES) {
    const rows = Object.entries(cfg.skills)
      .filter(([key, skill]) => skill.attrib === attr && modifiers.skills[key])
      .filter(([key]) => !(computer && COMPUTER_SKILLS.includes(key)))
      .map(([key, skill]) => row("skills", key, loc(skill.name)));
    if (rows.length) groups.push({ label: loc(cfg.attributes[attr]), rows });
  }
  return groups;
}

/* -------------------------------------------- */
/*  Sheet                                       */
/* -------------------------------------------- */

/**
 * What every alternate sheet shares: the look, the edit lock, tabs, roll buttons and item buttons.
 * Subclassing the system's sheet keeps its data preparation, status effects and drag-and-drop;
 * only the layout, the templates and the click handling are replaced.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system sheet for this actor type
 */
function makeBase(Base) {
  // The system sheet's render hooks assume its own templates, so a few overrides skip past it.
  const Core = Object.getPrototypeOf(Base.prototype);

  return class AltBase extends Base {
    static DEFAULT_OPTIONS = {
      classes: ["alien-alt-sheet"],
      actions: {
        toggleEdit: AltBase.#onToggleEdit,
        roll: { handler: AltBase.#onRoll, buttons: [0, 2] },
        rollMods: AltBase.#onRollMods,
        stepField: AltBase.#onStepField,
        addItem: AltBase.#onAddItem,
        editItem: AltBase.#onEditItem,
        deleteItem: AltBase.#onDeleteItem,
      },
    };

    /** Tab ids and their icons, in order; the first is the one a sheet opens on. */
    static TABS = {};

    /** Whether the sheet's locked fields are open for editing. Decided on first render. */
    _editMode = null;

    /** Keys of the <details> elements the user has opened, so they survive re-renders. */
    _openSections = new Set();

    _initializeApplicationOptions(options) {
      const merged = super._initializeApplicationOptions(options);
      merged.classes = merged.classes.filter((c) => !SYSTEM_CLASSES.includes(c));
      return merged;
    }

    _configureRenderOptions(options) {
      Core._configureRenderOptions.call(this, options);
      if (this.document.limited) options.parts = ["header"];
    }

    _getTabs(parts) {
      const icons = this.constructor.TABS;
      this.tabGroups.primary ??= Object.keys(icons)[0];
      const tabs = {};
      for (const id of parts) {
        if (!(id in icons)) continue;
        tabs[id] = {
          id,
          group: "primary",
          icon: icons[id],
          label: `ALTSHEET.Tabs.${id.capitalize()}`,
          cssClass: this.tabGroups.primary === id ? "active" : "",
        };
      }
      return tabs;
    }

    async _preparePartContext(partId, context, options) {
      context = await Core._preparePartContext.call(this, partId, context, options);
      if (partId in this.constructor.TABS) context.tab = context.tabs[partId];
      return context;
    }

    async _onRender(context, options) {
      await Core._onRender.call(this, context, options);
      const html = this.element;

      // Fields driven by an active effect can't be edited by hand.
      for (const key of Object.keys(foundry.utils.flattenObject(this.actor.overrides ?? {}))) {
        const input = html.querySelector(`[name="${key}"]`);
        if (input) input.disabled = true;
      }

      // Item values edited in place. They aren't actor fields, so keep them out of the form submit.
      for (const input of html.querySelectorAll("[data-item-field]")) {
        input.addEventListener("change", (event) => {
          event.stopPropagation();
          const value = Math.max(0, Math.round(Number(input.value) || 0));
          this._item(input)?.update({ [input.dataset.itemField]: value });
        });
      }

      html.querySelector(".aas-cash")?.addEventListener("change", (event) => {
        event.target.value = formatCash(event.target.value);
      });

      for (const details of html.querySelectorAll("details[data-section]")) {
        const key = details.dataset.section;
        details.open = this._openSections.has(key);
        details.addEventListener("toggle", () => {
          if (details.open) this._openSections.add(key);
          else this._openSections.delete(key);
        });
      }
    }

    _item(target) {
      return this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    }

    /**
     * Make one of the system's rolls. Every roll reads its inputs from the clicked element's
     * dataset, exactly as the system's own sheet passes them.
     * @param {HTMLElement} target  The element carrying data-roll-type and the roll's data
     * @param {boolean} withMods    Ask for modifiers first
     * @abstract
     */
    async _roll(target, withMods) {}

    static async #onRoll(event, target) {
      event.preventDefault();
      if (event.detail > 1) return; // Ignore repeated clicks
      await this._roll(target, event.button === 2 || event.shiftKey);
    }

    /** The slider button beside a roll: the same roll, asking for modifiers first. */
    static async #onRollMods(event, target) {
      const roll = target.closest(".aas-rollgroup")?.querySelector("[data-roll-type]");
      if (roll) await this._roll(roll, true);
    }

    static async #onToggleEdit() {
      this._editMode = !this._editMode;
      await this.render();
    }

    /** Step a numeric field on the actor, or on an item when the button sits inside an item row. */
    static async #onStepField(event, target) {
      const { path, step, min, max } = target.dataset;
      const doc = target.closest("[data-item-id]") ? this._item(target) : this.actor;
      if (!doc) return;
      const current = Number(foundry.utils.getProperty(doc, path)) || 0;
      let next = current + Number(step);
      if (min !== undefined) next = Math.max(next, Number(min));
      if (max !== undefined) next = Math.min(next, Number(max));
      if (next !== current) await doc.update({ [path]: next });
    }

    static async #onAddItem(event, target) {
      const { type } = target.dataset;
      const cls = getDocumentClass("Item");
      const data = { name: cls.defaultName({ type, parent: this.actor }), type };
      // A weapon with no type can't be rolled, so start from the common case.
      if (type === "weapon") data.system = { header: { type: { value: WEAPON_RANGED } } };
      const item = await cls.create(data, { parent: this.actor });
      item?.sheet.render(true);
    }

    static #onEditItem(event, target) {
      this._item(target)?.sheet.render(true);
    }

    static async #onDeleteItem(event, target) {
      const item = this._item(target);
      if (!item) return;
      const lastInjury = item.type === "critical-injury" && this.actor.system.general.critInj.value <= 1;
      const deleted = await item.deleteDialog();
      // The system marks an injured character with an effect; clear it with the last injury.
      if (deleted && lastInjury) await this.actor.effects.find((e) => e.statuses.has("criticalinj"))?.delete();
    }
  };
}

/**
 * The alternate sheet for characters and synthetics.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system sheet for this actor type
 * @param {string} type                                           The actor type it is registered for
 */
function makeSheet(Base, type) {
  class AltSheet extends makeBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 800, height: 880 },
      actions: {
        setField: AltSheet.#onSetField,
        radiation: AltSheet.#onRadiation,
        setItemState: AltSheet.#onSetItemState,
      },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      play: { template: `${TEMPLATES}/play.hbs`, scrollable: [""] },
      gear: { template: `${TEMPLATES}/gear.hbs`, scrollable: [""] },
      bio: { template: `${TEMPLATES}/bio.hbs`, scrollable: [""] },
      notes: { template: `${TEMPLATES}/notes.hbs`, scrollable: [""] },
      rules: { template: `${TEMPLATES}/rules.hbs`, scrollable: [""] },
    };

    static TABS = TABS;

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const sys = actor.system;
      const evolved = context.isEvolved;
      const hasStress = actor.type === "character" || !!sys.header.synthstress;

      // A blank character opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= ATTRIBUTES.every((key) => !sys.attributes[key]?.value);

      const described = (items) =>
        Promise.all(
          items.map(async (item) => ({
            id: item.id,
            name: item.name,
            img: item.img,
            description: await enrich(actor, item.system.general?.comment?.value, item),
          })),
        );

      const bio = prepareBio(actor);

      return Object.assign(context, {
        editMode: this._editMode && this.isEditable,
        hasStress,
        vitals: prepareVitals(actor, { evolved, hasStress }),
        attributeGroups: prepareAttributes(actor),
        weapons: prepareWeapons(actor),
        gear: prepareGear(actor),
        itemStates: true,
        powerRolls: true,
        conditions: prepareConditions(actor, context.statuses, { hasStress }),
        radiation: prepareRadiation(actor),
        supplies: prepareSupplies(actor),
        bio: { ...bio, careerHint: this.isEditable && (this._editMode || !bio.career) },
        rules: { ...prepareRules(), actionsLink: await prepareActionsLink() },
        talentList: await described(context.talents),
        agendaList: await described(context.agendas),
        injuries: prepareInjuries(context.critInj),
        encumbrance: { ...sys.general.encumbrance, value: Math.round(sys.general.encumbrance.value * 100) / 100 },
        enrichedNotes: await enrich(actor, sys.notes),
        enrichedAdhocitems: await enrich(actor, sys.adhocitems),
      });
    }

    async _roll(target, withMods) {
      const actor = this.actor;
      const data = target.dataset;
      switch (data.rollType) {
        case "ability":
          return withMods ? actor.rollAbilityMod(actor, data) : actor.abilityRoll(actor, data);
        case "weapon": {
          const item = this._item(target);
          if (!item) return;
          const { header, attributes } = item.system;
          if (header.type.value === WEAPON_RANGED && attributes.rounds.value <= 0) {
            return ui.notifications.warn(loc("ALIENRPG.noAmmo"));
          }
          if (header.type.value !== WEAPON_RANGED) return item.roll(withMods, data);
          // The system's range/cover dialog opens on the first range. Start it on Short, or on
          // the weapon's own range if that is closer.
          const range = String(Math.min(DEFAULT_RANGE, Number(attributes.range.value) || DEFAULT_RANGE));
          const hook = Hooks.on("renderDialogV2", (_app, element) => {
            const select = element.querySelector("select#rangeChoice");
            if (select?.querySelector(`option[value="${range}"]`)) select.value = range;
          });
          try {
            return await item.roll(withMods, data);
          } finally {
            Hooks.off("renderDialogV2", hook);
          }
        }
        // The system's method names predate Evolved: there, rollResolve draws a stress
        // response and rollStress draws a panic response.
        case "stress":
          return withMods ? actor.rollResolveMod(actor, data) : actor.rollResolve(actor, data);
        case "panic":
          if (game.settings.get(SYSTEM_ID, "evolved")) {
            return withMods ? actor.rollStressMod(actor, data) : actor.rollStress(actor, data);
          }
          return withMods ? actor.rollPanicMod(actor, data) : actor.rollPanic(actor, data);
        case "crit":
          return withMods ? actor.rollCritMan(actor, actor.type, data) : actor.rollCrit(actor, actor.type, data);
        case "supply": {
          const label = `${loc(`ALIENRPG.${data.spbutt}`)} ${loc("ALIENRPG.Supply")}`;
          const args = [actor, data.spbutt.toLowerCase(), label, data.id || 0, data, 0];
          return withMods ? actor.consumablesCheckMod(...args) : actor.consumablesCheck(...args);
        }
      }
    }

    /** Click a pip to fill the track up to it; click the last filled pip to clear it. */
    static async #onSetField(event, target) {
      const { path } = target.dataset;
      const value = Number(target.dataset.value);
      const current = Number(foundry.utils.getProperty(this.actor, path)) || 0;
      await this.actor.update({ [path]: current === value ? value - 1 : value });
    }

    /**
     * The system keeps its radiation rules in a click handler that reads the mouse button and
     * the Ctrl key. Hand it the equivalent click so each case gets its own labelled button here.
     */
    static async #onRadiation(event, target) {
      const { op } = target.dataset;
      const click = {
        button: op.startsWith("remove") ? 2 : 0,
        ctrlKey: op.endsWith("Permanent"),
        detail: 1,
        preventDefault() {},
        stopPropagation() {},
      };
      await Base._onRadPointClick.call(this, click, target);
    }

    static async #onSetItemState(event, target) {
      await this._item(target)?.update({ "system.header.active": target.dataset.state });
    }
  }

  // Sheets are registered by class name, so the two actor types need distinct ones.
  Object.defineProperty(AltSheet, "name", { value: `AltSheet${type.capitalize()}` });
  return AltSheet;
}

/**
 * The alternate sheet for creatures: the stat block, the signature attack and its table, and
 * critical injuries on one tab.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system's creature sheet
 */
function makeCreatureSheet(Base) {
  class AltCreatureSheet extends makeBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 800, height: 760 },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/creature-header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      creature: { template: `${TEMPLATES}/creature.hbs`, scrollable: [""] },
      notes: { template: `${TEMPLATES}/notes.hbs`, scrollable: [""] },
    };

    static TABS = CREATURE_TABS;

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const sys = actor.system;

      // A blank creature opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= !sys.header.health.max && (!sys.rTables || sys.rTables === NO_TABLE);

      return Object.assign(context, {
        editMode: this._editMode && this.isEditable,
        vitals: prepareCreatureVitals(actor),
        ...prepareCreatureSkills(actor),
        attack: await prepareCreatureTable(actor, sys.rTables, true),
        crit: await prepareCreatureTable(actor, sys.cTables),
        // The system's creature sheet lists every item a creature owns as an injury.
        injuries: prepareInjuries(context.critInj),
        special: sys.general.special.value,
        enrichedNotes: await enrich(actor, sys.notes),
      });
    }

    async _roll(target, withMods) {
      const actor = this.actor;
      const data = target.dataset;
      switch (data.rollType) {
        case "ability":
          return withMods ? actor.rollAbilityMod(actor, data) : actor.abilityRoll(actor, data);
        // With modifiers, an attack or injury asks which result to use instead of rolling for it.
        case "attack":
          if (!game.tables.getName(data.atttype)) return ui.notifications.warn(loc("ALTSHEET.Creature.NoAttackTable"));
          return withMods ? actor.creatureManAttackRoll(actor, data) : actor.creatureAutoAttackRoll(actor, data);
        case "crit":
          return withMods ? actor.rollCritMan(actor, actor.type, data) : actor.rollCrit(actor, actor.type, data);
        // The system reads this roll's inputs from the element rather than its dataset.
        case "acid":
          return actor.creatureAcidRoll(actor, target);
      }
    }
  }

  return AltCreatureSheet;
}

/**
 * The alternate sheet for vehicles: hull and handling in the header, the crew and their rolls, the
 * mounted weapons, and a cargo tab.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system's vehicle sheet
 */
function makeVehicleSheet(Base) {
  class AltVehicleSheet extends makeBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 800, height: 760 },
      actions: {
        openCrew: AltVehicleSheet.#onOpenCrew,
        removeCrew: AltVehicleSheet.#onRemoveCrew,
      },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/vehicle-header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      vehicle: { template: `${TEMPLATES}/vehicle.hbs`, scrollable: [""] },
      cargo: { template: `${TEMPLATES}/vehicle-cargo.hbs`, scrollable: [""] },
    };

    static TABS = VEHICLE_TABS;

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const { attributes, crew } = actor.system;

      // A blank vehicle opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= !attributes.hull.max && !attributes.speed.value && !attributes.armorrating.value;

      return Object.assign(context, {
        editMode: this._editMode && this.isEditable,
        vitals: prepareVehicleVitals(actor),
        crewList: prepareCrew(actor, { evolved: context.isEvolved }),
        // The system seats a driver on top of the passengers a vehicle is rated for.
        seats: { taken: crew.occupants.length, max: attributes.passengers.value + 1 },
        weapons: sortedWeapons(actor).map(weaponRow),
        gear: prepareGear(actor),
        details: {
          passengers: attributes.passengers.value,
          cost: attributes.cost.value,
          description: attributes.comment.value,
        },
      });
    }

    async _onRender(context, options) {
      await super._onRender(context, options);

      // Seats aren't actor fields the form can submit; the system keeps them in its occupant list.
      for (const select of this.element.querySelectorAll("select[data-crew-position]")) {
        select.addEventListener("change", (event) => {
          event.stopPropagation();
          this.actor.addVehicleOccupant(this.#crewId(select), select.value);
        });
      }
    }

    #crewId(target) {
      return target.closest("[data-crew-id]")?.dataset.crewId;
    }

    async _roll(target, withMods) {
      const actor = this.actor;
      const data = target.dataset;
      switch (data.rollType) {
        case "ability":
          return withMods ? actor.rollAbilityMod(actor, data) : actor.abilityRoll(actor, data);
        // The system asks who is firing, the range and any modifiers before every vehicle attack.
        case "weapon": {
          const item = this._item(target);
          if (!item) return;
          const { header, attributes } = item.system;
          if (header.type.value === WEAPON_RANGED && attributes.rounds.value <= 0) {
            return ui.notifications.warn(loc("ALIENRPG.noAmmo"));
          }
          if (game.settings.get(SYSTEM_ID, "evolved")) data.isEvolved = true;
          return item.roll(false, data);
        }
        // A crew member's own stress response (Evolved) or panic roll, made as that character.
        case "crewStress": {
          const member = game.actors.get(this.#crewId(target));
          if (!member) return;
          if (game.settings.get(SYSTEM_ID, "evolved")) {
            return withMods ? member.rollResolveMod(member, data) : member.rollResolve(member, data);
          }
          return withMods ? member.rollPanicMod(member, data) : member.rollPanic(member, data);
        }
      }
    }

    static #onOpenCrew(event, target) {
      game.actors.get(this.#crewId(target))?.sheet.render(true);
    }

    static async #onRemoveCrew(event, target) {
      const occupants = this.actor.removeVehicleOccupant(this.#crewId(target));
      await this.actor.update({ "system.crew.occupants": occupants, "system.crew.passengerQty": occupants.length });
    }
  }

  return AltVehicleSheet;
}

/**
 * The alternate sheet for gear: weapons, armor and items. One class covers all three, as the
 * system's own item sheet does.
 * @param {typeof foundry.applications.sheets.ItemSheetV2} Base  The system's item sheet
 */
function makeItemSheet(Base) {
  // As on the actor sheets, the system's render options and part contexts assume its own templates.
  const Core = Object.getPrototypeOf(Base.prototype);

  return class AltItemSheet extends Base {
    static DEFAULT_OPTIONS = {
      classes: ["alien-alt-sheet", "aas-item-sheet"],
      position: { width: 560, height: 620 },
      window: { resizable: true },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/item-header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      details: { template: `${TEMPLATES}/item-details.hbs`, scrollable: [""] },
      notes: { template: `${TEMPLATES}/item-notes.hbs`, scrollable: [""] },
      modifiers: { template: `${TEMPLATES}/item-modifiers.hbs`, scrollable: [""] },
    };

    _initializeApplicationOptions(options) {
      const merged = super._initializeApplicationOptions(options);
      merged.classes = merged.classes.filter((c) => !SYSTEM_CLASSES.includes(c));
      return merged;
    }

    _configureRenderOptions(options) {
      Core._configureRenderOptions.call(this, options);
      if (this.document.limited) options.parts = ["header"];
    }

    _getTabs(parts) {
      this.tabGroups.primary ??= "details";
      const tabs = {};
      for (const id of parts) {
        if (!(id in ITEM_TABS)) continue;
        tabs[id] = {
          id,
          group: "primary",
          icon: ITEM_TABS[id],
          label: `ALTSHEET.Tabs.${id.capitalize()}`,
          cssClass: this.tabGroups.primary === id ? "active" : "",
        };
      }
      return tabs;
    }

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const item = this.item;
      return Object.assign(context, {
        details: prepareItemDetails(item, { evolved: context.isEvolved }),
        modifierGroups: prepareItemModifiers(item),
        typeLabel: loc(`TYPES.Item.${item.type}`),
        enrichedComment: await enrich(item, item.system.attributes.comment.value),
        enrichedNotes: await enrich(item, item.system.notes),
      });
    }

    async _preparePartContext(partId, context, options) {
      context = await Core._preparePartContext.call(this, partId, context, options);
      if (partId in ITEM_TABS) context.tab = context.tabs[partId];
      return context;
    }

    async _onRender(context, options) {
      await Core._onRender.call(this, context, options);
      this.element.querySelector(".aas-cash")?.addEventListener("change", (event) => {
        event.target.value = formatCash(event.target.value);
      });
    }
  };
}

/** Format cash the way the system's sheet does, following its dollar-sign setting. */
function formatCash(text) {
  const value = Number(String(text).replace(/[^0-9.-]+/g, "")) || 0;
  const dollar = game.settings.get(SYSTEM_ID, "dollar");
  return Intl.NumberFormat("en-EN", {
    style: dollar ? "currency" : "decimal",
    currency: "USD",
    useGrouping: dollar,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

Hooks.once("init", () => {
  if (game.system.id === SYSTEM_ID) foundry.applications.handlebars.loadTemplates(PARTIALS);
});

// The system's sheet classes only show up in CONFIG once Foundry has applied the registrations
// queued during init, which happens just before "ready".
Hooks.once("ready", () => {
  if (game.system.id !== SYSTEM_ID) return;
  const sheets = { creature: makeCreatureSheet, vehicles: makeVehicleSheet };
  for (const type of SHEET_TYPES) sheets[type] = (Base) => makeSheet(Base, type);
  for (const [type, make] of Object.entries(sheets)) {
    const Base = Object.values(CONFIG.Actor.sheetClasses[type] ?? {}).find((s) => s.id.startsWith(`${SYSTEM_ID}.`))?.cls;
    if (!Base) {
      console.warn(`${MODULE_ID} | No ${SYSTEM_ID} sheet found for "${type}" actors; skipping.`);
      continue;
    }
    foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, MODULE_ID, make(Base), {
      types: [type],
      makeDefault: false,
      label: "ALTSHEET.SheetLabel",
    });
  }

  // The system uses one sheet class for every item type; so does this, for the gear types.
  const ItemBase = Object.values(CONFIG.Item.sheetClasses[GEAR_TYPES[0]] ?? {}).find((s) => s.id.startsWith(`${SYSTEM_ID}.`))?.cls;
  if (!ItemBase) return console.warn(`${MODULE_ID} | No ${SYSTEM_ID} item sheet found; skipping.`);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, MODULE_ID, makeItemSheet(ItemBase), {
    types: GEAR_TYPES,
    makeDefault: false,
    label: "ALTSHEET.SheetLabel",
  });
});
