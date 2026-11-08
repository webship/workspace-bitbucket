# @webship.co/workspace-bitbucket

Bitbucket for the [Webship Workspace](https://github.com/webship/workspace) dashboard: the **BITBUCKET**
menu on every project whose git remote is on Bitbucket (open the repository, the open issues and
pull requests, open one from the current branch, copy the clone URL), the repository chip on the
card, "Clone a repository" when a new folder is made, and the credential the dashboard uses for the
host. A provider of [`@webship.co/workspace-forge`](https://github.com/webship/workspace-forge).

The lists come from the Bitbucket Cloud REST API (`/2.0/repositories/<workspace>/<repo>/issues`, `/pullrequests?state=OPEN`) with the username and app password as basic auth. Bitbucket has no CLI, so "New pull request" opens Bitbucket's own page for the current branch.

## Use it

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require github:webship/workspace-bitbucket
bash core/scripts/plugins.sh --activate bitbucket
bash core/scripts/plugins.sh --install bitbucket      # carries the git.bitbucket block of settings.yml into plugin.bitbucket.settings.yml
bash core/scripts/plugins.sh --configure bitbucket
```

The same four steps are buttons on the dashboard's **Settings → Plugins** page.

## What the package holds

| Path | What it is |
| --- | --- |
| `src/index.ts` | `register(api)`: `registerForge(api, bitbucketProvider(api))` |
| `src/lib/provider.ts` | The Bitbucket provider: the host, the credential, how a remote reads, the pages, the issue and request lists, the clone URL |
| `config/plugin.bitbucket.settings.yml` | The settings template |
| `scripts/host-install.sh` | The host side: the CLI and the credential check |

The `workspacePlugin` block in `package.json` is the manifest the installer reads.
