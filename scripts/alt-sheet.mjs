import { CharacterBuilder, KINDS, isMarineCareer } from "./builder.mjs";

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
const SPACECRAFT_TABS = {
  ship: "fa-solid fa-dice-d6",
  combat: "fa-solid fa-crosshairs",
  cargo: "fa-solid fa-toolbox",
  notes: "fa-solid fa-pen",
};
const TERRITORY_TABS = {
  systems: "fa-solid fa-sun",
  about: "fa-solid fa-book-open",
};
const COLONY_TABS = {
  colony: "fa-solid fa-city",
  notes: "fa-solid fa-pen",
};
/** A colony's stats, each with the field naming who heads it. */
const COLONY_STATS = {
  economy: "economydirector",
  potential: "potentialname",
  productivity: "productivityname",
  maintenance: "maintenancename",
  science: "sciencename",
  spirit: "spiritname",
};
/** The development totals a colony has to pass to reach each level, as on the system's colony sheet. */
const COLONY_LEVELS = [5, 30, 40, 53, 68, 85];
/** The system's numbered kinds of colony initiative (`colony_policy_list`). */
const COLONY_INITIATIVES = { 1: "Policies", 2: "Installations", 3: "Projects" };
const PLANET_TABS = {
  planet: "fa-solid fa-globe",
  notes: "fa-solid fa-pen",
};
/** A planet's fields as the sheet groups them. Those marked true are counts; the rest are text. */
const PLANET_FIELDS = {
  System: { parentstar: false, radiation: false, planetposition: true, gasgiants: true, rockyplanets: true, iceplanets: true, asteroidbelts: true },
  World: {
    planetsize: false,
    atmosphere: false,
    hydrosphere: false,
    gravity: false,
    climate: false,
    daylength: false,
    orbitalperiod: false,
    axialtilt: false,
    globalfeature: false,
    personality: false,
  },
};
/** The regions of a planet's surface, north to south. Each has a `rp…` flag for resource potential. */
const PLANET_REGIONS = ["northpole", "nhwest", "nheast", "equator", "shwest", "sheast", "southpole"];

/**
 * What each crew seat rolls, by the kind of actor crewed: the crew member's skill, plus one of the
 * craft's own ratings where it has one that helps. `spbutt` is the system's name for a roll it
 * gives a dialog of its own.
 */
const CREW_ROLLS = {
  vehicles: { PILOT: { skill: "piloting", bonus: "manoeuvrability" } },
  spacecraft: {
    PILOT: { skill: "piloting", bonus: "thrusters" },
    "SENSOR-OP": { skill: "comtech", spbutt: "comtech" },
    ENGINEER: { skill: "heavyMach", spbutt: "heavyMach" },
  },
};
const SHIP_WEAPON_OFFENSIVE = "1";
const SHIP_WEAPON_DEFENSIVE = "2";
const SHIP_CRIT_MAJOR = "1";
const SHIP_PHASES = ["sensor", "pilot", "gunner", "engineer"];

const ITEM_TABS = {
  details: "fa-solid fa-list",
  notes: "fa-solid fa-pen",
  modifiers: "fa-solid fa-sliders",
};

/** The item types that are gear, which the alternate item sheet covers. */
const GEAR_TYPES = ["weapon", "armor", "item"];
/** Other item types with an alternate sheet of their own name, keyed by its ALTSHEET.SheetLabel. */
const NAMED_ITEM_TYPES = {
  career: "specialty",
  system: "planet-system",
  talent: "talent",
  module: "spacecraftmods",
  shipWeapon: "spacecraftweapons",
  stunts: "skill-stunts",
  agenda: "agenda",
  injury: "critical-injury",
  shipDamage: "spacecraft-crit",
  initiative: "colony-initiative",
};
/** The tabs after Details that each item type has; a type not listed has Notes and Modifiers. */
const ITEM_EXTRA_TABS = {
  specialty: [],
  "planet-system": [],
  talent: ["notes"],
  spacecraftmods: ["notes"],
  spacecraftweapons: ["notes"],
  "skill-stunts": [],
  agenda: [],
  "critical-injury": ["modifiers"],
  "spacecraft-crit": [],
  "colony-initiative": ["notes"],
};
/** Item types whose image the system sets itself each time their sheet draws. */
const ITEM_FIXED_IMAGE = ["specialty", "planet-system", "talent", "spacecraft-crit", "colony-initiative"];
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
const PARTIALS = [`${TEMPLATES}/gear-list.hbs`, `${TEMPLATES}/crew-list.hbs`];

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

/** The class the module's stylesheet restyles Foundry's journal markup under. */
const JOURNAL_CLASS = "alien-alt-journal";
/** The class on <body> that turns on the module's restyle of chat messages. */
const CHAT_CLASS = "alien-alt-chat";

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

