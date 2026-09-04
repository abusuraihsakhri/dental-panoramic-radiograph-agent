# Dental Panoramic Radiograph Agent

> **Domain:** Diagnostic Radiology & Medical Imaging AI
> **Standards:** ACR RADS, Fleischner Society, FDI World Dental Federation Notation

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?logo=fastapi&logoColor=white)
![Audit Trail](https://img.shields.io/badge/Audit-HMAC--SHA256_Tamper--Evident-brightgreen.svg)
![Zero-PHI Guard](https://img.shields.io/badge/Guard-Zero--PHI_Outbound-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)

</div>

---

## Overview

Dental Panoramic Radiograph Agent is an enterprise-grade analytical engine for dental imaging analysis. It provides multi-agent evaluation of dental metrics with cryptographic audit trails, PHI outbound protection, and a FastAPI REST interface.

The system employs specialized worker agents that evaluate dental measurements against clinical reference standards, producing consensus dossiers with tamper-evident HMAC-SHA256 audit logging.

---

## Architecture

```
dental-panoramic-radiograph-agent/
├── agents/                    # Core supervisor/worker architecture
│   ├── api.py                 # FastAPI REST endpoints
│   ├── base.py                # Security, PHI guard, HMAC audit trail
│   ├── models.py              # Pydantic data models
│   ├── supervisor.py          # Multi-agent orchestrator
│   ├── workers.py             # Specialized evaluation workers
│   ├── llm_factory.py         # LLM provider abstraction
│   ├── learning.py            # Bayesian calibration engine
│   ├── metrics.py             # Prometheus metrics exporter
│   └── streamer.py            # WebSocket telemetry broadcaster
├── dent_scan_ai/              # DentScan-AI FDI tooth numbering engine
│   ├── agents.py              # FDI sub-agents (caries, bone resorption)
│   ├── engine.py              # Core domain evaluation engine
│   ├── models.py              # Frontier data models
│   ├── cli.py                 # DentScan CLI interface
│   └── server.py              # DentScan FastAPI server
├── tests/                     # Pytest test suite
├── web/                       # Operations console (HTML/JS)
├── cli.py                     # Main CLI entry point
├── enrichment.py              # Extended domain analysis agents
├── simulator.py               # High-throughput stress testing
└── Dockerfile                 # Container deployment
```

---

## Key Features

- **Multi-Agent Evaluation:** Specialized workers (InvariantQC, SafetyEscalation, ProtocolConformance) evaluate payloads independently
- **Zero-PHI Outbound Guard:** AST and regex inspection blocking SSNs, MRNs, phone numbers, emails, and patient identifiers
- **HMAC-SHA256 Audit Trail:** Cryptographically chained, tamper-evident logs for every evaluation
- **FastAPI REST API:** OpenAPI 3.1 endpoints for audit, chat, and metrics
- **Prometheus Telemetry:** Operational metrics export at `/metrics`
- **Batch Processing:** CSV-based batch evaluation with error handling
- **Docker Support:** Ready-to-deploy container configuration

---

## Installation

```bash
# Clone the repository
git clone https://github.com/abusuraihsakhri/dental-panoramic-radiograph-agent.git
cd dental-panoramic-radiograph-agent

# Install dependencies
pip install fastapi uvicorn pydantic pytest
```

---

## Usage

### CLI Commands

```bash
# Run single task evaluation
python cli.py audit --task-id TASK-001 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT

# Interactive chat query
python cli.py chat "What is the system status?"

# Batch process CSV records
python cli.py batch -i sample.csv -o results.csv

# Verify audit trail integrity
python cli.py verify-audit

# Launch REST API server
python cli.py serve --host 127.0.0.1 --port 8000
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| POST | `/api/audit` | Submit task for evaluation |
| POST | `/api/chat` | Supervisory chat query |
| GET | `/api/audit/logs` | Retrieve audit trail |

### Example API Request

```bash
curl -X POST http://localhost:8000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "TASK-001",
    "target_identifier": "TARGET-01",
    "primary_metric": 28.5,
    "secondary_metric": 14.2,
    "status_descriptor": "DISCORDANT",
    "is_critical_flag": true
  }'
```

---

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `AUDIT_SECRET_KEY` | HMAC signing key for audit trail | Auto-generated (ephemeral) |
| `MODEL_PROVIDER` | LLM provider (`mock`, `ollama`, `claude`, `openai`) | `mock` |

> **Security Note:** Always set `AUDIT_SECRET_KEY` in production to ensure audit trail persistence across restarts.

---

## Testing

```bash
# Run full test suite
pytest -v

# Run with coverage
pytest -v --cov=agents --cov=dent_scan_ai

# Run simulation benchmark
python simulator.py 1000
```

---

## Docker Deployment

```bash
# Build and run
docker build -t dental-panoramic-radiograph-agent .
docker run -p 8000:8000 -e AUDIT_SECRET_KEY=your-secret-key dental-panoramic-radiograph-agent

# Or use docker-compose
docker-compose up -d
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.
