/**
 * Open issues says Bitbucket retired the call, and where the issues are (#5).
 *
 * Bitbucket Cloud answers the issues call with HTTP 410, "CHANGE-3071 - Functionality has been deprecated", also for
 * a public repository and without a credential, and the window showed that line and nothing else.
 */
import test from 'node:test';
import assert from 'node:assert';

import { bitbucketProvider } from '../src/index';

const api: any = { name: 'bitbucket', config: {}, settings: { file: 'plugin.bitbucket.settings.yml', read: () => ({}), set() {}, setList() {} }, lib: {} };
const repo = { path: 'acme/site', web: 'https://bitbucket.org/acme/site', remote: 'origin' };
const libAnswering = (stdout: string): any => ({ run: async () => ({ ok: true, code: 0, stdout, stderr: '' }), cliError: (s: string) => s });

test('the 410 of the retired issues call becomes one sentence with the repository\'s issues page', async () => {
  const p = bitbucketProvider(api);
  const retired = JSON.stringify({ type: 'error', error: { message: 'CHANGE-3071 - Functionality has been deprecated', detail: 'Please read the changelog entry for more details.' } });
  await assert.rejects(p.listIssues(repo, libAnswering(retired), {}), (err: Error) => {
    assert.strictEqual(err.message, 'Bitbucket Cloud no longer lists issues through its API (CHANGE-3071), so they cannot be shown here. Open them on the repository: https://bitbucket.org/acme/site/issues');
    return true;
  });
});

test('another error is still said as it is, and a list still lists', async () => {
  const p = bitbucketProvider(api);
  await assert.rejects(p.listIssues(repo, libAnswering(JSON.stringify({ type: 'error', error: { message: 'Repository not found' } })), {}), /Repository not found/);
  const items = await p.listIssues(repo, libAnswering(JSON.stringify({ values: [{ id: 3, title: 'Broken link', state: 'open', links: { html: { href: 'https://bitbucket.org/acme/site/issues/3' } }, reporter: { nickname: 'me' }, updated_on: '2026-11-01T00:00:00Z' }] })), {});
  assert.deepStrictEqual(items.map((i) => [i.number, i.title]), [[3, 'Broken link']]);
});
