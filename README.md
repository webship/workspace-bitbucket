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
bash core/scripts/plugins.sh --activate bitbucket --with-needs
bash core/scripts/plugins.sh --install bitbucket      # carries the git.bitbucket block of settings.yml into plugin.bitbucket.settings.yml
bash core/scripts/plugins.sh --configure bitbucket
```

The same four steps are buttons on the dashboard's **Settings → Plugins** page.

## The items it carries

The workspace is container-based (DDEV by default). Each item lands in the folder of its kind, when
that folder is an active workspace folder, is listed there like any other item, and is installed
into Claude Code from there:

| What | Lands in | What it is for |
| --- | --- | --- |
| The agent `bitbucket-pr-preparer` | `ai-agents/` | Takes a branch up to its pull request the Webship way: the push, the title and a description with the Checkpoints list last, and the address of Bitbucket's new-pull-request page |
| The skill `bitbucket-forge` | `ai-skills/` | What each entry of the BITBUCKET menu does and the REST call or page behind it, the keys of `plugin.bitbucket.settings.yml` |
| The command `/bitbucket-status` | `ai-commands/` | `/bitbucket-status <project>`: the repository, the branch, the open pull requests of a public repository. Read-only |
| The prompt `bitbucket-branch-to-pr` | `ai-prompts/` | The launch command of a session that prepares the pull request of the current branch |

The plugin places no `cmd-*.sh`: Bitbucket has no command-line tool to wrap, and the plugin itself opens a pull request on Bitbucket's own page. The item bodies are plain Markdown any AI command-line assistant can follow; Claude Code is the default shape (frontmatter, the launch command of the prompt). A project that carries a webship-js suite is tested by the workspace's own `cmd-tools-testing.sh <project> --run`, which the agent and the prompt use when it is there.

How the items are laid out and checked: [docs/plugin-items-pattern.md](docs/plugin-items-pattern.md).

## What it needs

It needs the AI folders its items are placed in (`needs`): `ai-agents`, `ai-skills`, `ai-commands` and `ai-prompts`. `--require` says so, `--activate` and `--install` stop until the workspace has them, and `--with-needs` adds what is missing first. A kind whose folder is not an active workspace folder is skipped, and the install says so.

## What the package holds

| Path | What it is |
| --- | --- |
| `src/index.ts` | `register(api)`: `registerForge(api, bitbucketProvider(api))` |
| `src/lib/provider.ts` | The Bitbucket provider: the host, the credential, how a remote reads, the pages, the issue and request lists, the clone URL |
| `config/plugin.bitbucket.settings.yml` | The settings template |
| `scripts/host-install.sh` | The host side: the CLI and the credential check |
| `ai/agents/bitbucket-pr-preparer.md` | The agent `bitbucket-pr-preparer` |
| `ai/skills/bitbucket-forge/` | The skill `bitbucket-forge` |
| `ai/commands/bitbucket-status.md` | The command `/bitbucket-status` |
| `ai/prompts/bitbucket-branch-to-pr.md` | The prompt `bitbucket-branch-to-pr` |
| `tests/items.test.ts` | The shape of every item, and that it names nothing the plugin does not have |

The `workspacePlugin` block in `package.json` is the manifest the installer reads.
