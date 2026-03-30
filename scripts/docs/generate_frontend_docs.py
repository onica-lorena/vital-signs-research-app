from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
OUTPUT_DIR = PROJECT_ROOT / "docs"
OUTPUT_FILE = OUTPUT_DIR / "frontend_code_documentation.md"

IGNORED_DIRS = {
    "node_modules",
    "dist",
    "build",
    ".git",
    ".idea",
    ".vscode",
    "coverage",
}

INCLUDED_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx",
    ".css", ".scss",
    ".html",
    ".json",
    ".md",
    ".txt",
}

INCLUDED_FILENAMES = {
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "index.html",
}


def should_ignore(path: Path) -> bool:
    return any(part in IGNORED_DIRS for part in path.parts)


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
        ".ts": "ts",
        ".tsx": "tsx",
        ".js": "javascript",
        ".jsx": "jsx",
        ".css": "css",
        ".scss": "scss",
        ".html": "html",
        ".json": "json",
        ".md": "markdown",
        ".txt": "text",
    }
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
    if not FRONTEND_DIR.exists():
        print(f"Folderul nu există: {FRONTEND_DIR}")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(
        [p for p in FRONTEND_DIR.rglob("*") if should_include(p)],
        key=lambda p: str(p.relative_to(FRONTEND_DIR)).lower()
    )

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        f.write("# Documentație cod frontend\n\n")
        f.write("Acest fișier este generat automat.\n\n")

        f.write("## Lista fișierelor incluse\n\n")
        f.write(build_file_tree(FRONTEND_DIR, files))
        f.write("\n\n---\n\n")

        for file_path in files:
            relative_path = file_path.relative_to(FRONTEND_DIR).as_posix()
            language = get_language(file_path)
            content = read_file_content(file_path)

            f.write(f"## {relative_path}\n\n")
            f.write(f"**Cale completă:** `frontend/{relative_path}`\n\n")
            f.write(f"```{language}\n")
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
            f.write("```\n\n---\n\n")

    print(f"Documentația frontend a fost generată cu succes: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()