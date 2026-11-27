#!/usr/bin/env sh
# Install the OKF tool `okf` (crate okf, W4G1/okf, Apache-2.0) at the version pinned in tools/okf-version, into
# .tools/ (gitignored), where tools/validate.py finds it (ADR-0011). The pin moves only by a pull request that says
# why. Needs a Rust toolchain and crates.io, index.crates.io and static.crates.io reachable (in the sandbox, a
# person allows them: card #440).
set -eu
cd "$(dirname "$0")/.."
version="$(tr -d '[:space:]' < tools/okf-version)"
# The build goes under .tools/ too: in the sandbox /tmp is mounted noexec, where build scripts cannot run.
CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-.tools/target}" cargo install okf --version "=$version" --locked --root .tools
.tools/bin/okf --version