/**
 * A name with a nickname or callsign set into it, after the first word: Ellen "Boss" Ripley. A name
 * of one word, or of more than two, takes it in the same place.
 */
export function nameWithNickname(name, nickname) {
  const [first, ...rest] = name.trim().split(/\s+/);
  // A name that already says it is left alone.
  if (!first || name.toLowerCase().includes(nickname.toLowerCase())) return name;
  return [first, `\u201c${nickname}\u201d`, ...rest].join(" ");
}

/** The Colonial Marines' ranks, in lower case, and the abbreviation each goes by. */
const RANK_ABBREVIATIONS = {
  private: "PVT",
  "private first class": "PFC",
  "lance corporal": "LCPL",
  corporal: "CPL",
  sergeant: "SGT",
  "staff sergeant": "SSGT",
  "gunnery sergeant": "GYSGT",
  "master sergeant": "MSGT",
  "first sergeant": "1STSGT",
  "master gunnery sergeant": "MGYSGT",
  "sergeant major": "SGTMAJ",
  "warrant officer": "WO",
  "chief warrant officer": "CWO",
  "second lieutenant": "2NDLT",
  "first lieutenant": "1STLT",
  lieutenant: "LT",
  captain: "CAPT",
  major: "MAJ",
  "lieutenant colonel": "LTCOL",
  colonel: "COL",
  "brigadier general": "BGEN",
  "major general": "MAJGEN",
  "lieutenant general": "LTGEN",
  general: "GEN",
};

/**
 * A rank as it is written before a name: its abbreviation if it is one of the Marines', and
 * otherwise as it was typed, which may be an abbreviation already or a rank of some other service.
 */
export function rankAbbreviation(rank) {
  const key = rank.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  return RANK_ABBREVIATIONS[key] ?? rank.trim();
}

/** A character's name as it is shown when it isn't being edited: PVT Kalah "Dagger" Hardnick. */
export function displayName(actor) {
  const rank = actor.getFlag(MODULE_ID, "rank")?.trim();
  const nickname = actor.getFlag(MODULE_ID, "nickname")?.trim();
  const name = nickname ? nameWithNickname(actor.name, nickname) : actor.name;
  return rank ? `${rankAbbreviation(rank)} ${name}` : name;
}

/** The names of a character's careers: their Career items, and the system's older career field. */
function careerNames(actor) {
  const { career } = actor.system.general;
  const legacy = Number(career.value) ? CONFIG.ALIENRPG.career_list[career.value] : null;
  return [...actor.items.filter((item) => item.type === "specialty").map((item) => item.name), legacy ? loc(legacy.label) : ""];
}

/** Whether a character is a marine. Their career may be one of the MOSs, which don't all say "marine". */
function isMarine(actor) {
  return actor.getFlag(MODULE_ID, "kind") === "womb" || careerNames(actor).some(isMarineCareer);
}

/** Whether a character's nickname is a callsign: marines and pilots have those. */
const hasCallsign = (actor) => isMarine(actor) || careerNames(actor).some((name) => /pilot/i.test(name));

