"use strict";

/*
 * Local rules demonstration. No images are processed and these values are not
 * dental diagnostic criteria.
 */
(function (root) {
  const RULES = Object.freeze({primary: 25, secondary: 12});
  const discordant = /DISCORDANT|ANOMALY|MUTANT|VIOLATION|FAIL|REJECT/i;

  function isPermanentFDI(value) {
    return /^[1-4][1-8]$/.test(String(value));
  }

  function evaluate(input) {
    const primary = Number(input.primary_metric);
    const secondary = Number(input.secondary_metric);
    if (input.primary_metric === "" || input.secondary_metric === "" ||
        !Number.isFinite(primary) || !Number.isFinite(secondary)) {
      throw new Error("Enter finite numbers for both demonstration metrics.");
    }
    const tooth = String(input.fdi_tooth || "").trim();
    if (tooth && !isPermanentFDI(tooth)) {
      throw new Error("Use a two-digit permanent FDI tooth code (11–18, 21–28, 31–38, 41–48).");
    }
    const taskId = String(input.task_id || "").trim();
    if (!taskId || taskId.length > 80) {
      throw new Error("Provide a task ID between 1 and 80 characters.");
    }
    const target = String(input.target_identifier || "").trim();
    if (!target || target.length > 80) {
      throw new Error("Provide an anonymous target ID between 1 and 80 characters.");
    }
    const status = String(input.status_descriptor || "").trim();
    if (status.length > 120) {
      throw new Error("The status descriptor must be 120 characters or fewer.");
    }
    const alerts = [];
    if (primary > RULES.primary) {
      alerts.push({
        origin_worker: "InvariantQCWorker",
        urgency: "ELEVATED_RISK",
        summary: "Primary demonstration threshold exceeded"
      });
    }
    if (input.is_critical_flag || secondary > RULES.secondary) {
      alerts.push({
        origin_worker: "SafetyEscalationWorker",
        urgency: input.is_critical_flag ? "CRITICAL_STAT_PANIC" : "ELEVATED_RISK",
        summary: "Manual priority flag or secondary demonstration threshold triggered"
      });
    }
    if (discordant.test(status)) {
      alerts.push({
        origin_worker: "ProtocolConformanceWorker",
        urgency: "ELEVATED_RISK",
        summary: "Status descriptor contains a configured alert keyword"
      });
    }
    const critical = alerts.filter(a => a.urgency === "CRITICAL_STAT_PANIC").length;
    const urgency = critical ? "CRITICAL_STAT_PANIC" : alerts.length ? "ELEVATED_RISK" : "ROUTINE";
    return {
      mode: "LOCAL_RULES_DEMONSTRATION",
      clinical_diagnostic_output: false,
      note: "Synthetic rule evaluation only; no radiograph or clinical criteria analyzed.",
      task_id: taskId,
      target_identifier: target,
      fdi_tooth: tooth || null,
      input: {
        primary_metric: primary,
        secondary_metric: secondary,
        status_descriptor: status,
        is_critical_flag: Boolean(input.is_critical_flag)
      },
      demonstration_thresholds: RULES,
      overall_urgency: urgency,
      integrity_status: critical ? "RECALIBRATION_REQUIRED" : alerts.length ? "DISCORDANT_ANOMALY" : "VALIDATED_OPTIMAL",
      total_alerts: alerts.length,
      critical_alerts_count: critical,
      alerts
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {evaluate, isPermanentFDI};
  }
  if (typeof document === "undefined") return;

  const form = document.getElementById("audit-form");
  const output = document.getElementById("result");
  const download = document.getElementById("download");
  const count = document.getElementById("run-count");
  let lastResult = null;
  let runs = 0;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    download.disabled = true;
    try {
      lastResult = evaluate({
        task_id: document.getElementById("task_id").value,
        target_identifier: document.getElementById("target_id").value,
        fdi_tooth: document.getElementById("fdi_tooth").value,
        primary_metric: document.getElementById("primary_metric").value,
        secondary_metric: document.getElementById("secondary_metric").value,
        status_descriptor: document.getElementById("status_descriptor").value,
        is_critical_flag: document.getElementById("is_critical").checked
      });
      output.textContent = JSON.stringify(lastResult, null, 2);
      output.dataset.state = "ok";
      download.disabled = false;
      count.textContent = String(++runs);
    } catch (error) {
      lastResult = null;
      output.textContent = error.message;
      output.dataset.state = "error";
    }
  });

  download.addEventListener("click", function () {
    if (!lastResult) return;
    const blob = new Blob([JSON.stringify(lastResult, null, 2) + "\n"], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dental-rules-demo.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });

  form.addEventListener("reset", function () {
    lastResult = null;
    download.disabled = true;
    output.textContent = "Enter synthetic values and select Evaluate to generate a local report.";
    output.dataset.state = "";
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
