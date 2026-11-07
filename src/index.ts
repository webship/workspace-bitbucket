/**
 * Bitbucket for Webship Workspace.
 *
 * The BITBUCKET menu on every project whose git remote is on Bitbucket (the repository, open issues,
 * open pull requests, open one from the current branch, the clone URL), the repository chip,
 * "Clone a repository" when a new folder is made, and the credential the dashboard uses for the
 * host. All of it is the forge family's surface (@webship/workspace-forge); this package is the
 * Bitbucket provider plus its settings template and host install.
 */

import type { PluginApi } from '@webship/workspace-plugin-api';
import { registerForge } from '@webship/workspace-forge';

import { bitbucketProvider } from './lib/provider';

export { bitbucketProvider };

export function register(api: PluginApi): void {
  registerForge(api, bitbucketProvider(api));
}