function prepareBio(actor) {
  const { xp, sp, career } = actor.system.general;
  // Careers are Career/Specialty items now. The system's older career field shares its list with
  // talents, where 0 means "general talent"; it is only shown until an item replaces it.
  const legacy = Number(career.value) ? CONFIG.ALIENRPG.career_list[career.value] : null;
  return {
    career: legacy ? loc(legacy.label) : "",
    // The system has no fields for a rank or a life path, so they are kept on the module's own flags.
    rank: actor.getFlag(MODULE_ID, "rank") ?? "",
    displayName: displayName(actor),
    // A marine's fields: on anyone else's sheet only the ones already filled in are shown.
    marine: isMarine(actor),
    // What kind of character this is: the system knows them all as characters.
    kinds: KINDS.map((id) => ({ id, label: loc(`ALTSHEET.Kind.${id}`), selected: (actor.getFlag(MODULE_ID, "kind") ?? "human") === id })),
    nickname: actor.getFlag(MODULE_ID, "nickname") ?? "",
    nicknameLabel: loc(hasCallsign(actor) ? "ALTSHEET.Callsign" : "ALTSHEET.Nickname"),
    origin: actor.getFlag(MODULE_ID, "origin") ?? {},
    earlyLife: actor.getFlag(MODULE_ID, "earlyLife") ?? "",
    joining: actor.getFlag(MODULE_ID, "joining") ?? "",
    fieldEvents: actor.getFlag(MODULE_ID, "fieldEvents") ?? "",
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

/**
 * A document's notes. A past system migration turned notes that were stored as an object into
 * the text "[object Object]", which many compendium items and actors still carry; show those as empty.
 */
function notesOf(doc) {
  const notes = doc.system.notes;
  return typeof notes === "string" && notes !== "[object Object]" ? notes : "";
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

/** A craft's occupants in seat order, with the rolls each one makes from their own sheet's numbers. */
export function prepareCrew(actor, { evolved }) {
  const { crewPositionFlags: seats, crewPositionFlagsLocalized: labels } = CONFIG.ALIENRPG[
    actor.type === "spacecraft" ? "spacecraft" : "vehicle"
  ];
  const rolls = CREW_ROLLS[actor.type] ?? {};
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

      const seat = rolls[position];
      if (seat) {
        const skill = member.system.skills[seat.skill].mod;
        const skillName = loc(CONFIG.ALIENRPG.skills[seat.skill].name);
        const bonus = seat.bonus ? actor.system.attributes[seat.bonus].value : 0;
        row.roll = {
          skill,
          bonus,
          spbutt: seat.spbutt,
          total: skill + bonus,
          modified: bonus !== 0,
          name: skillName,
          label: `${actor.name} - ${skillName}`,
          tooltip: seat.bonus
            ? fmt("ALTSHEET.Vehicle.RollBreakdown", {
                name: skillName,
                skill,
                rating: loc(`ALTSHEET.Vehicle.Rating.${seat.bonus}`),
                mod: signed(bonus),
                total: skill + bonus,
              })
            : fmt("ALTSHEET.RollFor", { name: skillName }),
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

export function prepareSpacecraftVitals(actor) {
  const a = actor.system.attributes;
  const max = a.hull.value;
  const value = a.damage.value;
  return {
    // Damage counts up towards the hull rating, so the meter fills as things get worse.
    damage: {
      value,
      max,
      pct: max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0,
      cls: max > 0 && value >= max ? "danger" : value > 0 ? "warn" : "",
    },
    // The system makes no roll for an armor rating of zero.
    armor: { value: a.armor.value, rollable: a.armor.value > 0 },
    thrusters: signed(a.thrusters.value),
    signature: signed(a.signature.value),
  };
}

/** A spacecraft's weapons, split the way the system types them. */
export function prepareArmaments(actor, { evolved }) {
  const ranges = evolved ? CONFIG.ALIENRPG.evolved_ship_weapon_range_list : CONFIG.ALIENRPG.ship_weapon_range_list;
  const rows = (type) =>
    actor.items
      .filter((item) => item.type === "spacecraftweapons" && item.system.header.type.value === type)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((item) => {
        const a = item.system.attributes;
        return {
          id: item.id,
          name: item.name,
          img: item.img,
          bonus: signed(a.bonus.value || 0),
          damage: a.damage.value,
          range: ranges[a.range.value] ? loc(ranges[a.range.value].label) : "—",
          hardpoint: a.hardpoint.value,
        };
      });
  return { offensive: rows(SHIP_WEAPON_OFFENSIVE), defensive: rows(SHIP_WEAPON_DEFENSIVE) };
}

export function prepareShipModules(actor) {
  return actor.items
    .filter((item) => item.type === "spacecraftmods")
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((item) => {
      const a = item.system.attributes;
      return { id: item.id, name: item.name, img: item.img, quantity: a.quantity.value, size: a.size.value, capacity: a.capacity.value };
    });
}

/** Component damage, minor and major, each with what it does and how it is repaired. */
export function prepareShipDamage(actor) {
  const lists = { minor: [], major: [] };
  for (const item of actor.items) {
    if (item.type !== "spacecraft-crit") continue;
    const { header } = item.system;
    lists[header.type.value === SHIP_CRIT_MAJOR ? "major" : "minor"].push({
      id: item.id,
      name: item.name,
      img: item.img,
      effects: (header.effects ?? "").replace(/<[^>]+>/g, " ").trim(),
      repair: (header.repairroll ?? "").replace(/<[^>]+>/g, " ").trim(),
    });
  }
  return [
    { key: "minor", label: loc("ALIENRPG.MINOR-COMPONENT-DAMAGE"), list: lists.minor },
    { key: "major", label: loc("ALIENRPG.MAJOR-COMPONENT-DAMAGE"), list: lists.major },
  ];
}

/** A colony's stats with the modifiers its initiatives add, and the development level they come to. */
export function prepareColonyStats(actor) {
  const { stats, attributes } = actor.system;
  const mods = Object.fromEntries(Object.keys(COLONY_STATS).map((key) => [key, 0]));
  for (const item of actor.items) {
    if (item.type !== "colony-initiative") continue;
    for (const key of Object.keys(mods)) mods[key] += Number(item.system.modifiers[key]?.value) || 0;
  }
  const rows = Object.entries(COLONY_STATS).map(([key, head]) => ({
    key,
    label: loc(`ALIENRPG.${key}`),
    headPath: `system.attributes.${head}`,
    head: attributes[head],
    base: stats[key].value,
    mod: signed(mods[key]),
    modified: mods[key] !== 0,
    total: stats[key].value + mods[key],
  }));
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const level = COLONY_LEVELS.filter((threshold) => total > threshold).length;
  const next = COLONY_LEVELS[level];
  return {
    rows,
    total,
    level,
    // How far through the current level the colony is; full once there is no level left to reach.
    pct: next === undefined ? 100 : Math.min(Math.max(total / (next + 1), 0), 1) * 100,
    next: next === undefined ? null : next + 1,
  };
}

/** A colony's initiatives, split into policies, installations and projects. */
export function prepareColonyInitiatives(actor) {
  const groups = Object.entries(COLONY_INITIATIVES).map(([type, key]) => ({ type, label: loc(`ALIENRPG.${key}`), list: [] }));
  const sorted = [...actor.items].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  for (const item of sorted) {
    if (item.type !== "colony-initiative") continue;
    const { header, modifiers } = item.system;
    groups.find((group) => group.type === header.type)?.list.push({
      id: item.id,
      name: item.name,
      img: item.img,
      completed: header.completed,
      comment: (header.comment ?? "").replace(/<[^>]+>/g, " ").trim(),
      mods: Object.keys(COLONY_STATS)
        .filter((key) => Number(modifiers[key]?.value))
        .map((key) => ({ label: loc(`ALIENRPG.${key}`), value: signed(Number(modifiers[key].value)) })),
    });
  }
  return groups;
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
 * The fields of an item, as the Details tab lays them out, and where its description is kept.
 * @returns {{types: {name: string, options: object[]}|null, names?: object[], fields: object[], checks: object[], computer: object[], description: string,
 *   descriptionLabel?: string, text?: boolean}}  `text` when the fields hold phrases and want wider columns
 */
export function prepareItemDetails(item, { evolved }) {
  const cfg = CONFIG.ALIENRPG;
  const { attributes: a, header, modifiers } = item.system;
  const type = header?.type?.value;
  const options = (list, selected) =>
    Object.entries(list).map(([value, { label }]) => ({ value, label: loc(label), selected: value === String(selected) }));
  const fields = [];
  const field = (label, key, kind = "number", extra = {}) =>
    fields.push({ label: loc(label), name: `system.attributes.${key}.value`, value: a[key].value, kind, ...extra });
  const details = { types: null, fields, checks: [], computer: [], description: "system.attributes.comment.value" };
  // Lists whose entries carry the value to store as `key` instead of being numbered by it.
  const keyed = (list, selected) =>
    Object.values(list).map(({ key, label }) => ({ value: String(key), label: loc(label), selected: String(key) === String(selected) }));
  // The select beside the name: which field it sets and what it offers.
  const typed = (name, list, selected) => (details.types = { name, options: options(list, selected) });

  switch (item.type) {
    // A skill's stunts are named for the skill, so the name is picked from the list of skills.
    case "skill-stunts":
      details.names = keyed(cfg.skills_list, item.name);
      details.description = "system.description";
      break;
    case "agenda":
      details.description = "system.general.comment.value";
      break;
    // What an initiative adds to each of its colony's stats.
    case "colony-initiative":
      typed("system.header.type", cfg.colony_policy_list, header.type);
      for (const key of Object.keys(COLONY_STATS)) {
        fields.push({
          label: loc(`ALIENRPG.${key}`),
          name: `system.modifiers.${key}.value`,
          value: modifiers[key].value,
          kind: "number",
        });
      }
      details.checks.push({ label: loc("ALIENRPG.completed"), name: "system.header.completed", checked: header.completed });
      details.description = "system.header.comment";
      break;
    case "spacecraft-crit":
      typed("system.header.type.value", cfg.crit_list, type);
      fields.push({
        label: loc("ALIENRPG.REPAIRROLL"),
        name: "system.header.repairroll",
        value: (header.repairroll ?? "").replace(/<[^>]+>/g, " ").trim(),
        kind: "text",
      });
      details.description = "system.header.effects";
      details.descriptionLabel = "ALIENRPG.Effect";
      details.text = true;
      break;
    case "critical-injury":
      field("ALIENRPG.TimeLimit", "timelimit", "select", { options: options(cfg.crit_timelimit_list, a.timelimit.value) });
      field("ALIENRPG.HealTime", "healingtime", "text");
      details.checks.push({ label: loc("ALIENRPG.Fatal"), name: "system.attributes.fatal", checked: a.fatal });
      details.description = "system.attributes.effects";
      details.descriptionLabel = "ALIENRPG.Effect";
      break;
    case "talent":
      typed("system.general.career.value", cfg.career_list, item.system.general.career.value);
      details.description = "system.general.comment.value";
      break;
    case "spacecraftmods":
      // A module's size class, or that it is an upgrade; the system stores the label itself.
      details.types = { name: "system.attributes.size.value", options: keyed(cfg.ship_attributes_list, a.size.value) };
      field("ALIENRPG.QuantityLabel", "quantity");
      field("ALIENRPG.CapacityBarLabel", "capacity", "text");
      field("ALIENRPG.Cost", "cost", "cash");
      break;
    case "spacecraftweapons": {
      typed("system.header.type.value", cfg.ship_weapon_type_list, type);
      const ranges = evolved ? cfg.evolved_ship_weapon_range_list : cfg.ship_weapon_range_list;
      // A defensive system has no attack of its own, so no damage or range.
      if (type !== SHIP_WEAPON_DEFENSIVE) field("ALIENRPG.Damage", "damage");
      field("ALIENRPG.Bonus", "bonus");
      if (type !== SHIP_WEAPON_DEFENSIVE) field("ALIENRPG.Range", "range", "select", { options: keyed(ranges, a.range.value) });
      field("ALIENRPG.hardpoint", "hardpoint", "select", { options: keyed(cfg.ship_hardpoint_list, a.hardpoint.value), text: true });
      field("ALIENRPG.QuantityLabel", "quantity");
      field("ALIENRPG.Cost", "cost", "cash");
      break;
    }
    // A career or specialty is its description and nothing else.
    case "specialty":
      details.description = "system.general.comment.value";
      break;
    case "planet-system": {
      const text = (group, key, label, kind = "text") =>
        fields.push({ label: loc(label), name: `system.${group}.${key}.value`, value: item.system[group][key].value, kind });
      text("header", "commonName", "ALIENRPG.CommonName");
      text("header", "system", "ALIENRPG.System");
      text("header", "sector", "ALIENRPG.Sector");
      text("header", "location", "ALIENRPG.Location");
      text("details", "affiliation", "ALIENRPG.Affiliation");
      text("details", "classification", "ALIENRPG.Classification");
      text("details", "population", "ALIENRPG.population");
      text("details", "meanTemperature", "ALIENRPG.meanTemperature");
      text("details", "climate", "ALIENRPG.climate", "textarea");
      text("details", "terrain", "ALIENRPG.terrain", "textarea");
      text("details", "colonies", "ALIENRPG.colonies", "textarea");
      text("details", "keyResources", "ALIENRPG.keyResources", "textarea");
      details.description = "system.misc.description.value";
      details.text = true;
      break;
    }
    case "weapon": {
      const ranged = type === WEAPON_RANGED;
      const ranges = evolved ? cfg.evolved_weapon_range_list : cfg.weapon_range_list;
      typed("system.header.type.value", cfg.weapon_type_list, type);
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
      typed("system.header.type.value", cfg.item_types_list, type);
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
  // A colony initiative's modifiers are to its colony's stats; they are fields on its Details tab.
  if (!modifiers?.skills) return [];
  const computer = item.type === "item" && header?.type?.value === ITEM_COMPUTER;
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
      // A weapon with no type can't be rolled or listed, so start from the common case.
      if (type === "weapon") data.system = { header: { type: { value: WEAPON_RANGED } } };
      if (type === "spacecraftweapons") data.system = { header: { type: { value: SHIP_WEAPON_OFFENSIVE } } };
      // A colony initiative is a policy, an installation or a project; the button says which.
      if (type === "colony-initiative") data.system = { header: { type: target.dataset.kind } };
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
        openBuilder: AltSheet.#onOpenBuilder,
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
        canBuild: this.isEditable,
        conditions: prepareConditions(actor, context.statuses, { hasStress }),
        radiation: prepareRadiation(actor),
        supplies: prepareSupplies(actor),
        bio: { ...bio, careerHint: this.isEditable && (this._editMode || !bio.career) },
        rules: { ...prepareRules(), actionsLink: await prepareActionsLink() },
        talentList: await described(context.talents),
        agendaList: await described(context.agendas),
        injuries: prepareInjuries(context.critInj),
        encumbrance: { ...sys.general.encumbrance, value: Math.round(sys.general.encumbrance.value * 100) / 100 },
        notes: notesOf(actor),
        enrichedNotes: await enrich(actor, notesOf(actor)),
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

    static #onOpenBuilder() {
      new CharacterBuilder({ actor: this.actor }).render(true);
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
        notes: notesOf(actor),
        enrichedNotes: await enrich(actor, notesOf(actor)),
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
 * What the sheets for crewed craft share: seating the crew, their rolls, and firing weapons the
 * crew operate.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system sheet for this actor type
 */
function makeCrewedBase(Base) {
  return class AltCrewedBase extends makeBase(Base) {
    static DEFAULT_OPTIONS = {
      actions: {
        openCrew: AltCrewedBase.#onOpenCrew,
        removeCrew: AltCrewedBase.#onRemoveCrew,
      },
    };

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
        // The system asks who is firing, the range and any modifiers before every attack.
        case "weapon": {
          const item = this._item(target);
          if (!item) return;
          const { header, attributes } = item.system;
          if (item.type === "weapon" && header.type.value === WEAPON_RANGED && attributes.rounds.value <= 0) {
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
  };
}

/**
 * The alternate sheet for vehicles: hull and handling in the header, the crew and their rolls, the
 * mounted weapons, and a cargo tab.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system's vehicle sheet
 */
function makeVehicleSheet(Base) {
  class AltVehicleSheet extends makeCrewedBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 800, height: 760 },
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
  }

  return AltVehicleSheet;
}

/**
 * The alternate sheet for spacecraft: damage and handling in the header; the crew, armaments and
 * component damage on the Ship tab; then combat phases, cargo and notes.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system's spacecraft sheet
 */
function makeSpacecraftSheet(Base) {
  class AltSpacecraftSheet extends makeCrewedBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 860, height: 800 },
      actions: {
        showImage: AltSpacecraftSheet.#onShowImage,
      },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/spacecraft-header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      ship: { template: `${TEMPLATES}/spacecraft.hbs`, scrollable: [""] },
      combat: { template: `${TEMPLATES}/spacecraft-combat.hbs`, scrollable: [""] },
      cargo: { template: `${TEMPLATES}/spacecraft-cargo.hbs`, scrollable: [""] },
      notes: { template: `${TEMPLATES}/notes.hbs`, scrollable: [""] },
    };

    static TABS = SPACECRAFT_TABS;

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const { attributes: a, crew } = actor.system;
      const cfg = CONFIG.ALIENRPG;

      // A blank ship opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= !a.hull.value && !a.thrusters.value && !a.model;

      return Object.assign(context, {
        editMode: this._editMode && this.isEditable,
        vitals: prepareSpacecraftVitals(actor),
        crewList: prepareCrew(actor, { evolved: context.isEvolved }),
        // The system allows a ship its crew, its passengers and one more.
        seats: { taken: crew.occupants.length, max: a.passengers.value + a.crew.value + 1 },
        armaments: prepareArmaments(actor, { evolved: context.isEvolved }),
        shipDamage: prepareShipDamage(actor),
        modules: prepareShipModules(actor),
        gear: prepareGear(actor),
        phases: SHIP_PHASES.map((key) => ({
          key: `${key}Phase`,
          label: loc(`ALIENRPG.${key}Phase`),
          options: Object.values(cfg[`${key}_list`]).map(({ label }) => loc(label)),
        })),
        notes: notesOf(actor),
        enrichedNotes: await enrich(actor, notesOf(actor)),
      });
    }

    async _roll(target, withMods) {
      const actor = this.actor;
      const data = target.dataset;
      if (data.rollType !== "shipCrit") return super._roll(target, withMods);
      // With modifiers, component damage asks which result to use instead of rolling for it.
      if (!withMods) return actor.rollCrit(actor, actor.type, data);
      if (data.crbut !== "major") return actor.rollCritMan(actor, actor.type, data);
      const pick = await this.#pickMajorDamage();
      if (pick) return actor.rollCrit(actor, actor.type, data, pick);
    }

    /**
     * Ask which major component damage result to use. The system's dialog for this points at a
     * template that isn't where it says, so it fails; this asks the same question.
     * @returns {Promise<string|null>}  The 2d6 result picked, or null if the dialog was dismissed
     */
    async #pickMajorDamage() {
      const hint = loc("ALIENRPG.RollManShipMajorCrit");
      const value = await foundry.applications.api.DialogV2.prompt({
        window: { title: "ALIENRPG.RollManCrit" },
        content: `<div class="form-group"><label>${hint}</label><input type="number" name="manCrit" min="2" max="12" step="1" value="2" autofocus></div>`,
        ok: { label: "ALIENRPG.DialRoll", callback: (event, button) => button.form.elements.manCrit.valueAsNumber },
        rejectClose: false,
      });
      if (value == null) return null;
      if (!Number.isInteger(value) || value < 2 || value > 12) {
        ui.notifications.warn(hint);
        return null;
      }
      return String(value);
    }

    static #onShowImage() {
      new foundry.applications.apps.ImagePopout({ src: this.actor.img, window: { title: this.actor.name } }).render(true);
    }
  }

  return AltSpacecraftSheet;
}

/**
 * The alternate sheet for territories: the systems in a stretch of space, grouped by sector, and
 * what is known about it.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system's territory sheet
 */
function makeTerritorySheet(Base) {
  return class AltTerritorySheet extends makeBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 640, height: 720 },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/simple-header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      systems: { template: `${TEMPLATES}/territory-systems.hbs`, scrollable: [""] },
      about: { template: `${TEMPLATES}/territory-about.hbs`, scrollable: [""] },
    };

    static TABS = TERRITORY_TABS;

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const { comment, sectors } = actor.system;
      const systems = actor.items.filter((item) => item.type === "planet-system");

      // A blank territory opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= !comment.value && !sectors.value && !systems.length;

      const bySector = new Map();
      for (const item of systems) {
        const { sector, system, commonName } = item.system.header;
        const key = sector.value || loc("ALTSHEET.Territory.NoSector");
        if (!bySector.has(key)) bySector.set(key, []);
        bySector.get(key).push({
          id: item.id,
          name: item.name,
          img: item.img,
          system: system.value,
          // The rulebooks' common names carry the odd line break tag.
          commonName: commonName.value.replace(/<[^>]+>/g, " ").trim(),
        });
      }
      const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true });

      return Object.assign(context, {
        editMode: this._editMode && this.isEditable,
        header: { key: "Territory", subtitle: fmt("ALTSHEET.Territory.Count", { count: systems.length }) },
        sectors: [...bySector.entries()]
          .sort(([a], [b]) => byName(a, b))
          .map(([name, list]) => ({ name, systems: list.sort((a, b) => byName(a.system || a.name, b.system || b.name)) })),
        about: { description: comment.value, sectors: sectors.value },
      });
    }
  };
}

