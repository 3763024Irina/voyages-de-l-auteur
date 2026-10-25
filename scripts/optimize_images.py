#!/usr/bin/env python3
"""Compress oversized raster images in-place while keeping their paths stable.

Original image versions remain recoverable through the Git history.
The manifest prevents a previously optimized image being recompressed on
every future push, but changed images are processed again.
"""
from __future__ import annotations

import hashlib
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / ".github" / "image-optimization-manifest.json"
MAX_EDGE = 2400
MIN_BYTES = 450 * 1024
JPEG_QUALITY = 82
SUPPORTED = {".jpg", ".jpeg", ".png"}
EXCLUDED_DIRS = {".git", ".github", ".venv", "node_modules"}
RESAMPLE = Image.Resampling.LANCZOS


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_manifest() -> dict:
    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"version": 1, "images": {}}


def save_manifest(manifest: dict) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def should_skip_dir(path: Path) -> bool:
    return any(part in EXCLUDED_DIRS for part in path.parts)


def compress_image(path: Path, manifest: dict) -> dict | None:
    relative = path.relative_to(ROOT).as_posix()
    if should_skip_dir(path.relative_to(ROOT)) or path.suffix.lower() not in SUPPORTED:
        return None

    original = path.read_bytes()
    before_sha = sha256(original)
    before_size = len(original)
    previous = manifest["images"].get(relative, {})

    # Already handled this exact image; this also makes runs idempotent.
    if previous.get("optimized_sha256") == before_sha:
        return None

    if before_size < MIN_BYTES:
        return None

    try:
        with Image.open(io.BytesIO(original)) as im:
            if getattr(im, "is_animated", False) or getattr(im, "n_frames", 1) > 1:
                return None

            original_size = im.size
            icc_profile = im.info.get("icc_profile")
            im = ImageOps.exif_transpose(im)
            im.thumbnail((MAX_EDGE, MAX_EDGE), RESAMPLE)

            output = io.BytesIO()
            ext = path.suffix.lower()

            if ext in {".jpg", ".jpeg"}:
                if im.mode not in ("RGB", "L"):
                    im = im.convert("RGB")
                im.save(
                    output,
                    format="JPEG",
                    quality=JPEG_QUALITY,
                    optimize=True,
                    progressive=True,
                    subsampling=2,
                    icc_profile=icc_profile,
                )
            else:
                # Keep PNG transparency and file names; use lossless optimization.
                if im.mode not in ("RGB", "RGBA", "L", "LA", "P"):
                    im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
                im.save(output, format="PNG", optimize=True, compress_level=9)

            optimized = output.getvalue()
            after_size = len(optimized)

            # Never replace a file with a larger result.
            if after_size < before_size:
                path.write_bytes(optimized)
                saved = before_size - after_size
                optimized_sha = sha256(optimized)
                result = {
                    "original_size_bytes": before_size,
                    "optimized_size_bytes": after_size,
                    "saved_bytes": saved,
                    "original_dimensions": list(original_size),
                    "optimized_dimensions": list(im.size),
                    "original_sha256": before_sha,
                    "optimized_sha256": optimized_sha,
                }
                manifest["images"][relative] = result
                print(
                    f"OPTIMIZED {relative}: {before_size / 1024:.0f} KB -> "
                    f"{after_size / 1024:.0f} KB "
                    f"({saved / 1024:.0f} KB saved; "
                    f"{original_size[0]}x{original_size[1]} -> {im.width}x{im.height})"
                )
                return result

            # Mark this exact version as examined so future runs don't redo it.
            manifest["images"][relative] = {
                "original_size_bytes": before_size,
                "optimized_size_bytes": before_size,
                "saved_bytes": 0,
                "original_dimensions": list(original_size),
                "optimized_dimensions": list(im.size),
                "original_sha256": before_sha,
                "optimized_sha256": before_sha,
            }
            print(f"UNCHANGED {relative}: optimized output was not smaller")
            return None

    except (OSError, UnidentifiedImageError, ValueError) as exc:
        print(f"SKIPPED {relative}: {exc}", file=sys.stderr)
        return None


def main() -> int:
    manifest = load_manifest()
    total_saved = 0
    optimized_count = 0
    candidates = sorted(
        p for p in ROOT.rglob("*")
        if p.is_file()
        and p.suffix.lower() in SUPPORTED
        and not should_skip_dir(p.relative_to(ROOT))
    )
    for path in candidates:
        result = compress_image(path, manifest)
        if result:
            optimized_count += 1
            total_saved += result["saved_bytes"]

    save_manifest(manifest)
    print(
        f"\nFinished: optimized {optimized_count} image(s); "
        f"saved {total_saved / (1024 * 1024):.2f} MiB."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
