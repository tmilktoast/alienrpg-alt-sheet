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

/** The rank a life path gives the unit's commander. */
const COMMANDER_RANK = "Corporal";

/**
 * Every step the builder knows, in order. Each says whether what has been chosen so far completes
 * it, and may name the one creation method it belongs to: "book" spends the rulebook's points and
 * nothing more, "lifepath" asks its own questions as well. A new life path question is another
 * entry here and another block in the template.
 */
const STEPS = [
  { id: "method", done: (state) => !!state.method },
  { id: "commander", method: "lifepath", done: (state) => !!state.commander },
  { id: "career", done: (state) => !!state.career },
  { id: "attributes", done: (state) => spent(state.attributes) === RULES.attributePoints },
  { id: "skills", done: (state) => spent(state.skills) === RULES.skillPoints },
  { id: "talent", done: (state) => !!state.talent },
  { id: "review", done: () => true },
];

/** The steps the chosen creation method walks through. */
const stepsFor = (state) => STEPS.filter((step) => !step.method || step.method === state.method);

const loc = (key) => game.i18n.localize(key);
const fmt = (key, data) => game.i18n.format(key, data);
const spent = (scores) => Object.values(scores).reduce((sum, value) => sum + value, 0);
const plain = (html) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/* -------------------------------------------- */
/*  Careers                                     */
/* -------------------------------------------- */

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
    const talents = written[3].split(",").map((name) => name.trim()).filter(Boolean);
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

/* -------------------------------------------- */
/*  Application                                 */
/* -------------------------------------------- */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Walks a player through creating a character: career, attributes, skills and a talent, with a
 * life path's questions first for those who choose one, then writes the result to the actor in one go. Nothing on the actor changes until Apply.
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
    this.step = STEPS[0].id;
    /**
     * What has been chosen so far. The method is "book" or "lifepath"; commander is "yes" or "no";
     * a career is the id of its Career item; a talent is its name.
     */
    this.choices = {
      method: null,
      commander: null,
      career: null,
      attributes: Object.fromEntries(ATTRIBUTES.map((key) => [key, RULES.attributeMin])),
      skills: Object.fromEntries(Object.keys(CONFIG.ALIENRPG.skills).map((key) => [key, 0])),
      talent: null,
    };
  }

  get title() {
    return fmt("ALTSHEET.Builder.Title", { name: this.actor.name });
  }

  /** Every career the builder understands: the rulebook's first, then by folder and name. */
  get careers() {
    return game.items
      .filter((item) => item.type === "specialty")
      .map(careerDefinition)
      .filter(Boolean)
      .sort((a, b) => b.core - a.core || a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  }

  get career() {
    return this.careers.find((career) => career.id === this.choices.career) ?? null;
  }

  /** The highest a score may go, which depends on the career chosen. */
  #max(kind, key) {
    const career = this.career;
    if (kind === "attributes") return career?.attribute === key ? RULES.keyAttributeMax : RULES.attributeMax;
    return career?.skills.includes(key) ? RULES.keySkillMax : RULES.skillMax;
  }

  #min(kind) {
    return kind === "attributes" ? RULES.attributeMin : 0;
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

    const scoreRow = (kind, key, label, isKey, left) => {
      const value = state[kind][key];
      const max = this.#max(kind, key);
      return {
        key,
        kind,
        label,
        value,
        max,
        isKey,
        pips: Array.from({ length: max }, (_, i) => ({ filled: i < value })),
        canLower: value > this.#min(kind),
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

    const talents = await Promise.all(
      (career?.talents ?? []).map(async (name) => {
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

    return {
      step: this.step,
      steps: steps.map((step, i) => ({
        id: step.id,
        number: i + 1,
        label: loc(`ALTSHEET.Builder.Steps.${step.id}`),
        active: step.id === this.step,
        done: i < reach,
        enabled: i <= reach,
      })),
      isFirst: index === 0,
      isLast: index === steps.length - 1,
      canNext: index < reach,
      rules: RULES,
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
      groups,
      career: career && {
        ...career,
        attributeLabel: attributeLabel(career.attribute),
        skillLabels: career.skills.map(skillLabel).join(", "),
        description: await foundry.applications.ux.TextEditor.enrichHTML(
          game.items.get(career.id)?.system.general.comment.value ?? "",
        ),
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
      review: {
        rank: this.#rank,
        talent: state.talent,
        attributes: ATTRIBUTES.map((key) => ({ label: attributeLabel(key), value: state.attributes[key] })),
        skills: Object.entries(state.skills)
          .filter(([, value]) => value > 0)
          .map(([key, value]) => ({ label: skillLabel(key), value })),
        // Applying overwrites a character that already has scores, so say so first.
        replaces: ATTRIBUTES.some((key) => this.actor.system.attributes[key]?.value),
      },
    };
  }

  /** Bring scores back within the limits of a newly chosen career, and drop a talent it lacks. */
  #fitToCareer() {
    for (const kind of ["attributes", "skills"]) {
      for (const key of Object.keys(this.choices[kind])) {
        this.choices[kind][key] = Math.min(this.choices[kind][key], this.#max(kind, key));
      }
    }
    if (!this.career?.talents.includes(this.choices.talent)) this.choices.talent = null;
  }

  /** The rank the choices so far give the character, or null if they leave it alone. */
  get #rank() {
    const { method, commander } = this.choices;
    return method === "lifepath" && commander === "yes" ? COMMANDER_RANK : null;
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

  /** Answer one of the simple questions: the creation method, or a life path's yes or no. */
  static #onPick(event, target) {
    const { choice, value } = target.dataset;
    if (!["method", "commander"].includes(choice)) return;
    this.choices[choice] = value;
    return this.render();
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
    if (next < this.#min(kind) || next > this.#max(kind, key)) return;
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
    for (const [key, value] of Object.entries(state.attributes)) update[`system.attributes.${key}.value`] = value;
    for (const [key, value] of Object.entries(state.skills)) update[`system.skills.${key}.value`] = value;
    // The system's older career field, for anything that still reads it.
    const legacy = Object.entries(CONFIG.ALIENRPG.career_list).find(([, entry]) => sameName(loc(entry.label), careerItem.name));
    if (legacy) update["system.general.career.value"] = legacy[0];
    if (this.#rank) update[`flags.${MODULE_ID}.rank`] = this.#rank;
    await actor.update(update);
    // A new character starts unhurt; the system works out maximum Health from the scores just set.
    const { calculatedMax, max } = actor.system.header.health;
    await actor.update({ "system.header.health.value": calculatedMax ?? max });

    const careers = actor.items.filter((item) => item.type === "specialty").map((item) => item.id);
    if (careers.length) await actor.deleteEmbeddedDocuments("Item", careers);
    const create = [careerItem.toObject()];
    const talentItem = findTalent(state.talent);
    const hasTalent = actor.items.some((item) => item.type === "talent" && sameName(item.name, state.talent));
    if (talentItem && !hasTalent) create.push(talentItem.toObject());
    await actor.createEmbeddedDocuments("Item", create);

    if (!talentItem) ui.notifications.warn(fmt("ALTSHEET.Builder.TalentMissing", { name: state.talent }));
    ui.notifications.info(fmt("ALTSHEET.Builder.Applied", { name: actor.name }));
    return this.close();
  }
}
