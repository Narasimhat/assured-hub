import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDesignSpec, reverseSpec } from '@assured/spec';
import { ENZYMES } from '@assured/spec/enzyme-config';
import { ENZYMES as designEnzymes } from '../../apps/design/assured-crispr-designer/src/enzymeConfig.js';
import { ENZYMES as benchEnzymes } from '../../apps/studio/src/engine/design/enzymeConfig.js';
import { validateDesignSpec as benchValidate } from '../../apps/studio/src/engine/qc/designSpec.js';
import { validateDesignSpec as qcValidate } from '../../apps/qc/src/designSpec.js';
import { runDesign } from '../../apps/design/assured-crispr-designer/src/designEngine.js';
import { buildQcDesignSpec } from '../../apps/design/assured-crispr-designer/src/qcExport.js';
const raw = readFileSync(new URL('../../apps/studio/public/references/tp53-NG_017013.2.gb', import.meta.url), 'utf8');
test('Hub Design, Bench and QC share the enzyme records and validator', () => {
  assert.equal(designEnzymes, ENZYMES);
  assert.equal(benchEnzymes, ENZYMES);
  assert.equal(benchValidate, validateDesignSpec);
  assert.equal(qcValidate, validateDesignSpec);
});
for (const enzyme of ['ascas12a', 'lbcas12a', 'mad7']) {
  test(`${enzyme}: Hub Design exports two TP53 guides consumable by both Hub QC entry points`, () => {
    const result = runDesign('ko', raw, '', '', '', { enzyme });
    assert.ok(!result.err, result.err);
    assert.equal(result.gs.length, 2);
    const spec = buildQcDesignSpec(result);
    for (const check of [benchValidate, qcValidate]) {
      assert.deepEqual(check(spec).errors, []);
      assert.deepEqual(check(reverseSpec(spec)).errors, []);
    }
  });
}
