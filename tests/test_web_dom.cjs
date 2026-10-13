"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");

function element(value = "") {
  const listeners = {};
  return {
    value, checked: false, disabled: false, textContent: "", dataset: {},
    listeners,
    addEventListener(type, callback) {listeners[type] = callback;}
  };
}

test("browser form evaluation, error, reset, and export", () => {
  const ids = {
    "audit-form": element(), task_id: element("DEMO-1"), target_id: element("ANON"),
    fdi_tooth: element("16"), primary_metric: element("27"), secondary_metric: element("2"),
    status_descriptor: element("NOMINAL"), is_critical: element(), result: element(),
    download: element(), "run-count": element()
  };
  let appended = null, blob = null, savedName = null;
  global.document = {
    getElementById(id) {return ids[id];},
    createElement(tag) {
      assert.equal(tag, "a");
      return {
        set href(v) {assert.equal(v, "blob:unit-test");},
        set download(v) {savedName = v;},
        click() {},
        remove() {}
      };
    },
    body: {appendChild(node) {appended = node;}}
  };
  global.URL = {
    createObjectURL(v) {blob = v; return "blob:unit-test";},
    revokeObjectURL() {}
  };
  global.setTimeout = fn => fn();
  delete require.cache[require.resolve("../web/app.js")];
  require("../web/app.js");

  let preventDefault = false;
  ids["audit-form"].listeners.submit({preventDefault() {preventDefault = true;}});
  assert.ok(preventDefault);
  assert.equal(ids["run-count"].textContent, "1");
  assert.equal(JSON.parse(ids.result.textContent).fdi_tooth, "16");
  assert.equal(ids.download.disabled, false);

  ids.download.listeners.click();
  assert.ok(blob instanceof Blob);
  assert.ok(appended);
  assert.equal(savedName, "dental-rules-demo.json");

  ids.primary_metric.value = "NaN";
  ids["audit-form"].listeners.submit({preventDefault() {}});
  assert.equal(ids.download.disabled, true);
  assert.equal(ids.result.dataset.state, "error");
  ids["audit-form"].listeners.reset();
  assert.equal(ids.result.dataset.state, "");
  assert.match(ids.result.textContent, /Enter synthetic values/);

  delete global.document;
  delete global.URL;
});
