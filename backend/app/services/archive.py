"""Bounded extraction of supported documents from a ZIP upload."""

from pathlib import Path, PurePosixPath
from stat import S_ISLNK
from zipfile import BadZipFile, ZipFile

from app.services.document_processing import ALLOWED_EXTENSIONS

MAX_ARCHIVE_FILES = 1000
MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
MAX_EXPANDED_BYTES = 500 * 1024 * 1024
MAX_DOCUMENT_BYTES = 25 * 1024 * 1024


class ArchiveValidationError(ValueError):
    def __init__(self, message: str, status_code: int = 422):
        super().__init__(message)
        self.status_code = status_code


def extract_documents(archive: Path, destination: Path) -> tuple[list[Path], list[str]]:
    """Extract supported entries without trusting archive paths or declared sizes."""
    documents: list[Path] = []
    skipped: list[str] = []
    expanded = 0
    try:
        with ZipFile(archive) as zipped:
            entries = [entry for entry in zipped.infolist() if not entry.is_dir()]
            if len(entries) > MAX_ARCHIVE_FILES:
                raise ArchiveValidationError(
                    f"ZIP files may contain at most {MAX_ARCHIVE_FILES} files", 413
                )
            for index, entry in enumerate(entries):
                name = entry.filename.replace("\\", "/")
                parts = PurePosixPath(name).parts
                if (
                    not parts
                    or name.startswith("/")
                    or any(part in (".", "..") for part in parts)
                    or ":" in parts[0]
                ):
                    raise ArchiveValidationError(f"Unsafe path in ZIP: {entry.filename}")
                if S_ISLNK(entry.external_attr >> 16):
                    raise ArchiveValidationError(f"ZIP contains a symbolic link: {entry.filename}")
                if entry.flag_bits & 1:
                    raise ArchiveValidationError("Password-protected ZIP files are not supported")
                filename = parts[-1]
                if len(filename.encode("utf-8")) > 255:
                    raise ArchiveValidationError(f"Filename is too long in ZIP: {entry.filename}")
                if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
                    skipped.append(entry.filename)
                    continue
                if entry.file_size == 0:
                    skipped.append(entry.filename)
                    continue
                if entry.file_size > MAX_DOCUMENT_BYTES:
                    raise ArchiveValidationError(
                        f"{entry.filename} exceeds the 25 MB document limit", 413
                    )
                if expanded + entry.file_size > MAX_EXPANDED_BYTES:
                    raise ArchiveValidationError(
                        "ZIP contents exceed the 500 MB expanded limit", 413
                    )
                target = destination / str(index) / filename
                target.parent.mkdir(parents=True)
                with zipped.open(entry) as source, target.open("wb") as output:
                    size = 0
                    while chunk := source.read(1024 * 1024):
                        size += len(chunk)
                        expanded += len(chunk)
                        if size > MAX_DOCUMENT_BYTES or expanded > MAX_EXPANDED_BYTES:
                            raise ArchiveValidationError(
                                "ZIP contents exceed the upload size limits", 413
                            )
                        output.write(chunk)
                documents.append(target)
    except BadZipFile as error:
        raise ArchiveValidationError("Invalid ZIP file") from error
    except (NotImplementedError, RuntimeError) as error:
        raise ArchiveValidationError("Unsupported ZIP compression") from error
    if not documents:
        raise ArchiveValidationError("ZIP contains no supported, nonempty documents")
    return documents, skipped
