# Contributing

## Development Setup

```bash
# Clone and enter project
git clone https://github.com/monurajj/Satellite-Based-Precision-Agriculture.git
cd Satellite-Based-Precision-Agriculture

# Python (ML pipeline)
python -m venv venv && source venv/bin/activate
pip install -r requirements-minimal.txt

# Web app
cd crop-prediction-webapp/backend && npm install
cd ../frontend && npm install
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change, no behavior change |
| `test:` | Tests |
| `chore:` | Build, tooling, deps |

**Examples:**
```
feat: add persistent prediction history (JSON + localStorage)
fix: pie chart clipping in Share by Crop
docs: update README with quickstart
refactor: extract LocationWeather component
```

## Code Style

- **Python:** Follow PEP 8; use type hints where helpful.
- **JavaScript:** ESLint/Prettier if configured.
- **Modular structure:** Keep `src/` modules focused (one responsibility).

## Pull Requests

1. Branch from `main` (e.g. `feat/my-feature`).
2. Run `python main.py` and web app to verify.
3. Keep changes small and focused.
4. Use descriptive PR titles.