/**
 * The alternate sheet for colonies: the six stats with who heads each and what its initiatives add,
 * the development level they come to, and the initiatives themselves.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system's colony sheet
 */
function makeColonySheet(Base) {
  return class AltColonySheet extends makeBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 800, height: 780 },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/simple-header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      colony: { template: `${TEMPLATES}/colony.hbs`, scrollable: [""] },
      notes: { template: `${TEMPLATES}/notes.hbs`, scrollable: [""] },
    };

    static TABS = COLONY_TABS;

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const { attributes } = actor.system;
      const colony = prepareColonyStats(actor);

      // A blank colony opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= !colony.total && !attributes.location && !attributes.mission;

      return Object.assign(context, {
        editMode: this._editMode && this.isEditable,
        header: { key: "Colony", subtitle: fmt("ALTSHEET.Colony.Level", { level: colony.level }) },
        colony,
        initiatives: prepareColonyInitiatives(actor),
        facts: ["location", "mission", "established", "cycles", "sponsor", "commander"].map((key) => ({
          label: loc(`ALTSHEET.Colony.Facts.${key}`),
          name: `system.attributes.${key}`,
          value: attributes[key],
        })),
        population: attributes.population.value,
        notes: notesOf(actor),
        enrichedNotes: await enrich(actor, notesOf(actor)),
      });
    }
  };
}

