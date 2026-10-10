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

/** Equipped weapons, with the dice pool an attack will roll. */
export function prepareWeapons(actor) {
  const skills = actor.system.skills;
  return actor.items
    .filter((item) => item.type === "weapon" && itemState(item) === "equipped")
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((item) => {
      const { attributes: a, header } = item.system;
      const ranged = header.type.value === WEAPON_RANGED;
      const melee = header.type.value === WEAPON_MELEE;
      const bonus = a.bonus.value || 0;
      return {
        id: item.id,
        name: item.name,
        img: item.img,
        ranged,
        typed: ranged || melee,
        typeLabel: ranged ? loc("ALIENRPG.WepTypeRanged") : melee ? loc("ALIENRPG.WepTypeMelee") : "",
        pool: (skills[ranged ? "rangedCbt" : "closeCbt"]?.mod ?? 0) + bonus,
        damage: a.damage.value,
        bonus: signed(bonus),
        range: rangeLabel(a.range.value),
        rounds: a.rounds.value,
        power: a.power.value,
        armorPiercing: header.armorpiercing,
        fullAuto: header.fullauto,
        empty: ranged && a.rounds.value <= 0,
      };
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

/* -------------------------------------------- */
/*  Sheet                                       */
/* -------------------------------------------- */

/**
 * Build the alternate sheet on top of one of the system's own sheet classes. Subclassing keeps the
 * system's item preparation, encumbrance, status effects and drag-and-drop; only the layout, the
 * templates and the click handling are replaced.
 * @param {typeof foundry.applications.sheets.ActorSheetV2} Base  The system sheet for this actor type
 * @param {string} type                                           The actor type it is registered for
 */
function makeSheet(Base, type) {
  // The system sheet's render hooks assume its own templates, so a few overrides skip past it.
  const Core = Object.getPrototypeOf(Base.prototype);

  class AltSheet extends Base {
    static DEFAULT_OPTIONS = {
      classes: ["alien-alt-sheet"],
      position: { width: 800, height: 880 },
      actions: {
        toggleEdit: AltSheet.#onToggleEdit,
        roll: { handler: AltSheet.#onRoll, buttons: [0, 2] },
        rollMods: AltSheet.#onRollMods,
        stepField: AltSheet.#onStepField,
        setField: AltSheet.#onSetField,
        radiation: AltSheet.#onRadiation,
        setItemState: AltSheet.#onSetItemState,
        addItem: AltSheet.#onAddItem,
        editItem: AltSheet.#onEditItem,
        deleteItem: AltSheet.#onDeleteItem,
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

    /** Whether attributes, skill ranks, name and career are unlocked. Decided on first render. */
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
      this.tabGroups.primary ??= "play";
      const tabs = {};
      for (const id of parts) {
        if (!(id in TABS)) continue;
        tabs[id] = {
          id,
          group: "primary",
          icon: TABS[id],
          label: `ALTSHEET.Tabs.${id.capitalize()}`,
          cssClass: this.tabGroups.primary === id ? "active" : "",
        };
      }
      return tabs;
    }

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      const actor = this.actor;
      const sys = actor.system;
      const evolved = context.isEvolved;
      const hasStress = actor.type === "character" || !!sys.header.synthstress;

      // A blank character opens unlocked, since the first thing to do is fill it in.
      this._editMode ??= ATTRIBUTES.every((key) => !sys.attributes[key]?.value);

      const enrich = (html, relativeTo) =>
        foundry.applications.ux.TextEditor.enrichHTML(html ?? "", {
          secrets: actor.isOwner,
          rollData: actor.getRollData(),
          relativeTo,
        });
      const described = (items) =>
        Promise.all(
          items.map(async (item) => ({
            id: item.id,
            name: item.name,
            img: item.img,
            description: await enrich(item.system.general?.comment?.value, item),
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
        conditions: prepareConditions(actor, context.statuses, { hasStress }),
        radiation: prepareRadiation(actor),
        supplies: prepareSupplies(actor),
        bio: { ...bio, careerHint: this.isEditable && (this._editMode || !bio.career) },
        rules: { ...prepareRules(), actionsLink: await prepareActionsLink() },
        talentList: await described(context.talents),
        agendaList: await described(context.agendas),
        injuries: context.critInj.map((item) => ({
          id: item.id,
          name: item.name,
          img: item.img,
          fatal: item.system.attributes.fatal,
          effects: (item.system.attributes.effects ?? "").replace(/<[^>]+>/g, " ").trim(),
        })),
        encumbrance: { ...sys.general.encumbrance, value: Math.round(sys.general.encumbrance.value * 100) / 100 },
        enrichedNotes: await enrich(sys.notes, actor),
        enrichedAdhocitems: await enrich(sys.adhocitems, actor),
      });
    }

    async _preparePartContext(partId, context, options) {
      context = await Core._preparePartContext.call(this, partId, context, options);
      if (partId in TABS) context.tab = context.tabs[partId];
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
          this.#item(input)?.update({ [input.dataset.itemField]: value });
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

    #item(target) {
      return this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    }

    /**
     * Make one of the system's rolls. Every roll reads its inputs from the clicked element's
     * dataset, exactly as the system's own sheet passes them.
     * @param {HTMLElement} target  The element carrying data-roll-type and the roll's data
     * @param {boolean} withMods    Ask for modifiers first
     */
    async _roll(target, withMods) {
      const actor = this.actor;
      const data = target.dataset;
      switch (data.rollType) {
        case "ability":
          return withMods ? actor.rollAbilityMod(actor, data) : actor.abilityRoll(actor, data);
        case "weapon": {
          const item = this.#item(target);
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
      const doc = target.closest("[data-item-id]") ? this.#item(target) : this.actor;
      if (!doc) return;
      const current = Number(foundry.utils.getProperty(doc, path)) || 0;
      let next = current + Number(step);
      if (min !== undefined) next = Math.max(next, Number(min));
      if (max !== undefined) next = Math.min(next, Number(max));
      if (next !== current) await doc.update({ [path]: next });
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
      await this.#item(target)?.update({ "system.header.active": target.dataset.state });
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
      this.#item(target)?.sheet.render(true);
    }

    static async #onDeleteItem(event, target) {
      const item = this.#item(target);
      if (!item) return;
      const lastInjury = item.type === "critical-injury" && this.actor.system.general.critInj.value <= 1;
      const deleted = await item.deleteDialog();
      // The system marks an injured character with an effect; clear it with the last injury.
      if (deleted && lastInjury) await this.actor.effects.find((e) => e.statuses.has("criticalinj"))?.delete();
    }
  }

  // Sheets are registered by class name, so the two actor types need distinct ones.
  Object.defineProperty(AltSheet, "name", { value: `AltSheet${type.capitalize()}` });
  return AltSheet;
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

// The system's sheet classes only show up in CONFIG once Foundry has applied the registrations
// queued during init, which happens just before "ready".
Hooks.once("ready", () => {
  if (game.system.id !== SYSTEM_ID) return;
  for (const type of SHEET_TYPES) {
    const Base = Object.values(CONFIG.Actor.sheetClasses[type] ?? {}).find((s) => s.id.startsWith(`${SYSTEM_ID}.`))?.cls;
    if (!Base) {
      console.warn(`${MODULE_ID} | No ${SYSTEM_ID} sheet found for "${type}" actors; skipping.`);
      continue;
    }
    foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, MODULE_ID, makeSheet(Base, type), {
      types: [type],
      makeDefault: false,
      label: "ALTSHEET.SheetLabel",
    });
  }
});
