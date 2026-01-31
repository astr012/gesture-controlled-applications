---
description: Install all dependencies for the project
---

# Install Dependencies

This workflow installs all dependencies for both backend and frontend.

## Backend Setup (Python with uv)

// turbo

1. Create virtual environment with uv:

```shell
cd backend
C:\Python314\python.exe -m uv venv .venv
```

// turbo 2. Install dependencies:

```shell
cd backend
C:\Python314\python.exe -m uv pip install -r requirements.txt --python .venv\Scripts\python.exe
```

3. Verify installation:

```shell
cd backend
.venv\Scripts\python.exe -c "from main import app; print('Backend OK')"
```

## Frontend Setup (Bun with Tailwind CSS)

// turbo 4. Install frontend dependencies:

```shell
cd frontend
bun install
```

5. Verify installation:

```shell
cd frontend
bun run build
```

## Notes

- Backend uses Python 3.14 with `uv` as the package manager
- Frontend uses Bun with Tailwind CSS v4
- Both should be fully functional after this workflow
