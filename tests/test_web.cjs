"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {evaluate, isPermanentFDI} = require("../web/app.js");
const fixture = {
  task_id: "DEMO-01",
  target_identifier: "ANON-01",
  primary_metric: 12,
  secondary_metric: 4,
  status_descriptor: "NOMINAL",
  is_critical_flag: false
};

test("nominal synthetic case has no alerts", () => {
  const result = evaluate(fixture);
  assert.equal(result.overall_urgency, "ROUTINE");
  assert.equal(result.total_alerts, 0);
  assert.equal(result.clinical_diagnostic_output, false);
  assert.equal(result.mode, "LOCAL_RULES_DEMONSTRATION");
  assert.equal("audit_hash" in result, false);
});

test("boundary cases match Python worker thresholds", () => {
  assert.equal(evaluate({...fixture, primary_metric: 25}).total_alerts, 0);
  assert.equal(evaluate({...fixture, primary_metric: 25.01}).total_alerts, 1);
  assert.equal(evaluate({...fixture, secondary_metric: 12.01}).overall_urgency, "ELEVATED_RISK");
  assert.equal(evaluate({...fixture, is_critical_flag: true}).overall_urgency, "CRITICAL_STAT_PANIC");
  assert.equal(evaluate({...fixture, status_descriptor: "DISCORDANT"}).total_alerts, 1);
  assert.equal(evaluate({...fixture, primary_metric: 30, secondary_metric: 13, status_descriptor: "FAIL"}).total_alerts, 3);
});

test("invalid input and invalid FDI numbers are rejected", () => {
  for (const value of ["", "NaN", "Infinity", "oops"]) {
    assert.throws(() => evaluate({...fixture, primary_metric: value}), /finite/);
  }
  for (const valid of ["11", "18", "21", "28", "31", "38", "41", "48"]) {
    assert.equal(isPermanentFDI(valid), true);
  }
  for (const invalid of ["19", "00", "49", "51", "1", "16a", ""]) {
    assert.equal(isPermanentFDI(invalid), false);
  }
  assert.throws(() => evaluate({...fixture, fdi_tooth:"49"}), /FDI/);
  assert.throws(() => evaluate({...fixture, task_id:""}), /task ID/);
});
