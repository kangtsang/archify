// Personal overlay loader for archify-personal (fork-only).
//
// This module is the entire extension surface of the fork. Upstream files may
// only (a) import from here and (b) read values out of it — never modify
// upstream logic. See FORK-RULES.md section 2; that rule exists so that merging
// a future upstream tag stays mechanical.
//
// Defaults deliberately reproduce stock archify 3.0.1 values, so removing or
// breaking personal/profile.json degrades to stock behaviour instead of
// throwing.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// Stock 3.0.1 workflow annotation sizes, measured from
// archify/renderers/workflow/workflow-compiler.mjs:
//   lane title 4663 "10", phase 4672 "8", group 4686 "7", edge 4734 "8",
//   legend footprint 831 "7", edge footprint 1390 "7".
const STOCK_ANNOTATION = Object.freeze({
  laneTitle: 10,
  phaseLabel: 8,
  groupLabel: 7,
  edgeLabel: 8,
  legend: 7,
});

const STOCK_NODE = Object.freeze({
  labelPreferred: 11,
  labelMinimum: 9,
  sublabelPreferred: 8,
  sublabelMinimum: 6,
  tagPreferred: 7,
  tagMinimum: 6,
});

const STOCK_LAYOUT = Object.freeze({
  enabled: false,
  fillWidth: false,
  scale: 1,
  outerMarginPx: 24,
  evenColumns: true,
});

let cache;

function load() {
  if (cache) return cache;
  let raw = {};
  try {
    raw = JSON.parse(readFileSync(join(HERE, 'profile.json'), 'utf8'));
  } catch {
    raw = {};
  }
  cache = {
    layout: { ...STOCK_LAYOUT, ...(raw.layout || {}) },
    typography: {
      scale: Number(raw.typography?.scale ?? 1),
      nodeWidthScale: Number(raw.typography?.nodeWidthScale ?? 1),
      node: { ...STOCK_NODE, ...(raw.typography?.node || {}) },
      annotation: { ...STOCK_ANNOTATION, ...(raw.typography?.annotation || {}) },
    },
  };
  return cache;
}

/** Whole overlay. */
export function personalProfile() {
  return load();
}

/**
 * Layout profile for the workflow renderer.
 * `laneX` mirrors workflow-compiler.mjs createReadableLayout()'s fixed lane x,
 * and `contentRightMax` exists because laneW is measured from the rightmost
 * node: lane right edge = laneX + rightmostX, so the widest legal node x is
 * canvasWidth - laneX - margin.
 */
export function personalLayout() {
  const { layout } = load();
  return { ...layout, laneX: 40, contentRightMax: null };
}

/** Node text fit overrides, falling back to stock 3.0.1 values. */
export function personalNodeTextFit() {
  return load().typography.node;
}

/** Annotation font size by role; unknown roles fall back to stock. */
export function personalAnnotationFont(role) {
  const { annotation } = load().typography;
  const value = annotation[role];
  return Number.isFinite(value) ? value : STOCK_ANNOTATION[role];
}

/** Convenience for the compiler's XML attributes. */
export function personalFontAttr(role) {
  return `font-size="${personalAnnotationFont(role)}"`;
}