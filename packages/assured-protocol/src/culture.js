// Culture microenvironment: the conditions that decide whether an edit works before any reagent is
// pipetted. These are the deviations that most often sink an hiPSC editing run, so each one carries
// the mechanism a learner needs, not just the setting.

import { stated } from "./sources.js";

export const HYPOXIA = Object.freeze({
  temperatureC: stated(37, "degC", "published", "ASSURED_2023"),
  co2Percent: stated(5, "%", "published", "ASSURED_2023"),
  o2Percent: stated(5, "%", "published", "ASSURED_2023"),
  normoxicO2Percent: stated(21, "%", "illustrative", "NOT_SOURCED", "Ambient oxygen, for contrast only."),
  passagesPostThaw: stated("2-3", "passages", "owner-stated", "PLATFORM_SPEC", "Edit at early passage after thaw."),
  mechanism:
    "Physiological 5% oxygen is closer to the niche hiPSCs came from. At ambient 21% oxygen the cells carry more oxidative DNA damage, proliferate less well in the pluripotent state, and enter electroporation already stressed — which is exactly when chromosomal instability is selected for.",
  crisprMixNote:
    "CRISPR-MiX runs hypoxic as well, with a different CO2 setpoint than ASSURED. Follow the protocol you chose; do not mix the two gas settings.",
});

export const GELTREX = Object.freeze({
  stockVolumeMl: stated(5, "mL", "owner-stated", "PLATFORM_SPEC"),
  diluentVolumeMl: stated(45, "mL", "owner-stated", "PLATFORM_SPEC"),
  diluent: "cold KO DMEM/F-12",
  aliquotMl: stated(1, "mL", "owner-stated", "PLATFORM_SPEC"),
  aliquotStorageC: stated(-20, "degC", "owner-stated", "PLATFORM_SPEC"),
  workingDilution: stated("1:12", "", "owner-stated", "PLATFORM_SPEC", "In KO DMEM/F-12, immediately before coating."),
  coatingTime: stated("1 h at 37 degC", "", "owner-stated", "PLATFORM_SPEC"),
  prechillC: stated(-20, "degC", "owner-stated", "PLATFORM_SPEC"),
  prechillMinutes: stated(20, "min", "owner-stated", "PLATFORM_SPEC", "Minimum, for pipettes and tubes."),
  mechanism:
    "Basement-membrane extract polymerises as it warms. Pipettes and tubes that are not pre-chilled start the gel in the tip, so part of the matrix is already set before it reaches the vessel. The well then coats unevenly: cells on bare plastic lose the integrin signalling that holds them pluripotent, and the colony differentiates at the edges.",
  bubbleWarning: "Dilute without introducing bubbles; foam coats as unevenly as premature gel does.",
});

export const MATRIGEL = Object.freeze({
  hiPscMaintenance: stated("1:200", "", "owner-stated", "PLATFORM_SPEC"),
  cardiomyocytes: stated("1:100", "", "owner-stated", "PLATFORM_SPEC"),
  mechanism:
    "Contracting hiPSC-derived cardiomyocytes pull on their substrate with every beat. The more concentrated coating is what stops the monolayer peeling off the plate; a maintenance-strength coating under beating cells detaches as a sheet.",
});

export const MEDIA = Object.freeze({
  maintenance: "Essential 8 (E8)",
  editingRecovery: Object.freeze({
    options: ["StemFlex", "StemMACS PSC-Brew XF"],
    mechanism:
      "E8 is a maintenance medium. After electroporation and after single-cell dissociation the cells are not maintaining, they are recovering from a double hit: membrane permeabilisation and loss of E-cadherin contacts. Recovery-optimised media keep more of them alive through that window.",
  }),
  cloneR2: Object.freeze({
    dilution: stated("1:10", "", "owner-stated", "PLATFORM_SPEC", "In StemFlex, for thawing and expanding single-cell clones."),
    mediaChange24h: "Half change at 24 h with StemFlex + CloneR2",
    mediaChange48h: "Full StemFlex changes from 48 h until roughly 70% confluency",
    mechanism:
      "Single hiPSCs die by dissociation-induced apoptosis: losing E-cadherin contact activates ROCK-dependent hyperactivation of myosin. A ROCK-inhibitor-containing clonal recovery supplement interrupts that, which is why it is the difference between a plate of clones and an empty plate.",
  }),
  rockInhibitor: Object.freeze({
    agent: "Y-27632",
    crisprMixConcentration: stated(2.5, "uM", "owner-stated", "PLATFORM_SPEC", "During DPBS-EDTA dissociation in CRISPR-MiX."),
  }),
  passaging: Object.freeze({
    clumps: "EDTA / DPBS-EDTA, as clumps, for routine passaging",
    dpbsEdtaMinutes: stated("7-10", "min", "owner-stated", "PLATFORM_SPEC", "CRISPR-MiX dissociation."),
    singleCell: "A single-cell suspension is prepared only when one is needed, for nucleofection or cloning",
    expansionSplit: stated("1:6", "", "owner-stated", "PLATFORM_SPEC", "EDTA passaging of an expanded clone."),
  }),
});

/**
 * The culture deviations the Tier 3 simulator can present, as data.
 * `key` is what wetlabModel.js scores; `mechanism` is what the learner is told afterwards.
 */
export const CULTURE_DEVIATIONS = Object.freeze([
  Object.freeze({
    key: "normoxia",
    question: "Incubator oxygen",
    correct: "5% O2 (hypoxic)",
    deviation: "21% O2 (ambient)",
    mechanism: HYPOXIA.mechanism,
  }),
  Object.freeze({
    key: "warmGeltrex",
    question: "Geltrex handling",
    correct: "Pipettes and tubes pre-chilled at -20 degC for at least 20 min; thaw on wet ice",
    deviation: "Room-temperature pipettes and tubes",
    mechanism: GELTREX.mechanism,
  }),
  Object.freeze({
    key: "noRecoveryMedium",
    question: "Medium during editing and recovery",
    correct: "Switch E8 to StemFlex or StemMACS PSC-Brew XF",
    deviation: "Stay in E8 throughout",
    mechanism: MEDIA.editingRecovery.mechanism,
  }),
  Object.freeze({
    key: "noCloneR2",
    question: "Single-cell cloning supplement",
    correct: "StemFlex + CloneR2 (1:10)",
    deviation: "No clonal recovery supplement",
    mechanism: MEDIA.cloneR2.mechanism,
  }),
  Object.freeze({
    key: "refrozenCas9",
    question: "HiFi Cas9 V3 handling",
    correct: "One single-use 2 uL aliquot, thawed once",
    deviation: "Re-used a stock tube that has been frozen and thawed repeatedly",
    mechanism:
      "Each freeze-thaw cycle loses nuclease activity. Less active nuclease cuts fewer alleles, so the pool score falls. The trace looks like a badly chosen guide, and the guide gets blamed and replaced — which costs another full round.",
  }),
  Object.freeze({
    key: "wrongPulse",
    question: "Neon pulse settings",
    correct: "The pulse of the protocol you are running",
    deviation: "The other protocol's pulse, or a guessed setting",
    mechanism:
      "Pulse width trades delivery against membrane damage. Too short and the RNP does not get in, so nothing is edited; too long and the cells that took up the RNP do not survive to be cloned. Both failures look identical on an empty plate.",
  }),
]);
