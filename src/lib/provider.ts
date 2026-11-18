/**
 * Bitbucket Cloud, as a forge provider. The REST API does the lists with the username and app
 * password from plugin.bitbucket.settings.yml; there is no CLI, so a new pull request opens
 * Bitbucket's own page for the branch.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import type { PluginApi, PluginLib } from '@webship.co/workspace-plugin-api';
import { repoPathAt } from '@webship.co/workspace-forge';
import type { ForgeItem, ForgeProvider } from '@webship.co/workspace-forge';

const configured = (v: unknown) => { const s = String(v == null ? '' : v).trim(); return s && s !== 'CHANGE_ME' ? s : null; };

/**
 * Run `fn` with curl arguments that read these header lines from a file only this user can read, removed
 * after. On curl's command line a token is readable by every account of the machine for as long as curl
 * runs (`ps`, /proc/<pid>/cmdline); `-H @file` (curl 7.55+) keeps it off.
 */
export async function withHeaderFile<T>(headers: string[], fn: (args: string[]) => Promise<T>): Promise<T> {
  if (!headers.length) return fn([]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-curl-'));
  const file = path.join(dir, 'headers');
  fs.writeFileSync(file, `${headers.join('\n')}\n`, { mode: 0o600 });
  try { return await fn(['-H', `@${file}`]); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}


export function bitbucketProvider(api: PluginApi): ForgeProvider {
  const settings = () => api.settings.read() || {};
  const host = () => String(configured(settings().host) || 'bitbucket.org').toLowerCase();

  const env = (): NodeJS.ProcessEnv | null => {
    const u = configured(settings().username); const t = configured(settings().token);
    return u && t ? { ...process.env, BITBUCKET_USERNAME: u, BITBUCKET_APP_PASSWORD: t } : null;
  };

  async function rest(lib: PluginLib, e: NodeJS.ProcessEnv, url: string): Promise<any> {
    // The app password in a header file, never on curl's command line (withHeaderFile): `-u user:password` was.
    const secret = e.BITBUCKET_USERNAME && e.BITBUCKET_APP_PASSWORD
      ? [`Authorization: Basic ${Buffer.from(`${e.BITBUCKET_USERNAME}:${e.BITBUCKET_APP_PASSWORD}`).toString('base64')}`] : [];
    const out = await withHeaderFile(secret, (auth) => lib.run('curl', ['-sS', '-m', '30', ...auth, url], process.env.HOME, { timeoutMs: 40 * 1000, env: process.env }));
    if (!out.ok) throw new Error(lib.cliError(String(out.stderr || out.stdout)));
    const data = JSON.parse(String(out.stdout));
    if (data && data.error) throw new Error(String((data.error && data.error.message) || data.error));
    return data;
  }

  const apiBase = () => `https://api.${host()}/2.0/repositories`;

  return {
    id: 'bitbucket',
    label: 'BITBUCKET',
    title: 'Bitbucket',
    host,
    pullsLabel: 'Pull requests',
    env,
    auth: () => { const s = settings(); return { username: configured(s.username) || undefined, email: configured(s.email) || undefined, how: configured(s.token) ? 'app password' : 'none' }; },
    repoOf: (url, remote) => { const p = repoPathAt(host(), url); return p ? { path: p, web: `https://${host()}/${p}`, remote } : null; },
    cloneUrl: (spec) => (/^(https?:\/\/|git@)/.test(spec) ? spec : `https://${host()}/${spec.replace(/\.git$/, '')}.git`),
    urls: (repo) => ({ issues: `${repo.web}/issues`, pulls: `${repo.web}/pull-requests/`, newIssue: `${repo.web}/issues/new`, newPull: (branch) => `${repo.web}/pull-requests/new?source=${encodeURIComponent(branch)}&t=1` }),
    listIssues: async (repo, lib, e) => {
      let data: any;
      try {
        data = await rest(lib, e, `${apiBase()}/${repo.path}/issues?pagelen=20&sort=-updated_on&q=${encodeURIComponent('state="new" OR state="open"')}`);
      } catch (err) {
        // Bitbucket Cloud retired the issues call (HTTP 410, CHANGE-3071), for public repositories too (#5): say what
        // that means and where the issues are, rather than its own "Functionality has been deprecated".
        if (/CHANGE-3071|has been deprecated/i.test(String((err as Error).message || err))) {
          throw new Error(`Bitbucket Cloud no longer lists issues through its API (CHANGE-3071), so they cannot be shown here. Open them on the repository: ${repo.web}/issues`);
        }
        throw err;
      }
      return ((data && data.values) || []).map((i: any): ForgeItem => ({ number: i.id, title: i.title, url: i.links && i.links.html && i.links.html.href, author: i.reporter && (i.reporter.nickname || i.reporter.display_name), updated: i.updated_on, state: i.state }));
    },
    listPulls: async (repo, lib, e) => {
      const data = await rest(lib, e, `${apiBase()}/${repo.path}/pullrequests?state=OPEN&pagelen=20`);
      return ((data && data.values) || []).map((i: any): ForgeItem => ({ number: i.id, title: i.title, url: i.links && i.links.html && i.links.html.href, author: i.author && (i.author.nickname || i.author.display_name), updated: i.updated_on }));
    },
    clone: { pattern: /^[\w.-]+\/[\w.-]+$|^(https?:\/\/|git@)[\w.@-]+[:/][\w./-]+$/, placeholder: 'workspace/repository', help: 'A Bitbucket repository is workspace/name, or its clone URL.' },
    tokenHint: 'username and token (an app password) in core/config/plugin.bitbucket.settings.yml',
  };
}
