# Dental Panoramic Radiograph Agent

### [Open the Live Application →](https://abusuraihsakhri.github.io/dental-panoramic-radiograph-agent/)

This repository currently implements **synthetic rule-evaluation demonstrations**, not panoramic radiograph interpretation. It has two Python command-line/API implementations and a self-contained browser demonstration. **No code in this repository reads radiographic image pixels, detects caries, localizes teeth, measures bone loss, or produces validated clinical findings.**

## What works

- **Browser rules demo** (`web/index.html`): enter synthetic task metrics, optionally validate a two-digit **permanent** FDI tooth code, inspect a structured local result, and export JSON. Runs without a backend.
- **Python supervisor** (`cli.py`, `agents/`): evaluate fixed *demo* thresholds (primary >25, secondary >12), flagged priority and discordance keywords; return a structured dossier with a signed in-memory audit chain.
- **Secondary Python evaluator** (`dent_scan_ai/`): separate rules engine (primary >25, secondary >10), CLI and optional FastAPI interface. Agent class names are placeholders, not trained image-analysis models.
- **Batch CLI**: read a CSV of synthetic values and export a result CSV.
- **API**: health, rule evaluation, mock supervisory chat, Prometheus text metrics, and in-memory audit entries.

The demo thresholds are arbitrary software examples; **they are not dental reference ranges, diagnostic cutoffs, FDI criteria, or emergency-triage rules**. The `enrichment.py` modules are threshold-based stubs, not functioning CBCT, cephalometric, cancer detection, or treatment-planning systems.

## Try it in a browser

Open the [verified live browser application](https://abusuraihsakhri.github.io/dental-panoramic-radiograph-agent/) or open `web/index.html` locally. No Python, service or model is required for the web demo. Inputs remain in the browser tab; nothing is transmitted and no browser storage is used. Exporting JSON is explicitly initiated by the user.

This project is not suitable for clinical decisions. Use **synthetic, de-identified demonstration data only**.

## Local Python setup

Requires Python 3.10 or later.

```bash
git clone https://github.com/abusuraihsakhri/dental-panoramic-radiograph-agent.git
cd dental-panoramic-radiograph-agent
python -m pip install -e ".[api,test]"
python cli.py audit --task-id DEMO-001 --target ANON-01 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT
python cli.py batch -i sample.csv -o results.csv
python cli.py verify-audit
python cli.py serve --host 127.0.0.1 --port 8000
```

The separate packaged CLI remains available as `dental-panoramic-radiograph-engine` (implemented by `dent_scan_ai.cli`, not the top-level `cli.py`).

```bash
dental-panoramic-radiograph-engine audit --task-id DEMO-002 --primary 29 --secondary 11
```

## API and Docker

The main backend (started using top-level `cli.py`) exposes:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Application status |
| `POST /api/audit` | Submit synthetic metrics for rule evaluation |
| `POST /api/chat` | Offline mock reply; does not call an LLM |
| `GET /metrics` | Prometheus plaintext counters |
| `GET /api/audit/logs` | In-memory HMAC audit chain and integrity result |
| `GET /docs` / `GET /openapi.json` | FastAPI-generated API documentation |

```bash
curl -s http://127.0.0.1:8000/health
python -m pytest -q
node --test tests/test_web.cjs
```

For Docker Compose, generate a fresh signing key and put it in an untracked `.env` file. The signing key is **required** by the Compose configuration:

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
# Paste the resulting random value into AUDIT_SECRET_KEY= in .env
docker compose up --build
```

**Rotation notice:** An earlier public revision included a fixed signing key in Compose. If that key was ever deployed, treat it as disclosed and replace it with a newly generated random key. Compose maps port 8000 to localhost by default. Do not expose this unauthenticated prototype API directly to the internet. `AUDIT_SECRET_KEY` is used for HMAC integrity, not for encryption or access control. Without a stable key, standalone Python runs generate an ephemeral key.

## Security, privacy and limitations

- PHI detection is heuristic, regex-based and incomplete; **it does not establish HIPAA compliance, de-identification, confidentiality or a zero-PHI guarantee**. Do not enter clinical records or identifying data.
- Audit entries and evaluation history reside only in process memory. A restart clears them, even when the HMAC key remains the same. Entries can be verified for modification within the active process but are not persisted or externally anchored.
- The default mock LLM provider does not perform clinical reasoning. Other provider names currently use the same mock implementation.
- The API has no authentication or rate limiting. Keep it on a trusted machine or place it behind an authenticated gateway.
- Python services require a server and cannot run directly on GitHub Pages. The static browser demonstration uses JavaScript rather than Pyodide because it does not require Python libraries.
- The browser works in current versions of major desktop and mobile browsers with JavaScript enabled. Clinical accuracy and accessibility conformance have not been independently validated.
- Existing image-centric classes are placeholders. No trained imaging model, clinical dataset validation, sensitivity/specificity estimates or regulatory clearance is provided.

## License

MIT — see [LICENSE](LICENSE).