/**
 * The alternate sheet for planets: the star system it sits in, the world itself, and its surface
 * region by region.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system's planet sheet
 */
function makePlanetSheet(Base) {
  return class AltPlanetSheet extends makeBase(Base) {
    static DEFAULT_OPTIONS = {
      position: { width: 800, height: 780 },
    };

    static PARTS = {
      header: { template: `${TEMPLATES}/simple-header.hbs` },
      tabs: { template: "templates/generic/tab-navigation.hbs" },
      planet: { template: `${TEMPLATES}/planet.hbs`, scrollable: [""] },
      notes: { template: `${TEMPLATES}/notes.hbs`, scrollable: [""] },
    };

    static TABS = PLANET_TABS;

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const a = actor.system.attributes;

      // A blank planet opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= !a.parentstar && !a.planetsize && !a.climate;

      return Object.assign(context, {
        editMode: this._editMode && this.isEditable,
        header: { key: "Planet", subtitle: a.parentstar },
        sections: Object.entries(PLANET_FIELDS).map(([section, fields]) => ({
          label: loc(`ALTSHEET.Planet.${section}`),
          fields: Object.entries(fields).map(([key, count]) => ({
            label: loc(`ALTSHEET.Planet.Fields.${key}`),
            name: count ? `system.attributes.${key}.value` : `system.attributes.${key}`,
            value: count ? a[key].value : a[key],
            count,
          })),
        })),
        regions: PLANET_REGIONS.map((key) => ({
          label: loc(`ALTSHEET.Planet.Regions.${key}`),
          name: `system.attributes.${key}`,
          value: a[key],
          flag: `system.attributes.rp${key}`,
          resources: a[`rp${key}`],
        })),
        notes: notesOf(actor),
        enrichedNotes: await enrich(actor, notesOf(actor)),
      });
    }
  };
}

