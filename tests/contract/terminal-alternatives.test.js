import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as studio from '../../apps/studio/src/engine/design/designEngine.js';
import * as design from '../../apps/design/assured-crispr-designer/src/designEngine.js';
import { buildGuideAlternativesHtml as studioHtml } from '../../apps/studio/src/engine/design/reportHtml.js';
import { buildGuideAlternativesHtml as designHtml } from '../../apps/design/assured-crispr-designer/src/reportHtml.js';
import { buildQcDesignSpec } from '../../apps/studio/src/engine/design/qcExport.js';
const raw = fs.readFileSync(new URL('../../apps/studio/public/references/tp53-NG_017013.2.gb', import.meta.url), 'utf8');
const options = { expectedGene: 'TP53', deliveryMethod: 'rnp', maxBlockingChanges: 3 };

for (const [name, engine, render] of [['Studio', studio, studioHtml], ['Design', design, designHtml]]) {
  test(`${name}: preserve the primary TP53 FLAG guide and expose all nearby alternatives`, () => {
    const r = engine.runDesign('ct', raw, '', 'FLAG', 400, options);
    assert.equal(r.err, undefined);
    assert.equal(r.gs.length, 1);
    assert.equal(r.gs[0].d, -6);
    assert.equal(r.guideAlternatives.radius, 30);
    assert.equal(r.guideAlternatives.selectedWindow, 10);
    assert.deepEqual(r.guideAlternatives.candidates.map(g => g.d), [15, -18, -19, 27, 28, 29]);
    assert.ok(r.guideAlternatives.candidates.every(g => !r.gs.some(s => s.sp === g.sp && s.str === g.str && s.cut === g.cut)));
    for (const g of r.guideAlternatives.candidates) {
      assert.ok(Math.abs(g.d) <= 30);
      assert.ok(g.pm.endsWith('GG'));
      if (g.byInsertion) {
        assert.equal(g.cfd, null);
        assert.equal(g.protection, 'strong');
      } else {
        assert.ok(Number.isFinite(g.cfd));
        assert.ok(g.cfd >= 0 && g.cfd <= 1);
      }
    }
    const html = render(r);
    assert.match(html, /Alternative gRNAs within ±30 bp/);
    assert.match(html, /Protection with current donor/);
    assert.match(html, /15 bp downstream/);
    assert.equal(buildQcDesignSpec(r).guides.length, r.gs.length);
  });

  test(`${name}: terminal alternatives also work for N-terminal tagging and custom selections`, () => {
    const nt = engine.runDesign('nt', raw, '', 'FLAG', 400, options);
    assert.equal(nt.err, undefined);
    assert.ok(nt.guideAlternatives);
    const ct = engine.runDesign('ct', raw, '', 'FLAG', 400, options);
    const alternative = ct.guideAlternatives.candidates[0];
    const custom = engine.runDesign('ct', raw, '', 'FLAG', 400, { ...options, customGuides: [alternative.sp] });
    assert.equal(custom.err, undefined);
    assert.equal(custom.gs[0].sp, alternative.sp);
    assert.equal(custom.guideTier, 'custom');
    assert.ok(!custom.guideAlternatives.candidates.some(g => g.sp === alternative.sp));
    const ko = engine.runDesign('ko', raw, '', '', 400, options);
    assert.equal(ko.guideAlternatives, undefined);
    assert.equal(render(ko), '');
  });
}

test('Studio and Design return identical candidate evaluations', () => {
  const a = studio.runDesign('ct', raw, '', 'FLAG', 400, options);
  const b = design.runDesign('ct', raw, '', 'FLAG', 400, options);
  assert.deepEqual(a.guideAlternatives, b.guideAlternatives);
});
