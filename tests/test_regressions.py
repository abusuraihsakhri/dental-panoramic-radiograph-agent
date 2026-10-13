"""Regression tests for input safety, audit integrity, and documented behavior."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from agents.api import app
from agents.base import AuditLogger, AuditTrail, SecurityException
from agents.models import SystemTaskPayload
from agents.supervisor import SystemSupervisor
from dent_scan_ai.models import FrontierPayload

client = TestClient(app)


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -float("inf")])
def test_nonfinite_values_rejected(value):
    with pytest.raises(ValidationError):
        SystemTaskPayload(task_id="DEMO", target_identifier="ANON", primary_metric=value)
    with pytest.raises(ValidationError):
        SystemTaskPayload(task_id="DEMO", target_identifier="ANON", primary_metric=1, secondary_metric=value)
    with pytest.raises(ValueError):
        FrontierPayload("DEMO", "ANON", value, 2.0, "NOMINAL")


def test_nested_identifier_screening():
    supervisor = SystemSupervisor()
    payload = SystemTaskPayload(
        task_id="DEMO", target_identifier="ANON", primary_metric=1.0,
        attributes={"raw_note": "MRN: 12345678"}
    )
    with pytest.raises(SecurityException):
        supervisor.process_task(payload)


def test_audit_ledger_read_is_defensive_copy():
    trail = AuditTrail(secret_key="unit-test-secret")
    trail.log("test", "demo", "EVENT", {"value": 1})
    snapshot = trail.get_trail()
    snapshot[0]["payload_hash"] = "replaced"
    assert trail.verify_integrity()
    with pytest.raises(SecurityException):
        trail.log("test", "demo", "EVENT", {"value": "Jane Smith"})


def test_api_validation_and_metrics():
    invalid = client.post("/api/audit", json={
        "task_id": "DEMO", "target_identifier": "ANON",
        "primary_metric": 1.0, "attributes": {"note": "MRN: 12345678"}
    })
    assert invalid.status_code == 422
    assert "MRN" not in invalid.text

    response = client.post("/api/audit", json={
        "task_id": "DEMO-OK", "target_identifier": "ANON",
        "primary_metric": 28.0, "secondary_metric": 1.0
    })
    assert response.status_code == 200
    assert response.json()["total_alerts"] == 1

    metrics = client.get("/metrics")
    assert metrics.status_code == 200
    assert metrics.headers["content-type"].startswith("text/plain")
    assert "system_tasks_total" in metrics.text
    assert "phi_outbound_blocks_total" in metrics.text
    assert AuditLogger.verify_integrity() is True


def test_benchmark_examples_are_software_regressions():
    data = json.loads((Path(__file__).parent.parent / "benchmark_dataset.json").read_text())
    supervisor = SystemSupervisor()
    for case in data["test_cases"]:
        if "payload" not in case:
            continue
        dossier = supervisor.process_task(SystemTaskPayload(**case["payload"]))
        assert dossier.overall_urgency.value == case["expected_urgency"]
        assert dossier.integrity_status.value == case["expected_integrity"]