/**
 * The alternate sheet for items. One class lays out every item type it is registered for, as the
 * system's own item sheet does: gear (weapons, armor and items), careers and systems.
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
      else {
        const extra = ITEM_EXTRA_TABS[this.document.type] ?? ["notes", "modifiers"];
        // A lone tab needs no tab bar.
        options.parts = extra.length ? ["header", "tabs", "details", ...extra] : ["header", "details"];
      }
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
      const details = prepareItemDetails(item, { evolved: context.isEvolved });
      const description = foundry.utils.getProperty(item, details.description);
      return Object.assign(context, {
        details,
        description: {
          name: details.description,
          label: loc(details.descriptionLabel ?? "ALIENRPG.Description"),
          value: description,
          html: await enrich(item, description),
        },
        modifierGroups: prepareItemModifiers(item),
        typeLabel: loc(`TYPES.Item.${item.type}`),
        // The system sets a career's and a system's image itself each time their sheet draws.
        imageEditable: context.editable && !ITEM_FIXED_IMAGE.includes(item.type),
        notes: notesOf(item),
        enrichedNotes: await enrich(item, notesOf(item)),
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

/**
 * The alternate journal sheet. The system has no journal sheet of its own, only a stylesheet that
 * gives Foundry's a CRT look; this is Foundry's sheet too, with a class the module's stylesheet
 * uses to give it the look of the other alternate sheets.
 * @param {typeof foundry.applications.sheets.journal.JournalEntrySheet} Base  Foundry's journal sheet
 */
