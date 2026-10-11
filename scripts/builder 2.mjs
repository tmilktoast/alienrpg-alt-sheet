const MODULE_ID = "alienrpg-alt-sheet";
const TEMPLATE = `modules/${MODULE_ID}/templates/builder.hbs`;

/** Rulebook order; the system's own config lists Wits before Agility. */
const ATTRIBUTES = ["str", "agl", "wit", "emp"];

/** Character creation's numbers, as the Evolved rulebook gives them. */
const RULES = {
  attributePoints: 14,
  attributeMin: 2,
  attributeMax: 4,
  keyAttributeMax: 5,
  skillPoints: 10,
  skillMax: 1,
  keySkillMax: 3,
  // Not the rulebook's: an MOS's skills go higher on the Colonial Marine Life Path, for a marine's
  // specialized and extensive training.
  mosSkillMax: 4,
  // Nor these: every marine is trained in a few skills, which go higher than most on the life path,
  // and has to start with something in those and in their MOS's.
  marineSkillMax: 3,
  trainedSkillMin: 1,
  // Nor this: what a field event adds may pass the limits above, but no score goes higher than this.
  scoreMax: 5,
  // How many things a career's list of gear gives, by the book.
  kitPicks: 2,
  // An android adds this to each of a number of attributes of its choice, after the points are spent.
  androidBonus: 3,
  androidBonusCount: 2,
  // Nor these: an artificial womb soldier is bred strong and little else, whatever their career's
  // key attribute.
  wombAttributeMax: { str: 7, wit: 3, emp: 3 },
};

/**
 * The rulebook's careers, by the name of their Career item: key attribute, key skills, and the
 * three talents to pick one from. The system's items for these careers carry no rules text of their
 * own to read these from.
 */
const CORE_CAREERS = {
  "colonial marine": ["str", ["closeCbt", "stamina", "rangedCbt"], ["Banter", "Overkill", "Precise Shooter"]],
  "colonial marshal": ["wit", ["observation", "rangedCbt", "command"], ["Authority", "Investigator", "Subdue"]],
  "company agent": ["wit", ["comtech", "observation", "manipulation"], ["Company Resources", "Cunning", "Personal Safety"]],
  kid: ["agl", ["mobility", "survival", "observation"], ["Hard To Catch", "Lucky", "Nimble"]],
  medic: ["emp", ["mobility", "observation", "medicalAid"], ["Field Medic", "Nurse", "Surgeon"]],
  officer: ["emp", ["rangedCbt", "command", "manipulation"], ["Field Commander", "Frontline Leader", "Pull Rank"]],
  pilot: ["agl", ["piloting", "rangedCbt", "comtech"], ["Full Throttle", "Like the Back of Your Hand", "Reckless"]],
  roughneck: ["str", ["heavyMach", "stamina", "closeCbt"], ["Resilient", "Steady Hands", "True Grit"]],
  scientist: ["wit", ["observation", "survival", "comtech"], ["Analysis", "Inquisitive", "Xenomorphology"]],
};

/** The ranks the Colonial Marine life path gives: one for the unit's commander, a choice for the rest. */
const COMMANDER_RANK = "Corporal";
const ENLISTED_RANKS = ["Private", "Private First Class"];

/**
 * The module's pack of life path roll tables, and the ones a marine's origin, early life and
 * reason for joining are rolled on.
 */
const LIFE_PATH_PACK = `${MODULE_ID}.life-path`;
const ORIGIN_TABLE = "Life Path - Origin";
const EARLY_LIFE_TABLE = "Early Life";
const JOINING_TABLE = "Joining the Marines";
/**
 * The table an artificial womb soldier's early life experience is rolled on. It is the GM's to
 * write, in the life path pack or the world's own Rollable Tables, and is done without until then.
 */
const WOMB_EXPERIENCE_TABLE = "EL - And Experienced (AW Soldier)";
/**
 * The tables a marine's field events are rolled on. Everyone rolls on the first; only an NCO, which
 * among new marines is the unit commander, rolls on the one marked so.
 */
const FIELD_EVENT_TABLES = [
  { id: "enlisted", table: "EVENT TABLE A – ENLISTED (BC)" },
  { id: "nco", table: "EVENT TABLE B – NCO (BC)", nco: true },
];
/**
 * The gear a marine on the life path starts with, by the name of each Gear item in the world: all
 * of the basic gear, one pick from each bonus list, all of their MOS's, and an NCO's on top for the
 * unit commander, who doesn't get a second of anything their MOS already gave. A number is how many;
 * an inner list in an MOS's gear is a choice of one. Gear with no item in the world is added as a
 * plain item of that name.
 */
const MARINE_GEAR = {
  basic: [
    "“Dog Tags” Military ID Key",
    "BATTLEDRESS UTILITIES (BDUs)",
    "M3B Standard Boots",
    "Individual Marine Pack",
    "M10 Ballistic Helmet",
    "M3 Personnel Armor",
    "TNR High Beam Shoulder Lamp",
  ],
  listA: [
    ["Signal Flares", 6],
    "Combat Knife",
    "Personal Data Transmitter",
    "Bi-Mex Anti-Flash Sunglasses",
    "Polymer Climbing Rope",
    "Folding Winch",
    "Folding Entrenching Spade",
    "Electronic Tools",
    ["Handcuffs", 3],
    "Maintenance Jack",
    "UDEP Ultra Diffusive Environmental Poncho",
    "Samani E-Series Watch",
  ],
  listB: [
    "M4A3 Service Pistol",
    "VP-70MA6 Service Pistol",
    ["G2 Electroshock Grenade", 2],
    "SpaceSub ASSO-400 Harpoon Gun",
    "M240 Incinerator Unit",
    ["ARMAT M40 HEDP Grenade", 4],
    "Mechanical Cutting Torch*",
  ],
  mos: {
    "AFV Marine": ["Armat M41A Pulse Rifle", "Electronic Tools"],
    "Assault Marine (Breacher)": [
      "Armat M41A Pulse Rifle",
      "M230 Baton Rounds",
      "Stun Baton",
      "M5A3 RPG Launcher",
      "Armat CM4 Plastisteel Riot Shield",
    ],
    "Automatic Rifleman (Smartgunner)": ["M56 Smart Gun", "Head-mounted Sight"],
    "Comtech Marine": ["Armat M41A Pulse Rifle", "Electronic Tools", "Seegson System Diagnostic Device"],
    "CBRN Specialist": [
      "Armat M41A Pulse Rifle",
      { oneOf: ["U4 QTC Firebomb Ammunition", "M240 Incinerator Unit"] },
      "CBRN Detection Kit",
      "UDEP Ultra Diffusive Environmental Poncho",
      "Military Grade HAZMAT Suit",
    ],
    "Hospital Corpsman": ["Armat M41A Pulse Rifle", "Surgical Kit*", ["Naproleve", 5], ["Neversleep Pills", 10]],
    "Forward Observer": [
      "Armat M41A Pulse Rifle",
      "F3S Full Spectrum Spotter Scope",
      "Parameter Uplink Spectograph Mapping Device",
      "Ghillie Suit",
    ],
    Rifleman: ["Armat M41A Pulse Rifle", "M314 Motion Tracker"],
  },
  nco: ["Armat M41A Pulse Rifle", "Binoculars"],
};
/**
 * The kinds of character the builder makes. An artificial womb soldier is a character like any
 * other to the system, marked as one on the module's flags: always a marine, with their own limits
 * on attributes and one talent to start with.
 */
export const KINDS = ["human", "womb"];
const WOMB_TALENT = "Overkill";

/** Whether a career is a marine's, by its name. The MOSs don't all say "marine". */
export function isMarineCareer(name) {
  return /marine/i.test(name) || [...MARINE_MOS, "Dropship Crew Chief"].some((mos) => sameName(mos, name));
}

/** The highest any of a character's scores may ever be, which a field event may not take it past. */
function scoreCap(state, kind, key) {
  if (kind === "attributes" && state.kind === "womb") return RULES.wombAttributeMax[key] ?? RULES.scoreMax;
  return RULES.scoreMax;
}

/** An artificial womb soldier's origin and reason for joining, which are the same for them all. */
const wombOrigin = () => ({
  fixed: true,
  roll: null,
  supernation: loc("ALTSHEET.Builder.Womb.Supernation"),
  detail: loc("ALTSHEET.Builder.Womb.Detail"),
  subAffiliation: loc("ALTSHEET.Builder.Womb.SubAffiliation"),
  home: loc("ALTSHEET.Builder.Womb.Home"),
});
const wombJoining = () => ({ fixed: true, id: "womb", name: loc("ALTSHEET.Builder.Womb.Joining"), text: "", roll: null });

