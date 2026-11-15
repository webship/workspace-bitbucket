---
name: bitbucket-forge
description: Work with Bitbucket Cloud from a Webship Workspace through the Bitbucket plugin (`@webship.co/workspace-bitbucket`) — what the BITBUCKET menu of a project row does and the REST call or page behind each entry, the keys of `plugin.bitbucket.settings.yml` and the app password they hold, and why a pull request is opened on Bitbucket's own page. Use when asked to "list the open pull requests of this project", "open a pull request from this branch on Bitbucket", "why is there no BITBUCKET menu on this project", "set the Bitbucket credential of the dashboard", "the issues list shows an error", or when a project of the workspace has its git remote on bitbucket.org.
argument-hint: '<project> [pull requests | credential]'
---

# bitbucket-forge

Bitbucket Cloud for a project of a Webship Workspace (`~/workspace`, container-based, DDEV by
default). It comes with the Bitbucket plugin (`@webship.co/workspace-bitbucket`), a provider of the
forge family (`@webship.co/workspace-forge`), like the agent `bitbucket-pr-preparer`, the command
`/bitbucket-status` and the prompt `bitbucket-branch-to-pr`.

Bitbucket has no command-line tool of its own. The plugin reads with the REST API and opens
Bitbucket's own pages; from a terminal, `git` and `curl` do the same.

## What the plugin puts on the dashboard

A project gets the BITBUCKET menu when it has its own `.git` and one of its remotes (`origin`
first) is on the plugin's host. Each entry, and what is behind it:

| Menu entry | What it does | Behind it |
| --- | --- | --- |
| **Open the repository** | Opens the repository page | `https://bitbucket.org/<workspace>/<repository>` |
| **Open issues** | Asks for the open issues and shows them, or the error, in a modal | `https://api.bitbucket.org/2.0/repositories/<workspace>/<repository>/issues` |
| **Open pull requests** | Lists up to 20 open pull requests in a modal | `https://api.bitbucket.org/2.0/repositories/<workspace>/<repository>/pullrequests?state=OPEN&pagelen=20` |
| **New pull request** from the current branch | Opens Bitbucket's new-pull-request page for the branch | `https://bitbucket.org/<workspace>/<repository>/pull-requests/new?source=<branch>&t=1` |
| **New issue** | Opens the new-issue page of the repository | `https://bitbucket.org/<workspace>/<repository>/issues/new` |
| **Copy the clone URL** | Copies `https://bitbucket.org/<workspace>/<repository>.git` | `git remote get-url origin` shows the one the project was cloned with |

The card of the project also carries a chip with `<workspace>/<repository>` that links to the
repository, and the New folder form offers **Clone a repository into this folder**
(`<workspace>/<repository>`, or a clone URL).

No menu on a project means one of: the project has no `.git` of its own, none of its remotes is on
the host in `host:`, or the plugin is not activated and installed.

```bash
cd ~/workspace/<folder>/<project>
git remote -v                                       # is a remote on bitbucket.org?
cd ~/workspace && bash core/scripts/plugins.sh --list     # bitbucket: ready?
```

## Turn it on

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require @webship.co/workspace-bitbucket
bash core/scripts/plugins.sh --activate bitbucket --with-needs     # adds the AI folders its items land in
bash core/scripts/plugins.sh --install bitbucket
bash core/scripts/plugins.sh --configure bitbucket                 # core/config/plugin.bitbucket.settings.yml, from the template
```

The same four steps are buttons on the page Settings → Plugins of the dashboard. The plugin needs
no command on the machine beyond `git` and `curl`.

## The settings: `core/config/plugin.bitbucket.settings.yml`

| Key | What it is |
| --- | --- |
| `host:` | `bitbucket.org` (Bitbucket Cloud). The menu is drawn for remotes on this host. |
| `username:` | The Bitbucket username, not the email address. |
| `email:` | The address commits pushed there carry. |
| `token:` | An app password with read on repositories, issues and pull requests. |

The dashboard sends `username:` and `token:` together as basic authentication; one without the
other is no credential. With no credential the lists still answer for a public repository and say
"no credential"; a private repository answers an error.

The file is created mode 600 and the app password is masked on the Settings page. Never print it,
never copy it into another file, and never commit the file.

## Read a repository from a terminal

For a public repository, the call the dashboard makes, without a credential. It only reads:

```bash
curl -sS "https://api.bitbucket.org/2.0/repositories/<workspace>/<repository>/pullrequests?state=OPEN&pagelen=20"
```

The answer is JSON: `values` holds the pull requests, each with its `id`, `title`, `state` and
`links.html.href`.

## Open a pull request from the branch

```bash
cd ~/workspace/<folder>/<project>
git push -u origin <branch>
```

Then open `https://bitbucket.org/<workspace>/<repository>/pull-requests/new?source=<branch>&t=1`,
which is what the menu entry opens. For the title and a description that ends with the Checkpoints
list, hand over to the agent `bitbucket-pr-preparer`, or start a session with the prompt
`bitbucket-branch-to-pr`.

## Traps

- **The issues list shows "Functionality has been deprecated"**: Bitbucket Cloud answers that (HTTP
  410, its change CHANGE-3071) for the issues call, also on a public repository. The pull requests
  list is not affected.
- **A username without an app password**, or the other way round: the dashboard sends no
  credential at all.
- **The account's email address in `username:`**: Bitbucket wants the username.
- **A remote on another forge** (GitHub, GitLab) gets that forge's plugin and its menu, not this one.
