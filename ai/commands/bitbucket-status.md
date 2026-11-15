---
description: Show where a Webship Workspace project stands on Bitbucket — its repository, the branch it is on, and the open pull requests of a public repository. Read-only; nothing is created or changed.
argument-hint: '<project>'
---

# /bitbucket-status

Show where this project stands on Bitbucket: `$ARGUMENTS`

The argument is one word: the project, which is its folder name in a workspace folder. With no
project, stop and ask for one.

The workspace is container-based (DDEV by default); `git` and `curl` run on the machine. This
command only reads: push nothing, and never read or print the `token:` line of
`core/config/plugin.bitbucket.settings.yml`.

## 1. Find the project and its repository

```bash
ls -d ~/workspace/*/<project>/.git
cd ~/workspace/<folder>/<project>
git remote get-url origin
git branch --show-current
```

The remote reads `https://bitbucket.org/<workspace>/<repository>.git` or
`git@bitbucket.org:<workspace>/<repository>.git`. If there is no `.git`, or the remote is not on
bitbucket.org, stop and say so: the BITBUCKET menu of the Bitbucket plugin
(`@webship.co/workspace-bitbucket`) is not on this project either.

## 2. Open pull requests

```bash
curl -sS "https://api.bitbucket.org/2.0/repositories/<workspace>/<repository>/pullrequests?state=OPEN&pagelen=20"
```

The answer is JSON. `values` is the list; an answer with `"type": "error"` means the repository is
private or does not exist: say so, and say that the BITBUCKET menu of the project on the dashboard
lists them with the credential of the settings file.

## 3. Report

In this order: the repository (`<workspace>/<repository>`), the branch the project is on, then one
line per open pull request (`#<id> <title>`, its author, the date it was updated), and the address
of the page that opens a pull request from the current branch:
`https://bitbucket.org/<workspace>/<repository>/pull-requests/new?source=<branch>&t=1`

A list that is empty is a result: say "no open pull requests". For preparing a pull request, hand
over to the agent `bitbucket-pr-preparer`.