/** The Officer talents a unit commander, as an NCO, may start with one of instead of their MOS's. */
const OFFICER_TALENTS = ["Field Commander", "Frontline Leader", "Pull Rank"];
/** The skills every marine is trained in, whatever their MOS. */
const MARINE_SKILLS = ["closeCbt", "stamina", "rangedCbt"];
/**
 * The Military Occupational Specialties a marine on the life path chooses from, by the name of
 * their Career item and in the order they are offered. An MOS is the marine's career.
 */
export const MARINE_MOS = [
  "Assault Marine (Breacher)",
  "Automatic Rifleman (Smartgunner)",
  "Comtech Marine",
  "CBRN Specialist",
  "Dedicated Marksman",
  "Hospital Corpsman",
  "Forward Observer",
  "Rifleman",
];
/** The parts of an origin, by the name the tables give the result that carries each. */
const ORIGIN_PARTS = { SUPERNATION: "supernation", "SUB-AFFILIATION": "subAffiliation", HOME: "home" };

/**
 * Every step the builder knows, in order. Each says whether what has been chosen so far completes
 * it, and may name the one creation method it belongs to: "book" spends the rulebook's points and
 * nothing more, "lifepath" (the Colonial Marine life path) asks its own questions as well. A new
 * life path question is another entry here and another block in the template.
 */
const STEPS = [
  // An android is only ever built by the book, and isn't a kind of human.
  { id: "method", human: true, done: (state) => !!state.method },
  { id: "kind", human: true, done: (state) => !!state.kind },
  // The commander's rank is fixed; anyone else has one to pick.
  { id: "commander", method: "lifepath", done: (state) => state.commander === "yes" || (state.commander === "no" && !!state.rank) },
  { id: "origin", method: "lifepath", done: (state) => !!state.origin },
  // An artificial womb soldier's origin, early life but for what they experienced, and reason for
  // joining are the same for them all, so those steps only show them.
  // An early life that offers a choice of skills isn't settled until one is picked.
  { id: "earlyLife", method: "lifepath", done: (state) => !!state.earlyLife && (!state.earlyLife.skills.length || !!state.earlyLife.skill) },
  { id: "joining", method: "lifepath", done: (state) => !!state.joining },
  { id: "career", done: (state) => !!state.career },
  // An android has its bonus to place as well as its points.
  {
    id: "attributes",
    done: (state) =>
      spent(state.attributes) === RULES.attributePoints && (!state.synthetic || state.android.length === RULES.androidBonusCount),
  },
  { id: "skills", done: (state) => spent(state.skills) === RULES.skillPoints },
  { id: "talent", done: (state) => !!state.talent },
  // A field event that offers a choice isn't settled until one is picked, and none may take a score too high.
  {
    id: "fieldEvent",
    method: "lifepath",
    done: (state) =>
      fieldEventsFor(state).every(({ id }) => {
        const event = state.fieldEvents[id];
        return !!event && (!event.gains.length || !!event.pick) && !fieldEventOver(state, id, event.pick);
      }),
  },
  // An agenda is the player's to pick, roll, write or leave for later.
  { id: "agenda", done: () => true },
  // One pick from each bonus list, and from any choice the MOS's gear leaves open.
  {
    id: "gear",
    method: "lifepath",
    done: (state) => !!state.gearA && !!state.gearB && (!mosGearChoice(state) || !!state.gearMos),
  },
  // Nor does a signature item have to be settled here.
  // By the book, a career gives two things from its own list of gear: nothing to pick if the
  // rulebook's page for the career isn't in the world to read the list from.
  {
    id: "kit",
    method: "book",
    done: (state) => state.kit.length === Math.min(RULES.kitPicks, kitFor(state)?.gear.length ?? 0),
  },
  { id: "signature", done: () => true },
  // And cash to roll for, likewise.
  { id: "cash", method: "book", done: (state) => !kitFor(state)?.cash || cashFor(state) !== null },
  { id: "review", done: () => true },
  // Nothing to answer: it says what is left to fill in on the sheet, and is where the life path applies.
  { id: "finish", method: "lifepath", done: () => true },
];

/** The steps the chosen creation method walks through. */
const stepsFor = (state) =>
  STEPS.filter((step) => (!step.method || step.method === state.method) && !(step.human && state.synthetic));

const loc = (key) => game.i18n.localize(key);
const fmt = (key, data) => game.i18n.format(key, data);
const spent = (scores) => Object.values(scores).reduce((sum, value) => sum + value, 0);
const plain = (html) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/* -------------------------------------------- */
/*  Careers                                     */
/* -------------------------------------------- */

/**
 * Talents the Colonial Marines manual names that the Evolved rules renamed, by the manual's name
 * in lower case.
 */
const RENAMED_TALENTS = { "field surgeon": "Field Medic", "past the limit": "True Grit" };

/** The name a talent goes by now, for one a career names. */
/**
 * Talents the Colonial Marines manual names that aren't carried over to the Evolved rules, in lower
 * case: a career that lists one doesn't offer it.
 */
const DROPPED_TALENTS = ["nerves of steel"];

const talentName = (name) => RENAMED_TALENTS[name.trim().toLowerCase()] ?? name.trim();

/** Look up an attribute or skill key by the name the rulebook prints for it. */
function keyByLabel(labels, name) {
  return Object.keys(labels).find((key) => sameName(labels[key], name));
}

/**
 * What a Career/Specialty item means for character creation, or null if the builder can't tell.
 * Items from the Colonial Marines manual spell it out at the end of their description; the core
 * careers are looked up by name.
 * @param {Item} item
 * @returns {{id: string, name: string, img: string, group: string, core: boolean, attribute: string,
 *   skills: string[], talents: string[]}|null}
 */
export function careerDefinition(item) {
  const cfg = CONFIG.ALIENRPG;
  const attributeLabels = Object.fromEntries(ATTRIBUTES.map((key) => [key, loc(cfg.attributes[key])]));
  const skillLabels = Object.fromEntries(Object.entries(cfg.skills).map(([key, skill]) => [key, loc(skill.name)]));
  const base = { id: item.id, name: item.name, img: item.img, group: item.folder?.name ?? "" };

  const text = plain(item.system.general?.comment?.value);
  const written = text.match(/KEY ATTRIBUTE:\s*(.+?)\s*SKILLS:\s*(.+?)\s*TALENTS:\s*(.+)$/i);
  if (written) {
    const attribute = keyByLabel(attributeLabels, written[1]);
    const skills = written[2].split(",").map((name) => keyByLabel(skillLabels, name)).filter(Boolean);
    const talents = written[3]
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name && !DROPPED_TALENTS.includes(name.toLowerCase()))
      .map(talentName);
    if (attribute && skills.length) return { ...base, core: false, attribute, skills, talents };
  }

  const core = CORE_CAREERS[item.name.trim().toLowerCase()];
  if (core) return { ...base, core: true, attribute: core[0], skills: core[1], talents: core[2] };
  return null;
}

/** The world's Talent item for a talent a career names, e.g. "Weapon Specialist (M5 RPG)". */
function findTalent(name) {
  const talents = game.items.filter((item) => item.type === "talent");
  return (
    talents.find((item) => sameName(item.name, name)) ??
    talents.find((item) => sameName(item.name, name.replace(/\s*\(.*\)\s*$/, "")))
  );
}

/**
 * A career's description, ready to enrich. The manuals' descriptions open with an empty paragraph,
 * which is only blank lines in the builder, and link their talents to compendiums that may not be
 * installed: those links are pointed at the world's Talent items instead, so they open.
 */
function careerDescription(item) {
  return (item?.system.general.comment.value ?? "")
    .replace(/^(\s*<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>)+/i, "")
    .replace(/<a\b[^>]*\bclass="entity-link"[^>]*>(.*?)<\/a>/gis, (link, label) => {
      const name = talentName(plain(label));
      // One that isn't carried over stays in the list, struck out, since the career's own text names it.
      if (DROPPED_TALENTS.includes(name.toLowerCase())) return `<s>${name}</s>`;
      const talent = findTalent(name);
      return talent ? `@UUID[${talent.uuid}]{${name}}` : name;
    });
}

/* -------------------------------------------- */
/*  Life path                                   */
/* -------------------------------------------- */