function makeJournalSheet(Base) {
  return class AltJournalSheet extends Base {
    static DEFAULT_OPTIONS = {
      classes: [JOURNAL_CLASS],
    };
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
  if (game.system.id !== SYSTEM_ID) return;
  foundry.applications.handlebars.loadTemplates(PARTIALS);

  // Chat is shared by everyone at the table, so each player chooses for themselves.
  const applyChat = (on) => document.body.classList.toggle(CHAT_CLASS, on);
  game.settings.register(MODULE_ID, "readableChat", {
    name: "ALTSHEET.Settings.ReadableChat.Name",
    hint: "ALTSHEET.Settings.ReadableChat.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: applyChat,
  });
  applyChat(game.settings.get(MODULE_ID, "readableChat"));

  // A character with a nickname or callsign speaks in chat under it as well as their name.
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const nickname = message.speakerActor?.getFlag(MODULE_ID, "nickname")?.trim();
    const sender = html.querySelector(".message-sender");
    if (nickname && sender) sender.textContent = nameWithNickname(sender.textContent, nickname);
  });
});

// The system's sheet classes only show up in CONFIG once Foundry has applied the registrations
// queued during init, which happens just before "ready".
Hooks.once("ready", () => {
  if (game.system.id !== SYSTEM_ID) return;
  const sheets = {
    creature: makeCreatureSheet,
    vehicles: makeVehicleSheet,
    spacecraft: makeSpacecraftSheet,
    territory: makeTerritorySheet,
    colony: makeColonySheet,
    planet: makePlanetSheet,
  };
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
      label: `ALTSHEET.SheetLabel.${type}`,
    });
  }

  // The system uses one sheet class for every item type; so does this, for the gear types.
  const ItemBase = Object.values(CONFIG.Item.sheetClasses[GEAR_TYPES[0]] ?? {}).find((s) => s.id.startsWith(`${SYSTEM_ID}.`))?.cls;
  if (ItemBase) {
    const AltItemSheet = makeItemSheet(ItemBase);
    foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, MODULE_ID, AltItemSheet, {
      types: GEAR_TYPES,
      makeDefault: false,
      label: "ALTSHEET.SheetLabel.item",
    });
    // Sheets are registered by class name, so each differently named sheet needs its own class.
    for (const [key, type] of Object.entries(NAMED_ITEM_TYPES)) {
      const Sheet = class extends AltItemSheet {};
      Object.defineProperty(Sheet, "name", { value: `Alt${key.capitalize()}Sheet` });
      foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, MODULE_ID, Sheet, {
        types: [type],
        makeDefault: false,
        label: `ALTSHEET.SheetLabel.${key}`,
      });
    }
  } else console.warn(`${MODULE_ID} | No ${SYSTEM_ID} item sheet found; skipping.`);

  const AltJournalSheet = makeJournalSheet(foundry.applications.sheets.journal.JournalEntrySheet);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(JournalEntry, MODULE_ID, AltJournalSheet, {
    makeDefault: false,
    label: "ALTSHEET.SheetLabel.journal",
  });
  // A page's editor is a window of its own. Give it the journal's look when its journal has it.
  Hooks.on("renderJournalEntryPageSheet", (app) => {
    if (app.document.parent?.sheet instanceof AltJournalSheet) app.element?.classList.add(JOURNAL_CLASS);
  });
});
