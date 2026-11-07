#!/usr/bin/env bash
## The host side of the Bitbucket plugin: the CLI on this machine and the dashboard's credential.
## Run by core/scripts/plugins.sh --install bitbucket, and by core/scripts/install.sh for every installed
## plugin that ships one. Idempotent: whatever is already there is reported, not redone.
set -u
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)}";

STATE="$(grep -E '^token:' "${WORKSPACE_ROOT}/core/config/plugin.bitbucket.settings.yml" 2>/dev/null | head -1 | sed -E 's/^[a-z_]+:[[:space:]]*//')";
case "${STATE}" in
  ''|CHANGE_ME|"''"|'""') printf '  ✗ %-16s %s\n' "token" "not set in plugin.bitbucket.settings.yml — the dashboard reads only public repositories on Bitbucket" ;;
  *)                       printf '  ✓ %-16s %s\n' "token" "set (plugin.bitbucket.settings.yml)" ;;
esac