/**
 * Roll a marine's origin on the life path tables: a supernation, and from that supernation's own
 * tables a sub-affiliation and a home.
 * @returns {Promise<{roll: number, supernation: string, detail: string, subAffiliation: string,
 *   home: string}|null>}  Null if the tables aren't there to roll on.
 */
/**
 * Draw from one of the life path tables and the tables it draws from in turn. The draw is shown in
 * chat, as a roll at the table would be.
 * @param {string} name  The table's name in the life path pack
 * @returns {Promise<{roll: Roll, results: TableResult[]}|null>}  Null if the table isn't there.
 */
async function drawLifePath(name) {
  const table = await lifePathTable(name);
  return table ? table.draw({ recursive: true }) : null;
}

/** One of the life path tables, by its name in the life path pack, or null if it isn't there. */
async function lifePathTable(name) {
  const pack = game.packs.get(LIFE_PATH_PACK);
  const entry = pack?.index.find((table) => table.name === name);
  // A table of the world's own stands in for one the pack lacks.
  return entry ? pack.getDocument(entry._id) : (game.tables.getName(name) ?? null);
}

/**
 * The reasons for joining the Marines, as the table lists them: a marine picks one or rolls for it.
 * @returns {Promise<{id: string, name: string, text: string}[]>}  Empty if the table isn't there.
 */
async function joiningReasons() {
  const table = await lifePathTable(JOINING_TABLE);
  if (!table) return [];
  return table.results.contents
    .sort((a, b) => a.range[0] - b.range[0])
    .map((result) => ({ id: result.id, name: result.name?.trim() ?? "", text: plain(result.description) }));
}

async function rollOrigin() {
  const draw = await drawLifePath(ORIGIN_TABLE);
  if (!draw) return null;
  const origin = { roll: draw.roll.total, supernation: "", detail: "", subAffiliation: "", home: "" };
  for (const result of draw.results) {
    const part = ORIGIN_PARTS[result.name?.trim().toUpperCase()];
    if (!part) continue;
    // A supernation's result is its name and then a line about being born there.
    const [value, ...rest] = (result.description ?? "").split(/<\/p>/i).map(plain).filter(Boolean);
    origin[part] = value ?? "";
    if (part === "supernation") origin.detail = rest.join(" ");
  }
  return origin;
}

/** The skills a life path result gives a point in, as their keys: more than one is a choice. */
function skillsGranted(text) {
  return Object.entries(CONFIG.ALIENRPG.skills)
    .filter(([, skill]) => text.toLowerCase().includes(`+1 ${loc(skill.name).toLowerCase()}`))
    .map(([key]) => key);
}

/**
 * Roll a marine's early life: what they were as a youth, in whose company, and what they
 * experienced, which gives a point in a skill or a choice of skills to put one in.
 * @returns {Promise<{parts: {label: string, text: string}[], story: string, skills: string[],
 *   skill: string|null}|null>}  Null if the tables aren't there to roll on.
 */
async function rollEarlyLife() {
  const draw = await drawLifePath(EARLY_LIFE_TABLE);
  if (!draw) return null;
  return earlyLifeFrom(draw.results.map((result) => ({ label: result.name?.trim() ?? "", text: plain(result.description) })));
}

/**
 * An artificial womb soldier's early life: what they were and in whose company is the same for
 * them all, and only what they experienced is rolled, on a table of their own.
 * @returns {Promise<ReturnType<typeof earlyLifeFrom> & {missing: boolean}>}  Missing says the
 *   table isn't there, so nothing was experienced.
 */
async function rollWombEarlyLife() {
  const parts = [
    { label: loc("ALTSHEET.Builder.Womb.YouthLabel"), text: loc("ALTSHEET.Builder.Womb.Youth") },
    { label: loc("ALTSHEET.Builder.Womb.CompanyLabel"), text: loc("ALTSHEET.Builder.Womb.Company") },
  ];
  const draw = await drawLifePath(WOMB_EXPERIENCE_TABLE);
  for (const result of draw?.results ?? []) {
    parts.push({ label: loc("ALTSHEET.Builder.Womb.ExperiencedLabel"), text: plain(result.description) });
  }
  // Their story is told in their own words, as the table's results are written.
  const experienced = parts.slice(2).map((part) => `${withoutSkill(part.text)}.`);
  const story = [loc("ALTSHEET.Builder.Womb.Story"), ...experienced].join(" ");
  return { ...earlyLifeFrom(parts), story, womb: true, missing: !draw };
}

/** A life path result's text without the skill it gives on the end, unless that is worded into a sentence. */
function withoutSkill(text) {
  const before = text.match(/^([^+]*?)\s*\+1 [A-Z ]+?(?: or \+1 [A-Z ]+?)*$/)?.[1] ?? text;
  return before.replace(/[\s.]+$/, "");
}

/** An early life from its parts: the story they tell, and the skill or choice of skills they give. */
function earlyLifeFrom(parts) {
  const skills = [...new Set(parts.flatMap((part) => skillsGranted(part.text)))];
  const told = parts.map(({ label, text }) => {
    const body = withoutSkill(text);
    return `${label.toLowerCase()} ${body.charAt(0).toLowerCase()}${body.slice(1)}`;
  });
  const story = told.join(", ");
  return {
    parts,
    story: `${story.charAt(0).toUpperCase()}${story.slice(1)}.`,
    skills,
    skill: skills.length === 1 ? skills[0] : null,
  };
}

/** One piece of starting gear, from its entry in the gear lists: a name, or a name and how many. */
function gearEntry(entry) {
  const [name, quantity] = Array.isArray(entry) ? entry : [entry, 1];
  const item = game.items.find((candidate) => !["specialty", "talent", "agenda"].includes(candidate.type) && sameName(candidate.name, name));
  return {
    name,
    quantity,
    item,
    uuid: item?.uuid,
    img: item?.img ?? "icons/svg/item-bag.svg",
    // What the item says about itself, to read on hover.
    description: plain(item?.system.attributes?.comment?.value) ? item.system.attributes.comment.value : "",
    label: quantity > 1 ? `${quantity} × ${name}` : name,
  };
}

/** The gear a marine's MOS gives them, as its entries in the gear lists. */
const mosGear = (state) => MARINE_GEAR.mos[game.items.get(state.career)?.name.trim()] ?? [];

/** The gear an NCO gets besides their MOS's: only the unit commander is one. */
const ncoGear = (state) => (state.commander === "yes" ? MARINE_GEAR.nco : []);

/** The names an MOS's gear leaves the marine to pick one of, or null if it leaves no choice. */
const mosGearChoice = (state) => mosGear(state).find((entry) => entry.oneOf)?.oneOf ?? null;

/**
 * All the gear a marine starts with: the basic gear, their two bonus picks and their MOS's.
 * The same thing from two lists is one entry, of both amounts.
 * @returns {ReturnType<typeof gearEntry>[]}
 */
function startingGear(state) {
  const entries = [
    ...MARINE_GEAR.basic,
    ...[...MARINE_GEAR.listA, ...MARINE_GEAR.listB].filter((entry) => [state.gearA, state.gearB].includes(gearEntry(entry).name)),
    ...mosGear(state).map((entry) => (entry.oneOf ? state.gearMos : entry)).filter(Boolean),
  ].map(gearEntry);
  const gear = [];
  for (const entry of entries) {
    const held = gear.find((other) => sameName(other.name, entry.name));
    if (!held) gear.push(entry);
    // Armor isn't counted, so a second suit of it is nothing more.
    else if (entry.item?.type !== "armor") Object.assign(held, gearEntry([held.name, held.quantity + entry.quantity]));
  }
  for (const entry of ncoGear(state).map(gearEntry)) {
    if (!gear.some((other) => sameName(other.name, entry.name))) gear.push(entry);
  }
  return gear;
}

/**
 * What the rulebook gives each of its careers to start with: gear to pick from, cash to roll for,
 * and examples of a personal agenda and a signature item. None of it is written into this module;
 * it is read from the rulebook's own page in the world's Journal, which lays each career out under
 * a heading of its name. Cleared when a builder opens, so a journal imported since is found.
 * @type {Map<string, {cash: number, gear: string[], agenda: string[], signature: string[]}|null>}
 */
const careerKits = new Map();

