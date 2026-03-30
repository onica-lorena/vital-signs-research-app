from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
OUTPUT_DIR = PROJECT_ROOT / "docs"
OUTPUT_FILE = OUTPUT_DIR / "backend_code_documentation.md"

IGNORED_DIRS = {
    ".venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".git",
    ".idea",
    ".vscode",
    "alembic/versions/__pycache__",
}

INCLUDED_EXTENSIONS = {
    ".py",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".md",
    ".txt",
    ".sql",
}

INCLUDED_FILENAMES = {
    "requirements.txt",
    "alembic.ini",
    "Dockerfile",
    ".env.example",
}


def should_ignore(path: Path) -> bool:
    normalized_parts = set(path.parts)
    if ".venv" in normalized_parts:
        return True
    if "__pycache__" in normalized_parts:
        return True
    if ".pytest_cache" in normalized_parts:
        return True
    if ".mypy_cache" in normalized_parts:
        return True
    if ".git" in normalized_parts:
        return True
    if ".idea" in normalized_parts:
        return True
    if ".vscode" in normalized_parts:
        return True
    return False


def should_include(file_path: Path) -> bool:
    if should_ignore(file_path):
        return False
    if not file_path.is_file():
        return False
    if file_path.name in INCLUDED_FILENAMES:
        return True
    return file_path.suffix.lower() in INCLUDED_EXTENSIONS


def get_language(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    mapping = {
        ".py": "python",
        ".json": "json",
        ".yml": "yaml",
        ".yaml": "yaml",
        ".toml": "toml",
        ".ini": "ini",
        ".md": "markdown",
        ".txt": "text",
        ".sql": "sql",
    }
    if file_path.name == "Dockerfile":
        return "dockerfile"
    return mapping.get(ext, "")


def build_file_tree(base_dir: Path, files: list[Path]) -> str:
    lines = []
    for file_path in files:
        relative_path = file_path.relative_to(base_dir)
        lines.append(str(relative_path).replace("\\", "/"))
    return "\n".join(f"- {line}" for line in lines)


def read_file_content(file_path: Path) -> str:
    try:
        return file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            return file_path.read_text(encoding="utf-8-sig")
        except Exception:
            return "[Nu s-a putut citi fișierul ca text.]"
    except Exception as exc:
        return f"[Eroare la citire: {exc}]"


def main() -> None:
    if not BACKEND_DIR.exists():
        print(f"Folderul nu există: {BACKEND_DIR}")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(
        [p for p in BACKEND_DIR.rglob("*") if should_include(p)],
        key=lambda p: str(p.relative_to(BACKEND_DIR)).lower()
    )

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        f.write("# Documentație cod backend\n\n")
        f.write("Acest fișier este generat automat.\n\n")

        f.write("## Lista fișierelor incluse\n\n")
        f.write(build_file_tree(BACKEND_DIR, files))
        f.write("\n\n---\n\n")

        for file_path in files:
            relative_path = file_path.relative_to(BACKEND_DIR).as_posix()
            language = get_language(file_path)
            content = read_file_content(file_path)

            f.write(f"## {relative_path}\n\n")
            f.write(f"**Cale completă:** `backend/{relative_path}`\n\n")
            f.write(f"```{language}\n")
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
            f.write("```\n\n---\n\n")

    print(f"Documentația backend a fost generată cu succes: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()