Take the current branch of a project on Bitbucket up to its pull request, with the Checkpoints list.

```
claude --permission-mode bypassPermissions """
Prepare the pull request of the current branch of the project <project> on Bitbucket
# ~/workspace/<folder>/<project> · container-based (DDEV by default) · git and curl run on the machine
# Bitbucket has no command-line tool: you push the branch and write the text, I open the page
# never read or print the app password; never tick "Reviewed by a human" or "Code review by maintainers"

1. cd ~/workspace/<folder>/<project> ; git status --short ; git branch --show-current ; git remote get-url origin
   stop if the remote is not on bitbucket.org, or if the branch is the default branch
2. git log --oneline origin/<base>..HEAD
   tell me in three lines what the branch changes
3. run the tests the project has
   if ../cmd-tools-testing.sh and cucumber.js are both there, also run from the folder above:
   bash cmd-tools-testing.sh <project> --run
   and keep the totals it prints; if they are not there, say so and do not invent a test run
4. git push -u origin <the branch>
5. write the title and the description to a file: the issue it answers, what changed, how it was
   tested with the real numbers, AI-Generated: Yes, and the Checkpoints list as the last section,
   ticked only for what is done

Then give me the file and this address, with the names filled in:
https://bitbucket.org/<workspace>/<repository>/pull-requests/new?source=<branch>&t=1
"""
```

The text between the triple quotes is plain: it can be given to another AI command-line assistant as it is.