function careerKit(name) {
  const key = name?.trim().toLowerCase();
  if (!key) return null;
  if (careerKits.has(key)) return careerKits.get(key);
  let kit = null;
  for (const page of game.journal.contents.flatMap((entry) => entry.pages.contents)) {
    const html = page.text?.content;
    if (!html?.includes("evchapterheading")) continue;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const heading = [...doc.querySelectorAll("h2.evchapterheading")].find((h2) => sameName(h2.textContent, name));
    const block = heading?.closest("div");
    if (!block) continue;
    // Each list sits in the cell under its heading's.
    const lists = {};
    for (const title of block.querySelectorAll("p.evheading")) {
      const cell = title.closest("td");
      const under = cell?.parentElement.nextElementSibling?.cells[cell.cellIndex];
      lists[title.textContent.trim().toUpperCase()] = [...(under?.querySelectorAll("li") ?? [])].map((li) => plain(li.innerHTML));
    }
    const cash = plain(block.innerHTML).match(/Cash:\s*D6\s*[\u00d7x]\s*([\d,]+)/i)?.[1];
    kit = {
      cash: cash ? Number(cash.replace(/,/g, "")) : 0,
      gear: lists.GEAR ?? [],
      agenda: lists["PERSONAL AGENDA"] ?? [],
      signature: lists["SIGNATURE ITEM"] ?? [],
    };
    break;
  }
  careerKits.set(key, kit);
  return kit;
}

/** What the rulebook gives the career chosen, when building by the book. */
const kitFor = (state) => (state.method === "book" ? careerKit(game.items.get(state.career)?.name) : null);

/**
 * The cash a character built by the book starts with, or null until it is rolled for. The roll is
 * made once and kept, so it is the die that is remembered: a change of career changes what it is worth.
 */
const cashFor = (state) => (state.method === "book" && state.cash !== null && kitFor(state)?.cash ? state.cash * kitFor(state).cash : null);

const NUMBER_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6 };

/**
 * One thing on a career's list of gear, as the rulebook words it: "Two G2 Electroshock Grenades" is
 * two of them, "D6 doses Naproleve" a roll's worth. The rulebook's name for a thing isn't always
 * its item's, so the world's item is the closest by name.
 */
function kitEntry(text) {
  let name = text;
  let quantity = 1;
  let dice = "";
  const counted = text.match(/^(two|three|four|five|six|\d+)\s+(.+)$/i);
  const doses = text.match(/^(D\d+)\s+doses\s+(?:of\s+)?(.+)$/i);
  if (doses) [, dice, name] = doses;
  else if (counted) [quantity, name] = [NUMBER_WORDS[counted[1].toLowerCase()] ?? Number(counted[1]), counted[2]];
  const norm = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/s$/, "");
  const wanted = norm(name);
  const item = game.items
    .filter((candidate) => ["item", "weapon", "armor"].includes(candidate.type))
    .map((candidate) => ({ candidate, held: norm(candidate.name) }))
    .filter(({ held }) => held === wanted || (wanted.length > 4 && held.includes(wanted)) || (held.length > 4 && wanted.includes(held)))
    .sort((a, b) => Math.abs(a.held.length - wanted.length) - Math.abs(b.held.length - wanted.length))[0]?.candidate;
  return {
    name: item?.name ?? name,
    quantity,
    dice: dice ? `1${dice.toLowerCase()}` : "",
    item,
    uuid: item?.uuid,
    img: item?.img ?? "icons/svg/item-bag.svg",
    description: plain(item?.system.attributes?.comment?.value) ? item.system.attributes.comment.value : "",
    label: text,
  };
}

/**
 * The questions answered in the player's own words, each with a list of examples to
 * pick from or roll for: the step's id, the language file's section holding its examples, and the
 * label of the character's field it fills.
 */
const WRITTEN = {
  agenda: { section: "Agenda", label: "ALIENRPG.PersonalAgenda", icon: "fa-solid fa-bullseye" },
  signature: { section: "Signature", label: "ALIENRPG.SignatureItem", icon: "fa-solid fa-heart" },
};

/**
 * The examples a marine may pick from or roll for, for their personal agenda or signature item:
 * the list in the language file, which is where to edit it.
 * @param {keyof WRITTEN} field
 * @returns {string[]}
 */
function writtenExamples(field, state) {
  // By the book they are the career's own, from the rulebook's page.
  if (state.method === "book") return kitFor(state)?.[field] ?? [];
  const key = `ALTSHEET.Builder.${WRITTEN[field].section}.Examples`;
  const list = foundry.utils.getProperty(game.i18n.translations, key) ?? foundry.utils.getProperty(game.i18n._fallback, key);
  return Object.values(list ?? {}).filter((entry) => typeof entry === "string");
}

/** The field event tables a marine rolls on: the NCO's only for the unit commander. */
const fieldEventsFor = (state) => FIELD_EVENT_TABLES.filter((entry) => !entry.nco || state.commander === "yes");

/**
 * Roll a field event: something from earlier in a marine's career, which may give a point in a
 * skill or an attribute (or a choice of what to gain) or a talent. Anything else it gives, such as
 * gear, is in its text for the player to note.
 * @param {string} table  The event table's name in the life path pack
 * @returns {Promise<{roll: number, html: string, text: string, gains: {id: string, kind: string,
 *   key: string, label: string}[], pick: string|null, talents: string[]}|null>}  Null if the table
 *   isn't there to roll on.
 */
