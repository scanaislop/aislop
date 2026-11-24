"""Exercise the packaged Python engine through a built aislop CLI."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def verify(cli, project):
    empty_bin = project / "empty-bin"
    empty_bin.mkdir()
    env = {
        **os.environ,
        "PATH": str(empty_bin),
        "RUFF_CACHE_DIR": str(project / ".cache"),
    }
    assert shutil.which("ruff", path=env["PATH"]) is None
    node = shutil.which("node")
    assert node, "Install Node to run the CLI fixture"

    def run(*args, accepted=(0,)):
        result = subprocess.run(
            [node, cli, *args],
            cwd=project,
            check=False,
            env=env,
            capture_output=True,
            encoding="utf-8",
        )
        assert result.returncode in accepted, (result.stderr, result.stdout)
        return result.stdout

    def scan():
        report = json.loads(run("scan", ".", "--json", accepted=(0, 1)))
        assert not report["engines"]["lint"]["skipped"]
        return {item["rule"]: item for item in report["diagnostics"]}

    (project / "requirements.txt").write_text("httpx\n")
    config = project / "ruff.toml"
    config.write_text('target-version = "py315"\n')
    source = project / "example.py"
    body = '\n\ndef load_zone():\n    return httpx, ZoneInfo("UTC"), unknown_zone\n'
    expected = "from zoneinfo import ZoneInfo\n\nimport httpx\n" + body
    source.write_text("import httpx\nimport os\nfrom zoneinfo import ZoneInfo\n" + body)
    before = scan()
    assert {"ruff/I001", "ruff/F401", "ruff/F821"} <= before.keys(), before
    assert "ruff/unsupported-rules" not in before
    assert not before["ruff/F821"]["fixable"]
    run("fix", ".")
    assert source.read_text() == expected, source.read_text()
    after = scan()
    assert {key for key in after if key.startswith("ruff/")} == {"ruff/F821"}, after
    source.write_text(expected.replace(", unknown_zone", ""))
    assert not any(key.startswith("ruff/") for key in scan())

    source.write_text(
        "def read():\n    unused = 1\n    return {1: 2, 1: 3}\n"
        "\ndef read():\n    try:\n        return 3\n    except Exception:\n        pass\n"
    )
    rules = scan()
    assert {
        "ruff/F601",
        "ruff/F811",
        "ruff/F841",
        "ai-slop/python-broad-except",
    } <= rules.keys(), rules

    source.write_text("import ghostlib\n\ndef load():\n    return ghostlib\n")
    assert "ghostlib" in scan()["ai-slop/hallucinated-import"]["message"]

    config.write_text('[lint]\nselect = ["F821", "E501"]\n')
    source.write_text("def answer():\n    return( missing_name )\n")
    rules = scan()
    assert "E501" in rules["ruff/unsupported-rules"]["message"]
    assert {"python-formatting", "ruff/F821"} <= rules.keys()
    run("fix", ".")
    assert source.read_text() == "def answer():\n    return missing_name\n"
    config.write_text('[lint]\nselect = ["F821", "E501"]\nignore = ["E501"]\n')
    assert "ruff/unsupported-rules" not in scan()

    config.write_text('[lint]\nextend-select = ["NOT_A_RULE"]\n')
    assert "ruff/engine-error" in scan()
    print(
        f"Passed scan, fix, rescan, six lint rules, native checks, and config diagnostics on {sys.platform}."
    )


if __name__ == "__main__":
    installed_cli = Path(sys.argv[1]).resolve(strict=True)
    with tempfile.TemporaryDirectory() as project:
        verify(installed_cli, Path(project))