async function rollFieldEvent(table) {
  const draw = await drawLifePath(table);
  const result = draw?.results[0];
  if (!result) return null;
  const cfg = CONFIG.ALIENRPG;
  const html = result.description ?? "";
  const text = plain(html);
  const lower = text.toLowerCase();
  const attributes = ATTRIBUTES.filter((key) => lower.includes(`+1 ${loc(cfg.attributes[key]).toLowerCase()}`));
  const gains = [
    ...skillsGranted(text).map((key) => ({ id: `skills:${key}`, kind: "skills", key, label: loc(cfg.skills[key].name) })),
    ...attributes.map((key) => ({ id: `attributes:${key}`, kind: "attributes", key, label: loc(cfg.attributes[key]) })),
  ];
  // An alternative that is neither a skill nor an attribute is still a choice, for the player to note.
  for (const [, name] of text.matchAll(/\bor \+1 ([^.(+]+?)(?=\s*(?:\(|\.|$|\bor \+1))/gi)) {
    if (gains.some((gain) => sameName(gain.label, name))) continue;
    gains.push({ id: `other:${gains.length}`, kind: "other", key: "", label: name.trim() });
  }
  const talents = [...html.matchAll(/<(?:strong|b)>\s*([^<]+?)\s*<\/(?:strong|b)>\s*talent/gi)]
    .map(([, name]) => talentName(name))
    .filter((name) => !DROPPED_TALENTS.includes(name.toLowerCase()));
  return { roll: draw.roll.total, html, text, gains, pick: gains.length === 1 ? gains[0].id : null, talents };
}

/** The skill the life path's early life gives a point in, over and above the points spent, or null. */
const earlyLifeSkill = (state) => (state.method === "lifepath" ? (state.earlyLife?.skill ?? null) : null);

/**
 * What a marine's field events add to their scores, by kind and key.
 * @param {object} state  The builder's choices
 * @param {string} [except]  A field event to leave out
 */
function fieldEventGains(state, except) {
  const gains = { attributes: {}, skills: {} };
  if (state.method !== "lifepath") return gains;
  for (const { id } of fieldEventsFor(state)) {
    const event = state.fieldEvents[id];
    const gain = id !== except && event?.gains.find((entry) => entry.id === event.pick);
    if (gain && gain.kind !== "other") gains[gain.kind][gain.key] = (gains[gain.kind][gain.key] ?? 0) + 1;
  }
  return gains;
}

/** Whether taking one of a field event's gains would put its score above the highest any may be. */
function fieldEventOver(state, id, pick) {
  const gain = state.fieldEvents[id]?.gains.find((entry) => entry.id === pick);
  if (!gain || gain.kind === "other") return false;
  const others = fieldEventGains(state, id)[gain.kind][gain.key] ?? 0;
  const early = gain.kind === "skills" && gain.key === earlyLifeSkill(state) ? 1 : 0;
  return state[gain.kind][gain.key] + early + others + 1 > scoreCap(state, gain.kind, gain.key);
}

/* -------------------------------------------- */
/*  Application                                 */
/* -------------------------------------------- */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Walks a player through creating a character: career, attributes, skills and a talent, with a
 * life path's questions first for those who choose one, then writes the result to the actor in one
 * go. Nothing on the actor changes until Apply.
 */
export class CharacterBuilder extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["alien-alt-sheet", "aas-builder"],
    tag: "div",
    position: { width: 640, height: 680 },
    window: { resizable: true, icon: "fa-solid fa-wand-magic-sparkles" },
    actions: {
      goTo: CharacterBuilder.#onGoTo,
      next: CharacterBuilder.#onNext,
      back: CharacterBuilder.#onBack,
      pick: CharacterBuilder.#onPick,
      rollOrigin: CharacterBuilder.#onRollOrigin,
      rollEarlyLife: CharacterBuilder.#onRollEarlyLife,
      rollJoining: CharacterBuilder.#onRollJoining,
      rollFieldEvent: CharacterBuilder.#onRollFieldEvent,
      rollWritten: CharacterBuilder.#onRollWritten,
      rollKit: CharacterBuilder.#onRollKit,
      rollCash: CharacterBuilder.#onRollCash,
      pickCareer: CharacterBuilder.#onPickCareer,
      pickTalent: CharacterBuilder.#onPickTalent,
      adjust: CharacterBuilder.#onAdjust,
      apply: CharacterBuilder.#onApply,
    },
  };

  static PARTS = {
    body: { template: TEMPLATE, scrollable: [".aas-builder-body"] },
  };

  /**
   * @param {object} options
   * @param {Actor} options.actor  The character to build
   */
  constructor(options) {
    super({ ...options, id: `${MODULE_ID}-builder-${options.actor.id}` });
    this.actor = options.actor;
    const synthetic = options.actor.type === "synthetic";
    careerKits.clear();
    /**
     * What has been chosen so far. Synthetic says the character is an android, which is built by
     * the book and then adds a bonus to the attributes listed in android. The method is "book" or "lifepath"; the kind is one of KINDS; commander is "yes" or "no";
     * rank is the one a marine who isn't the commander picked; origin and earlyLife are what was
     * rolled for them; joining is why they joined the Marines, picked or rolled; a career is the
     * id of its Career item; a talent is its name; fieldEvents are the events rolled, by the id
     * of the table each was rolled on; agenda is the personal agenda picked, rolled or written;
     * signature is their signature item, likewise; kit is the gear picked from the career's
     * list by the book, as it is worded there, and cash the die rolled for their cash;
     * gearA, gearB and gearMos are the names of the gear picked from the two bonus lists and from
     * any choice the MOS's gear leaves.
     */
    this.choices = {
      synthetic,
      method: synthetic ? "book" : null,
      kind: !synthetic && KINDS.includes(options.actor.getFlag(MODULE_ID, "kind")) ? options.actor.getFlag(MODULE_ID, "kind") : "human",
      android: [],
      commander: null,
      rank: null,
      origin: null,
      earlyLife: null,
      joining: null,
      career: null,
      attributes: Object.fromEntries(ATTRIBUTES.map((key) => [key, RULES.attributeMin])),
      skills: Object.fromEntries(Object.keys(CONFIG.ALIENRPG.skills).map((key) => [key, 0])),
      talent: null,
      fieldEvents: {},
      agenda: "",
      signature: "",
      kit: [],
      cash: null,
      gearA: null,
      gearB: null,
      gearMos: null,
    };
    this.step = stepsFor(this.choices)[0].id;
  }

  get title() {
    return fmt("ALTSHEET.Builder.Title", { name: this.actor.name });
  }

  /**
   * Every career the builder understands: the rulebook's first, then by folder and name. On the
   * life path they are the marine's MOSs and nothing else, in one list.
   */
  get careers() {
    const careers = game.items
      .filter((item) => item.type === "specialty")
      .map(careerDefinition)
      .filter(Boolean)
      // An artificial womb soldier is a marine and nothing else.
      .filter((career) => this.choices.kind !== "womb" || isMarineCareer(career.name));
    if (this.choices.method === "lifepath") {
      const place = (career) => MARINE_MOS.findIndex((name) => sameName(name, career.name));
      return careers
        .filter((career) => place(career) >= 0)
        .sort((a, b) => place(a) - place(b))
        .map((career) => ({ ...career, group: "" }));
    }
    return careers.sort((a, b) => b.core - a.core || a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  }

  get career() {
    return this.careers.find((career) => career.id === this.choices.career) ?? null;
  }

  /** The highest a score may be, which depends on the career chosen and the creation method. */
  #limit(kind, key) {
    const career = this.career;
    if (kind === "attributes") {
      const womb = this.choices.kind === "womb" ? RULES.wombAttributeMax[key] : undefined;
      return womb ?? (career?.attribute === key ? RULES.keyAttributeMax : RULES.attributeMax);
    }
    const lifePath = this.choices.method === "lifepath";
    if (career?.skills.includes(key)) return lifePath ? RULES.mosSkillMax : RULES.keySkillMax;
    return lifePath && MARINE_SKILLS.includes(key) ? RULES.marineSkillMax : RULES.skillMax;
  }

  /** The most points that may be spent on a score: the life path's own point counts toward its limit. */
  #max(kind, key) {
    return this.#limit(kind, key) - (kind === "skills" && key === this.#bonusSkill ? 1 : 0);
  }

  /**
   * The fewest points that may be spent on a score. On the life path a marine starts with something
   * in each skill they are trained in, which the life path's own point counts toward.
   */
  #min(kind, key) {
    if (kind === "attributes") return RULES.attributeMin;
    const trained = MARINE_SKILLS.includes(key) || this.career?.skills.includes(key);
    if (this.choices.method !== "lifepath" || !trained) return 0;
    return Math.max(0, RULES.trainedSkillMin - (key === this.#bonusSkill ? 1 : 0));
  }

  /** How far through the steps the choices so far allow: the first one not yet complete. */
  get #reach() {
    const steps = this.#steps;
    const index = steps.findIndex((step) => !step.done(this.choices));
    return index < 0 ? steps.length - 1 : index;
  }

  get #steps() {
    return stepsFor(this.choices);
  }

  async _prepareContext() {
    const cfg = CONFIG.ALIENRPG;
    const state = this.choices;
    const career = this.career;
    const steps = this.#steps;
    const index = steps.findIndex((step) => step.id === this.step);
    const reach = this.#reach;
    const attributeLabel = (key) => loc(cfg.attributes[key]);
    const skillLabel = (key) => loc(cfg.skills[key].name);

    const bonusSkill = this.#bonusSkill;
    const scoreRow = (kind, key, label, isKey, left) => {
      const bonus = kind === "skills" && key === bonusSkill;
      const android = kind === "attributes" && state.android.includes(key) ? RULES.androidBonus : 0;
      const paid = state[kind][key];
      // The score shown includes the life path's point, which isn't one of the points spent.
      const value = paid + (bonus ? 1 : 0) + android;
      const max = this.#limit(kind, key) + android;
      return {
        key,
        kind,
        label,
        value,
        max,
        isKey,
        android,
        isMarine: kind === "skills" && !isKey && state.method === "lifepath" && MARINE_SKILLS.includes(key),
        bonus,
        pips: Array.from({ length: max }, (_, i) => ({ filled: i < value })),
        canLower: paid > this.#min(kind, key),
        canRaise: value < max && left > 0,
      };
    };
    const attributesLeft = RULES.attributePoints - spent(state.attributes);
    const skillsLeft = RULES.skillPoints - spent(state.skills);

    const groups = [];
    for (const entry of this.careers) {
      let group = groups.find((g) => g.name === entry.group);
      if (!group) groups.push((group = { name: entry.group, careers: [] }));
      group.careers.push({
        ...entry,
        selected: entry.id === state.career,
        attributeLabel: attributeLabel(entry.attribute),
        skillLabels: entry.skills.map(skillLabel).join(", "),
      });
    }

    const eventGains = fieldEventGains(state);
    const fieldEvents = state.method !== "lifepath" ? [] : fieldEventsFor(state).map(({ id, nco }, i) => {
      const event = state.fieldEvents[id];
      const options = (event?.gains ?? []).map((gain) => ({
        id: `${id}/${gain.id}`,
        icon: "fa-solid fa-plus",
        label: `+1 ${gain.label}`,
        selected: event.pick === gain.id,
        disabled: fieldEventOver(state, id, gain.id),
      }));
      return {
        id,
        first: i === 0,
        title: loc(`ALTSHEET.Builder.FieldEvent.${nco ? "NcoTitle" : "Title"}`),
        event,
        gained: options.length === 1 ? options[0].label : "",
        options: options.length > 1 && options,
        // An event that can only take a score too high has to be rolled again.
        over: options.length > 0 && options.every((option) => option.disabled),
        talents: (event?.talents ?? []).map((name) => ({ name, missing: !findTalent(name) })),
      };
    });

    const offered = (names) =>
      Promise.all(
        names.map(async (name) => {
          const item = findTalent(name);
          return {
            name,
            img: item?.img ?? "icons/svg/item-bag.svg",
            missing: !item,
            selected: name === state.talent,
            description: item
              ? await foundry.applications.ux.TextEditor.enrichHTML(item.system.general.comment.value ?? "", { relativeTo: item })
              : "",
          };
        }),
      );
    const talents = await offered(this.#careerTalents);
    const officerTalents = await offered(this.#officerTalents);

    // A marine's career is their MOS.
    const stepLabel = (id) => loc(`ALTSHEET.Builder.Steps.${id === "career" && state.method === "lifepath" ? "mos" : id}`);

    return {
      step: this.step,
      steps: steps.map((step, i) => ({
        id: step.id,
        number: i + 1,
        label: stepLabel(step.id),
        active: step.id === this.step,
        done: i < reach,
        enabled: i <= reach,
      })),
      current: { number: index + 1, label: stepLabel(this.step), next: steps[index + 1] ? stepLabel(steps[index + 1].id) : "" },
      isFirst: index === 0,
      isLast: index === steps.length - 1,
      canNext: index < reach,
      rules: { ...RULES, keySkillMax: state.method === "lifepath" ? RULES.mosSkillMax : RULES.keySkillMax },
      bonusSkill: bonusSkill && skillLabel(bonusSkill),
      marineSkills: MARINE_SKILLS.map(skillLabel).join(", "),
      isLifePath: state.method === "lifepath",
      isWomb: state.kind === "womb",
      isSynthetic: state.synthetic,
      android: state.synthetic && {
        left: RULES.androidBonusCount - state.android.length,
        options: ATTRIBUTES.map((key) => ({
          id: key,
          icon: "fa-solid fa-microchip",
          label: `+${RULES.androidBonus} ${attributeLabel(key)}`,
          selected: state.android.includes(key),
          disabled: !state.android.includes(key) && state.android.length >= RULES.androidBonusCount,
        })),
      },
      wombMax: {
        str: RULES.wombAttributeMax.str,
        other: RULES.wombAttributeMax.wit,
        strLabel: attributeLabel("str"),
        otherLabels: `${attributeLabel("wit")} and ${attributeLabel("emp")}`,
        talent: WOMB_TALENT,
      },
      kinds: KINDS.map((id) => ({
        id,
        icon: id === "womb" ? "fa-solid fa-dna" : "fa-solid fa-person",
        label: loc(`ALTSHEET.Kind.${id}`),
        hint: fmt(`ALTSHEET.Builder.Kind.${id}`, { str: RULES.wombAttributeMax.str, other: RULES.wombAttributeMax.wit, talent: WOMB_TALENT }),
        selected: state.kind === id,
      })),
      methods: ["book", "lifepath"].map((id) => ({
        id,
        icon: id === "book" ? "fa-solid fa-book" : "fa-solid fa-route",
        label: loc(`ALTSHEET.Builder.Methods.${id}.Label`),
        hint: loc(`ALTSHEET.Builder.Methods.${id}.Hint`),
        selected: state.method === id,
      })),
      commander: ["yes", "no"].map((id) => ({
        id,
        icon: id === "yes" ? "fa-solid fa-star" : "fa-solid fa-user",
        label: loc(`ALTSHEET.Builder.Commander.${id}.Label`),
        hint: fmt(`ALTSHEET.Builder.Commander.${id}.Hint`, { rank: COMMANDER_RANK }),
        selected: state.commander === id,
      })),
      // Only a marine who isn't the commander picks a rank.
      ranks: state.commander === "no" && ENLISTED_RANKS.map((rank) => ({
        id: rank,
        icon: "fa-solid fa-angle-up",
        label: rank,
        selected: state.rank === rank,
      })),
      groups,
      career: career && {
        ...career,
        attributeLabel: attributeLabel(career.attribute),
        skillLabels: career.skills.map(skillLabel).join(", "),
        description: await foundry.applications.ux.TextEditor.enrichHTML(careerDescription(game.items.get(career.id))),
      },
      attributes: {
        left: attributesLeft,
        rows: ATTRIBUTES.map((key) => scoreRow("attributes", key, attributeLabel(key), career?.attribute === key, attributesLeft)),
      },
      skills: {
        left: skillsLeft,
        groups: ATTRIBUTES.map((attr) => ({
          label: attributeLabel(attr),
          rows: Object.entries(cfg.skills)
            .filter(([, skill]) => skill.attrib === attr)
            .map(([key]) => scoreRow("skills", key, skillLabel(key), !!career?.skills.includes(key), skillsLeft)),
        })),
      },
      talents,
      officerTalents,
      origin: state.origin,
      earlyLife: state.earlyLife && {
        ...state.earlyLife,
        // One skill is simply gained; several are a choice.
        gained: state.earlyLife.skills.length === 1 ? skillLabel(state.earlyLife.skills[0]) : "",
        options: state.earlyLife.skills.length > 1 && state.earlyLife.skills.map((key) => ({
          id: key,
          icon: "fa-solid fa-plus",
          label: skillLabel(key),
          selected: state.earlyLife.skill === key,
        })),
      },
      joining: {
        rolled: state.joining?.roll,
        fixed: state.joining?.fixed ? state.joining.name : "",
        reasons: (state.method === "lifepath" ? await this.#joiningReasons() : []).map((reason) => ({
          id: reason.id,
          icon: "fa-solid fa-medal",
          label: reason.name,
          hint: reason.text,
          selected: state.joining?.id === reason.id,
        })),
      },
      fieldEvents,
      gear: state.method === "lifepath" && {
        basic: MARINE_GEAR.basic.map(gearEntry),
        lists: [
          { choice: "gearA", title: loc("ALTSHEET.Builder.Gear.ListA"), options: MARINE_GEAR.listA },
          { choice: "gearB", title: loc("ALTSHEET.Builder.Gear.ListB"), options: MARINE_GEAR.listB },
        ].map((list) => ({
          ...list,
          options: list.options.map(gearEntry).map((entry) => ({ ...entry, id: entry.name, selected: state[list.choice] === entry.name })),
        })),
        mos: mosGear(state).filter((entry) => !entry.oneOf).map(gearEntry),
        mosTitle: fmt("ALTSHEET.Builder.Gear.Mos", { career: career?.name ?? "" }),
        nco: ncoGear(state).map(gearEntry),
        mosOptions: (mosGearChoice(state) ?? []).map(gearEntry).map((entry) => ({ ...entry, id: entry.name, selected: state.gearMos === entry.name })),
      },
      ...Object.fromEntries(
        Object.entries(WRITTEN).map(([field, { icon }]) => [
          field,
          {
            text: state[field],
            examples: writtenExamples(field, state).map((text, i) => ({
              id: String(i),
              icon,
              label: text,
              selected: state[field].trim() === text,
            })),
          },
        ]),
      ),
      kit: state.method === "book" && {
        found: !!kitFor(state),
        picks: RULES.kitPicks,
        left: Math.min(RULES.kitPicks, kitFor(state)?.gear.length ?? 0) - state.kit.length,
        options: (kitFor(state)?.gear ?? []).map(kitEntry).map((entry) => ({
          ...entry,
          id: entry.label,
          selected: state.kit.includes(entry.label),
          disabled: !state.kit.includes(entry.label) && state.kit.length >= RULES.kitPicks,
        })),
        cash: kitFor(state)?.cash ?? 0,
        die: state.cash,
      },
      // A field event may have handed the marine a signature item already.
      signatureEvents: fieldEvents.filter(({ event }) => /signature item/i.test(event?.text ?? "")).map(({ event }) => event.text),
      review: {
        agenda: state.agenda.trim(),
        signature: state.signature.trim(),
        kit: state.method === "book" ? state.kit.join(", ") : "",
        cash: cashFor(state) !== null ? fmt("ALTSHEET.Builder.Cash.Amount", { amount: cashFor(state) }) : "",
        gear: state.method === "lifepath" ? startingGear(state).map((entry) => entry.label).join(", ") : "",
        fieldEvents: fieldEvents.filter(({ event }) => event).map(({ title, event }) => ({ title, text: event.text })),
        rank: this.#rank,
        kind: state.kind === "human" ? "" : loc(`ALTSHEET.Kind.${state.kind}`),
        origin: state.method === "lifepath" ? state.origin : null,
        earlyLife: state.method === "lifepath" ? state.earlyLife?.story : null,
        joining: state.method === "lifepath" ? state.joining?.name : null,
        talent: state.talent,
        attributes: ATTRIBUTES.map((key) => ({
          label: attributeLabel(key),
          value: state.attributes[key] + (eventGains.attributes[key] ?? 0) + (state.android.includes(key) ? RULES.androidBonus : 0),
        })),
        skills: Object.entries(state.skills)
          .map(([key, value]) => ({
            label: skillLabel(key),
            value: value + (key === bonusSkill ? 1 : 0) + (eventGains.skills[key] ?? 0),
          }))
          .filter(({ value }) => value > 0),
        // Applying overwrites a character that already has scores, so say so first.
        replaces: ATTRIBUTES.some((key) => this.actor.system.attributes[key]?.value),
      },
    };
  }

  /** Bring scores back within the limits of a newly chosen career, and drop a talent it lacks. */
  #fitToCareer() {
    for (const kind of ["attributes", "skills"]) {
      for (const key of Object.keys(this.choices[kind])) {
        const fitted = Math.min(this.choices[kind][key], this.#max(kind, key));
        this.choices[kind][key] = Math.max(fitted, this.#min(kind, key));
      }
    }
    // Points a marine has to have in their trained skills come out of the others if there are none left.
    const { skills } = this.choices;
    while (spent(skills) > RULES.skillPoints) {
      const spare = Object.keys(skills)
        .filter((key) => skills[key] > this.#min("skills", key))
        .sort((a, b) => skills[b] - skills[a])[0];
      if (!spare) break;
      skills[spare] -= 1;
    }
    if (!mosGearChoice(this.choices)?.includes(this.choices.gearMos)) this.choices.gearMos = null;
    const kit = kitFor(this.choices);
    this.choices.kit = this.choices.kit.filter((text) => kit?.gear.includes(text));
    const talents = [...this.#careerTalents, ...this.#officerTalents];
    if (!talents.includes(this.choices.talent)) this.choices.talent = null;
    // With only one talent to start with, there is nothing to pick.
    if (this.career && talents.length === 1) this.choices.talent = talents[0];
  }

  /**
   * Give an artificial womb soldier on the life path the origin and reason for joining they all
   * share, and take them (and a womb soldier's early life) back from anyone else.
   */
  #fixLifePath() {
    const state = this.choices;
    const womb = state.method === "lifepath" && state.kind === "womb";
    if (womb) Object.assign(state, { origin: wombOrigin(), joining: wombJoining() });
    else {
      if (state.origin?.fixed) state.origin = null;
      if (state.joining?.fixed) state.joining = null;
    }
    if (!!state.earlyLife?.womb !== womb) state.earlyLife = null;
  }

  /** The talents on offer from the career: an artificial womb soldier starts with one, whatever it is. */
  get #careerTalents() {
    if (this.choices.kind === "womb") return this.career ? [WOMB_TALENT] : [];
    return this.career?.talents ?? [];
  }

  /**
   * Give back the point placed in a trained skill when the early life's point lands on it, since
   * that point is the one the skill has to start with.
   */
  #freeTrainedPoint() {
    const key = this.#bonusSkill;
    const { skills } = this.choices;
    const trained = MARINE_SKILLS.includes(key) || this.career?.skills.includes(key);
    if (key && trained && skills[key] === RULES.trainedSkillMin) skills[key] = this.#min("skills", key);
  }

  /** The Officer talents on offer besides the career's own: only to the life path's unit commander. */
  get #officerTalents() {
    const { method, commander, kind } = this.choices;
    return method === "lifepath" && commander === "yes" && kind !== "womb" ? OFFICER_TALENTS : [];
  }

  /** The rank the choices so far give the character, or null if they leave it alone. */
  get #rank() {
    const { method, commander, rank } = this.choices;
    if (method !== "lifepath") return null;
    return commander === "yes" ? COMMANDER_RANK : commander === "no" ? rank : null;
  }

  /** The reasons for joining the Marines, read from their table once. */
  async #joiningReasons() {
    this._joiningReasons ??= await joiningReasons();
    return this._joiningReasons;
  }

  /** The skill the life path gives a point in, over and above the points spent, or null. */
  get #bonusSkill() {
    return earlyLifeSkill(this.choices);
  }

  static #onGoTo(event, target) {
    const steps = this.#steps;
    const index = steps.findIndex((step) => step.id === target.dataset.step);
    if (index < 0 || index > this.#reach) return;
    this.step = steps[index].id;
    return this.render();
  }

  static #onNext() {
    const steps = this.#steps;
    const index = steps.findIndex((step) => step.id === this.step);
    if (index >= this.#reach) return;
    this.step = steps[index + 1].id;
    return this.render();
  }

  static #onBack() {
    const steps = this.#steps;
    const index = steps.findIndex((step) => step.id === this.step);
    if (index <= 0) return;
    this.step = steps[index - 1].id;
    return this.render();
  }

  /** Answer one of the simple questions: the creation method, or one of a life path's. */
  static #onPick(event, target) {
    const { choice, value } = target.dataset;
    if (choice === "earlyLifeSkill") {
      if (!this.choices.earlyLife?.skills.includes(value)) return;
      this.choices.earlyLife.skill = value;
      this.#freeTrainedPoint();
      this.#fitToCareer();
    } else if (choice === "fieldEvent") {
      const [id, pick] = value.split("/");
      const event = this.choices.fieldEvents[id];
      if (!event?.gains.some((gain) => gain.id === pick) || fieldEventOver(this.choices, id, pick)) return;
      event.pick = pick;
    } else if (["gearA", "gearB", "gearMos"].includes(choice)) {
      const offered = { gearA: MARINE_GEAR.listA, gearB: MARINE_GEAR.listB, gearMos: mosGearChoice(this.choices) ?? [] }[choice];
      if (!offered.some((entry) => gearEntry(entry).name === value)) return;
      this.choices[choice] = value;
    } else if (choice === "kit") {
      // Picking a thing again puts it back.
      const { kit } = this.choices;
      if (!kitFor(this.choices)?.gear.includes(value)) return;
      if (kit.includes(value)) kit.splice(kit.indexOf(value), 1);
      else if (kit.length < RULES.kitPicks) kit.push(value);
      else return;
    } else if (choice === "android") {
      // Picking an attribute again takes its bonus back.
      const { android } = this.choices;
      if (!this.choices.synthetic || !ATTRIBUTES.includes(value)) return;
      if (android.includes(value)) android.splice(android.indexOf(value), 1);
      else if (android.length < RULES.androidBonusCount) android.push(value);
      else return;
    } else if (choice in WRITTEN) {
      const text = writtenExamples(choice, this.choices)[Number(value)];
      if (!text) return;
      this.choices[choice] = text;
    } else if (choice === "joining") {
      const reason = this._joiningReasons?.find((entry) => entry.id === value);
      if (!reason) return;
      this.choices.joining = { ...reason, roll: null };
    } else if (["method", "kind", "commander", "rank"].includes(choice)) {
      if (choice === "kind" && !KINDS.includes(value)) return;
      this.choices[choice] = value;
      // The two methods, and the kinds of character, offer different careers, so one picked under
      // another may not carry over, and they set different limits.
      if (choice === "method" || choice === "kind") {
        this.#fixLifePath();
        if (!this.career) this.choices.career = null;
        this.#fitToCareer();
      }
      // Only the commander may hold an Officer talent.
      if (choice === "commander") this.#fitToCareer();
    } else return;
    return this.render();
  }

  /** Roll the marine's origin, or roll it again. */
  static async #onRollOrigin(event, target) {
    target.disabled = true;
    const origin = await rollOrigin();
    if (!origin) return ui.notifications.warn(loc("ALTSHEET.Builder.Origin.NoTable"));
    this.choices.origin = origin;
    return this.render();
  }

  /** Roll the marine's early life, or roll it again. */
  static async #onRollEarlyLife(event, target) {
    target.disabled = true;
    const womb = this.choices.kind === "womb";
    const earlyLife = await (womb ? rollWombEarlyLife() : rollEarlyLife());
    if (!earlyLife) return ui.notifications.warn(loc("ALTSHEET.Builder.EarlyLife.NoTable"));
    if (earlyLife.missing) ui.notifications.warn(fmt("ALTSHEET.Builder.Womb.NoTable", { table: WOMB_EXPERIENCE_TABLE }));
    this.choices.earlyLife = earlyLife;
    this.#freeTrainedPoint();
    this.#fitToCareer();
    return this.render();
  }

  /** Roll the marine's reason for joining the Marines, instead of picking one. */
  static async #onRollJoining(event, target) {
    target.disabled = true;
    const draw = await drawLifePath(JOINING_TABLE);
    const reason = (await this.#joiningReasons()).find((entry) => entry.id === draw?.results[0]?.id);
    if (!reason) return ui.notifications.warn(loc("ALTSHEET.Builder.Joining.NoTable"));
    this.choices.joining = { ...reason, roll: draw.roll.total };
    return this.render();
  }

  /** Roll one of the marine's field events, or roll it again. */
  static async #onRollFieldEvent(event, target) {
    target.disabled = true;
    const entry = FIELD_EVENT_TABLES.find(({ id }) => id === target.dataset.table);
    const rolled = entry && (await rollFieldEvent(entry.table));
    if (!rolled) return ui.notifications.warn(loc("ALTSHEET.Builder.FieldEvent.NoTable"));
    this.choices.fieldEvents[entry.id] = rolled;
    return this.render();
  }

  /** Roll for one of a written answer's examples, shown in chat as a roll at the table would be. */
  static async #onRollWritten(event, target) {
    target.disabled = true;
    const { field } = target.dataset;
    if (!(field in WRITTEN)) return;
    const examples = writtenExamples(field, this.choices);
    if (!examples.length) return this.render();
    const roll = await new Roll(`1d${examples.length}`).evaluate();
    const text = examples[roll.total - 1];
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<b>${loc(WRITTEN[field].label)}</b><br>${foundry.utils.escapeHTML(text)}`,
    });
    this.choices[field] = text;
    return this.render();
  }

  /** Roll for the gear a career gives by the book, in place of picking it: no thing comes up twice. */
  static async #onRollKit(event, target) {
    target.disabled = true;
    const gear = kitFor(this.choices)?.gear ?? [];
    const kit = [];
    while (kit.length < Math.min(RULES.kitPicks, gear.length)) {
      const roll = await new Roll(`1d${gear.length}`).evaluate();
      const text = gear[roll.total - 1];
      if (kit.includes(text)) continue;
      kit.push(text);
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `<b>${loc("ALTSHEET.Builder.Kit.Title")}</b><br>${foundry.utils.escapeHTML(text)}`,
      });
    }
    this.choices.kit = kit;
    return this.render();
  }

  /** Roll for the cash a career starts with by the book. */
  static async #onRollCash(event, target) {
    target.disabled = true;
    const cash = kitFor(this.choices)?.cash;
    // Cash is rolled for once.
    if (!cash || this.choices.cash !== null) return this.render();
    const roll = await new Roll(`1d6 * ${cash}`).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<b>${loc("ALTSHEET.Builder.Cash.Title")}</b>`,
    });
    this.choices.cash = roll.dice[0].total;
    return this.render();
  }

  /** An answer the player writes is kept as they type it. */
  _onRender(context, options) {
    super._onRender(context, options);
    for (const input of this.element.querySelectorAll("textarea[data-field]")) {
      if (!(input.dataset.field in WRITTEN)) continue;
      input.addEventListener("input", (event) => (this.choices[input.dataset.field] = event.target.value));
    }
  }

  static #onPickCareer(event, target) {
    this.choices.career = target.dataset.careerId;
    this.#fitToCareer();
    return this.render();
  }

  static #onPickTalent(event, target) {
    this.choices.talent = target.dataset.talent;
    return this.render();
  }

  /** Spend a point on, or take one back from, an attribute or skill. */
  static #onAdjust(event, target) {
    const { kind, key } = target.dataset;
    const scores = this.choices[kind];
    const total = kind === "attributes" ? RULES.attributePoints : RULES.skillPoints;
    const next = scores[key] + Number(target.dataset.step);
    if (next < this.#min(kind, key) || next > this.#max(kind, key)) return;
    if (next > scores[key] && spent(scores) >= total) return;
    scores[key] = next;
    return this.render();
  }

  static async #onApply() {
    const { actor } = this;
    const state = this.choices;
    if (this.#steps.some((step) => !step.done(state))) return;
    const careerItem = game.items.get(state.career);
    if (!careerItem) return ui.notifications.warn(loc("ALTSHEET.Builder.CareerGone"));
    if (ATTRIBUTES.some((key) => actor.system.attributes[key]?.value)) {
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: "ALTSHEET.Builder.ReplaceTitle" },
        content: `<p>${fmt("ALTSHEET.Builder.ReplaceWarning", { name: actor.name })}</p>`,
        rejectClose: false,
      });
      if (!confirmed) return;
    }

    const update = {};
    const eventGains = fieldEventGains(state);
    for (const [key, value] of Object.entries(state.attributes)) {
      const android = state.android.includes(key) ? RULES.androidBonus : 0;
      update[`system.attributes.${key}.value`] = value + (eventGains.attributes[key] ?? 0) + android;
    }
    const bonusSkill = this.#bonusSkill;
    for (const [key, value] of Object.entries(state.skills)) {
      update[`system.skills.${key}.value`] = value + (key === bonusSkill ? 1 : 0) + (eventGains.skills[key] ?? 0);
    }
    const events = state.method === "lifepath" ? fieldEventsFor(state).map(({ id }) => state.fieldEvents[id]).filter(Boolean) : [];
    if (state.agenda.trim()) update["system.general.agenda.value"] = state.agenda.trim();
    if (state.signature.trim()) update["system.general.sigItem.value"] = state.signature.trim();
    if (cashFor(state) !== null) update["system.general.cash.value"] = String(cashFor(state));
    if (events.length) update[`flags.${MODULE_ID}.fieldEvents`] = events.map((event) => event.text).join("\n\n");
    // The system's older career field, for anything that still reads it.
    const legacy = Object.entries(CONFIG.ALIENRPG.career_list).find(([, entry]) => sameName(loc(entry.label), careerItem.name));
    if (legacy) update["system.general.career.value"] = legacy[0];
    if (this.#rank) update[`flags.${MODULE_ID}.rank`] = this.#rank;
    if (!state.synthetic) update[`flags.${MODULE_ID}.kind`] = state.kind;
    if (state.method === "lifepath" && state.origin) {
      const { supernation, subAffiliation, home } = state.origin;
      update[`flags.${MODULE_ID}.origin`] = { supernation, subAffiliation, home };
    }
    if (state.method === "lifepath" && state.earlyLife) update[`flags.${MODULE_ID}.earlyLife`] = state.earlyLife.story;
    if (state.method === "lifepath" && state.joining) {
      update[`flags.${MODULE_ID}.joining`] = [state.joining.name, state.joining.text].filter(Boolean).join(". ");
    }
    await actor.update(update);
    // A new character starts unhurt; the system works out maximum Health from the scores just set.
    const { calculatedMax, max } = actor.system.header.health;
    await actor.update({ "system.header.health.value": calculatedMax ?? max });

    const careers = actor.items.filter((item) => item.type === "specialty").map((item) => item.id);
    if (careers.length) await actor.deleteEmbeddedDocuments("Item", careers);
    const create = [careerItem.toObject()];
    // The starting talent, and any the field events gave.
    const missing = [];
    for (const name of new Set([state.talent, ...events.flatMap((event) => event.talents)])) {
      const talentItem = findTalent(name);
      if (!talentItem) missing.push(name);
      else if (
        !actor.items.some((item) => item.type === "talent" && sameName(item.name, talentItem.name)) &&
        !create.some((item) => item.type === "talent" && sameName(item.name, talentItem.name))
      ) create.push(talentItem.toObject());
    }
    // Starting gear, less anything the character already carries. By the book some of it is a roll's worth.
    const kit = [];
    for (const entry of state.method === "book" ? state.kit.map(kitEntry) : []) {
      kit.push(entry.dice ? { ...entry, quantity: (await new Roll(entry.dice).evaluate()).total } : entry);
    }
    for (const entry of state.method === "lifepath" ? startingGear(state) : kit) {
      if (actor.items.some((item) => sameName(item.name, entry.name))) continue;
      const data = entry.item?.toObject() ?? { name: entry.name, type: "item" };
      if (data.type !== "armor") foundry.utils.setProperty(data, "system.attributes.quantity.value", entry.quantity);
      create.push(data);
    }
    await actor.createEmbeddedDocuments("Item", create);

    for (const name of missing) ui.notifications.warn(fmt("ALTSHEET.Builder.TalentMissing", { name }));
    ui.notifications.info(fmt(`ALTSHEET.Builder.${state.method === "lifepath" || kitFor(state) ? "AppliedLifePath" : "Applied"}`, { name: actor.name }));
    return this.close();
  }
}
