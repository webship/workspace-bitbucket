/**
 * The AI items this plugin carries (ai/ in the package, the manifest's `ai` block), each placed by the
 * installer in the workspace folder of its kind.
 *
 * What is checked here is what a person relies on once they are installed: each item has the shape its
 * folder lists, its body is plain Markdown any AI command-line assistant can follow, and it names nothing
 * that does not exist — what it says about the plugin is held to the plugin's own code, scripts and settings.
 */
import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import * as plugin from '../src/index';

// Compiled, these tests run from dist/tests, so the package root is one folder further up.
const PKG = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const read = (f: string) => fs.readFileSync(path.join(PKG, f), 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = pkg.workspacePlugin;
const P: string = manifest.name;
const { AGENTS, SKILLS, AI_COMMANDS, PROMPTS } = plugin as any;
void os;

// The kinds the workspace knows, and the folder each one lands in (core/workspace-app/plugin-install.js).
const KINDS: Record<string, string> = { agents: 'ai-agents', skills: 'ai-skills', commands: 'ai-commands', prompts: 'ai-prompts' };
const kindList = (kind: string): string[] => manifest.ai[kind] || [];

/** Every file of the package under a path: the file itself, or all the files of a folder (a skill is a folder). */
function filesUnder(rel: string): string[] {
  const abs = path.join(PKG, rel);
  if (!fs.statSync(abs).isDirectory()) return [rel];
  return fs.readdirSync(abs).flatMap((e) => filesUnder(`${rel}/${e}`));
}
const ITEM_FILES: string[] = Object.keys(KINDS).flatMap((kind) => kindList(kind).flatMap(filesUnder));
const MAIN_FILES: string[] = [...kindList('agents'), ...kindList('commands'), ...kindList('prompts'), ...kindList('skills').map((s) => `${s}/SKILL.md`)];
const frontmatter = (src: string) => (src.startsWith('---\n') ? src.split('\n---\n')[0] : '');
const bodyOf = (src: string) => (src.startsWith('---\n') ? src.split('\n---\n').slice(1).join('\n---\n') : src);
// The plugins the manifest needs: a list alone, or the `plugins` of the object that also carries the commands.
const neededPlugins: unknown[] = Array.isArray(manifest.needs) ? manifest.needs : ((manifest.needs && manifest.needs.plugins) || []);
// The sources of the plugin: what an item may be held to.
const walk = (dir: string): string[] => (fs.existsSync(path.join(PKG, dir)) ? fs.readdirSync(path.join(PKG, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`])) : []);
const SOURCES: string = ['src', 'scripts', 'commands', 'lib'].flatMap(walk).map(read).join('\n');
void SOURCES;

test('the manifest carries a list per kind it ships, each item under ai/<kind>/, and needs the folder each kind lands in', () => {
  assert.deepStrictEqual(Object.keys(manifest.ai).sort(), CFG.kinds.slice().sort(), 'the kinds this plugin ships');
  for (const kind of CFG.kinds) {
    const list = kindList(kind);
    assert.ok(list.length > 0, `the plugin ships at least one of ${kind}`);
    for (const f of list) {
      assert.strictEqual(path.dirname(f), `ai/${kind}`, `${f} is in ai/${kind}/`);
      assert.ok(fs.existsSync(path.join(PKG, f)), `${f} is in the package`);
      assert.match(path.basename(f), new RegExp(`^${P}-[a-z0-9-]+(\\.md)?$`), `${f} carries the plugin's name, so it never takes the name of another plugin's item`);
    }
    assert.ok(neededPlugins.includes(KINDS[kind]), `it ships ${kind}, so it needs ${KINDS[kind]}`);
  }
  assert.ok(pkg.files.includes('ai'), 'ai/ is published with the package');
  const names = (kind: string, ext = '.md') => kindList(kind).map((f: string) => path.basename(f, ext));
  assert.deepStrictEqual(names('agents'), AGENTS);
  assert.deepStrictEqual(names('skills', ''), SKILLS);
  assert.deepStrictEqual(names('commands'), AI_COMMANDS);
  assert.deepStrictEqual(names('prompts'), PROMPTS);
  // Commands and prompts share one destination when they are installed: a name used by both is lost.
  assert.strictEqual(new Set([...AI_COMMANDS, ...PROMPTS]).size, AI_COMMANDS.length + PROMPTS.length, 'no command and prompt share a name');
});

test('an agent is named after its file, says when to use it, and names its model and tools', () => {
  for (const f of kindList('agents')) {
    const head = frontmatter(read(f));
    assert.match(head, new RegExp(`^name: ${path.basename(f, '.md')}$`, 'm'));
    assert.match(head, /^description: Use this agent .{80,}$/m, `${f} says what it does and when to use it`);
    assert.match(head, /^model: fable$/m);
    assert.match(head, /^tools:\n( {2}- \S+\n?)+/m, `${f} lists its tools`);
  }
});

test('a skill is a folder with a SKILL.md named after it, and says when to use it', () => {
  for (const f of kindList('skills')) {
    assert.ok(fs.statSync(path.join(PKG, f)).isDirectory(), `${f} is a folder`);
    const head = frontmatter(read(`${f}/SKILL.md`));
    assert.match(head, new RegExp(`^name: ${path.basename(f)}$`, 'm'));
    assert.match(head, /^description: .{80,}$/m, `${f} says what it does and when to use it`);
    assert.match(head, /Use when/, `${f} names the requests it answers to`);
  }
});

test('a command is a slash command: a description, an argument hint, $ARGUMENTS, and the arguments said in words', () => {
  for (const f of kindList('commands')) {
    const src = read(f);
    const head = frontmatter(src);
    assert.match(head, /^description: .{40,}$/m, `${f} is described in the command list`);
    assert.match(head, /^argument-hint: .+$/m, `${f} says what to type after it`);
    assert.doesNotMatch(head, /^name:/m, `${f} is named by its file`);
    assert.ok(src.includes('$ARGUMENTS'), `${f} reads what was typed after the command`);
    assert.match(bodyOf(src), /The (first word|argument) is /, `${f} says in words what the arguments are, for an assistant that does not fill $ARGUMENTS in`);
  }
});

test('a prompt is a line that says what it is for, then the whole launch command, and says the text works in another AI assistant', () => {
  for (const f of kindList('prompts')) {
    const src = read(f);
    assert.doesNotMatch(src, /^---\n/, `${f} has no frontmatter: it is not installed as a command`);
    assert.match(src.split('\n')[0], /^[A-Z].{20,}\.$/, `${f} opens with one sentence`);
    // The two expressions the dashboard reads a prompt with (core/workspace-app/screens.js).
    const flags = src.match(/^\s*claude\s+([^\n]*?)\s*"""\s*$/m);
    const text = src.match(/claude[^\n]*"""\n([\s\S]*?)\n"""/);
    assert.ok(flags && flags[1].trim() === '--permission-mode bypassPermissions', `${f} carries the default launch command`);
    assert.ok(text && text[1].trim().length > 100, `${f} carries the prompt`);
    assert.match(text![1], /<[a-z|]+>/, `${f} has placeholders to fill in`);
    assert.match(text![1], /^# .*container-based \(DDEV by default\)/m, `${f} says where it runs`);
    assert.match(src, /^The text between the triple quotes is plain: it can be given to another AI command-line assistant as it is\.$/m, `${f} says its text is not tied to one assistant`);
  }
});

test('the body of every item is plain Markdown: it names no tool or feature of one AI command-line assistant', () => {
  for (const f of ITEM_FILES.filter((x) => x.endsWith('.md'))) {
    // What is left once the default launch line of a prompt is taken out: the words an assistant is asked to follow.
    const body = bodyOf(read(f)).replace(/^\s*claude --permission-mode bypassPermissions """\s*$/m, '');
    for (const m of body.matchAll(/\b(Bash|Read|Write|Edit|Grep|Glob|Task|Agent|Skill|TodoWrite|WebFetch) tool\b|\bsubagents?\b|bypassPermissions|\bClaude\b|\bclaude -p\b|\.claude\/|\bMCP\b|mcp__/g)) {
      assert.fail(`${f}: "${m[0]}" belongs to one AI assistant; the body is for any of them`);
    }
  }
});

// ---- What is specific to this plugin ---------------------------------------------------------------
const CFG = {
  kinds: ['agents', 'skills', 'commands', 'prompts'],
  pluginCommands: {} as Record<string, string[]>,           // it places no cmd-*.sh: Bitbucket has no command-line tool
  worksWith: /git remote get-url origin|git push -u origin/,
  addresses: /^git@bitbucket\.org$|@example\.(com|org)$/,
  checkpoints: [...kindList('agents'), ...kindList('prompts')],
};

/** The plugin as the dashboard loads it, on a project whose remote is on the host: what its menu and its New-folder section say. */
function drawn(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `${P}-items-`));
  const dir = path.join(root, 'dev', 'site1');
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.git', 'HEAD'), 'ref: refs/heads/feature-x\n');
  fs.writeFileSync(path.join(dir, '.git', 'config'), '[remote "origin"]\n\turl = git@bitbucket.org:webship/workspace.git\n');
  const menus: any[] = [];
  const setups: any[] = [];
  const api: any = {
    name: P, config: {}, settings: { file: manifest.settingsFile, read: () => ({ host: 'bitbucket.org' }), set() {}, setList() {} },
    lib: { esc: (s: unknown) => String(s), ROOT: root, workspaceDir: (ws: string) => path.join(root, ws), listProjects: (d: string) => fs.readdirSync(d), screenAction() {}, iconHtml: () => '', NAME_RE: /^[a-zA-Z0-9_-]+$/ },
    addRowMenu: (_slot: string, _spec: any, fn: any) => menus.push(fn), addProjectChip() {}, addAction() {}, addFolderSetup: (s: any) => setups.push(s), addCss() {}, addForge() {},
  };
  (plugin as any).register(api);
  const html = [...menus.map((fn) => fn({ key: 'dev', project: 'site1', dir: path.join(root, 'dev'), meta: {}, allowed: new Set(), vals: () => '' })), ...setups.map((s) => s.html('dev', {}))].join('\n');
  fs.rmSync(root, { recursive: true, force: true });
  return html;
}

test('every menu entry an item names is one the plugin draws, and every address behind it is one the menu links to', () => {
  const html = drawn();
  const ui = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.match(ui, new RegExp(`${manifest.label.toUpperCase()} `), 'the menu is drawn for a project whose remote is on the host');
  let checked = 0;
  for (const f of MAIN_FILES) {
    // A row of a table whose first cell is a bold label is a menu entry; so is "offers **…**".
    const labels = [...read(f).matchAll(/^\| \*\*([^*]+)\*\*/gm), ...read(f).matchAll(/offers \*\*([^*]+)\*\*/g)].map((m) => m[1]);
    for (const label of labels) {
      assert.ok(ui.includes(label), `${f}: the plugin draws no "${label}"`);
      checked += 1;
    }
    if (/\bmenu\b/.test(read(f))) assert.ok(read(f).includes(`${manifest.label.toUpperCase()} menu`), `${f} calls the menu by its label`);
    // A page of the repository an item names: the same address, for the project the menu was drawn for.
    for (const m of read(f).matchAll(/https:\/\/bitbucket\.org\/<workspace>\/<repository>(\/[^\s`"')|]*)?/g)) {
      const page = `https://bitbucket.org/webship/workspace${(m[1] || '').replace(/<(the )?branch>/, 'feature-x')}`;
      assert.ok(html.includes(page), `${f}: the menu links to no ${m[0]}`);
      checked += 1;
    }
  }
  assert.ok(checked >= 10, `the skill lists the entries of the menu and their addresses (${checked} checked)`);
});

test('every REST call an item names is one the provider makes, and no item names a command-line tool Bitbucket does not have', () => {
  const provider = read('src/lib/provider.ts');
  assert.ok(provider.includes('`https://api.${host()}/2.0/repositories`'), 'the base of the REST calls');
  let checked = 0;
  for (const f of [...ITEM_FILES, 'README.md']) {
    for (const m of read(f).matchAll(/https:\/\/api\.bitbucket\.org\/2\.0\/repositories\/<workspace>\/<repository>(\/[a-z]+)(\?[^\s`"')|]*)?/g)) {
      assert.ok(provider.includes(`}${m[1]}?`), `${f}: the provider calls no ${m[1]}`);
      for (const part of (m[2] || '').slice(1).split('&').filter(Boolean)) assert.ok(provider.includes(part), `${f}: the provider sends no ${part}`);
      checked += 1;
    }
    // Reading is curl and git; nothing else is on the machine for Bitbucket.
    for (const line of read(f).split('\n')) {
      const cmd = line.trim().match(/^(curl|git|gh|glab|bb|bitbucket)\s/);
      if (cmd && /^```|^\s{0,3}[a-z]/.test(line)) assert.ok(['curl', 'git'].includes(cmd[1]), `${f}: ${cmd[1]} is not what this plugin works with`);
    }
    assert.doesNotMatch(read(f), /curl[^\n]*(-X|--request) *(POST|PUT|DELETE)|curl[^\n]* -u /, `${f}: an item only reads, and sends no credential`);
  }
  assert.ok(checked >= 4, `the items show the calls the plugin makes (${checked} checked)`);
});

// The workspace's own commands an item may name (github.com/webship/workspace), with the flags it may give them.
const CORE_COMMANDS: Record<string, string[]> = {
  'cmd-tools-testing.sh': ['--run', '--path', '--tags', '--dry-run'],
  'cmd-tools-remove.sh': [],
};
const PLUGINS_SH = ['--list', '--require', '--activate', '--install', '--configure', '--deactivate', '--uninstall', '--check', '--with-needs'];

test('every workspace command an item names exists, with the flags it is given', () => {
  const own: string[] = ((manifest.commands && manifest.commands.files) || []).map((f: string) => path.basename(f));
  assert.deepStrictEqual(own.sort(), Object.keys(CFG.pluginCommands).sort(), 'the cmd-*.sh this plugin places');
  const known: Record<string, string[]> = { ...CORE_COMMANDS, ...CFG.pluginCommands };
  let used = 0;
  for (const f of [...ITEM_FILES, 'README.md']) {
    for (const line of read(f).split('\n')) {
      for (const m of line.matchAll(/(cmd-[a-z0-9<>-]+\.sh)((?:(?!cmd-)[^`|#;])*)/g)) {
        assert.ok(known[m[1]], `${f}: ${m[1]} is not a command of the plugin or of the workspace`);
        for (const flag of m[2].match(/(?<![\w-])--[a-z][a-z-]*/g) || []) assert.ok(known[m[1]].includes(flag), `${f}: ${m[1]} has no ${flag}`);
        used += 1;
      }
      for (const m of line.matchAll(/plugins\.sh((?:[^`|#;])*)/g)) {
        for (const flag of m[1].match(/(?<![\w-])--[a-z][a-z-]*/g) || []) assert.ok(PLUGINS_SH.includes(flag), `${f}: plugins.sh has no ${flag}`);
        used += 1;
      }
    }
  }
  assert.ok(used > 3, 'the items show the workspace commands');
});

test('every settings key an item names is in the settings template, and the skill describes every key of it', () => {
  if (!manifest.settingsTemplate) {
    for (const f of MAIN_FILES) assert.doesNotMatch(read(f), /core\/config\/plugin\.[a-z-]+\.settings\.yml/, `${f}: this plugin has no settings file`);
    return;
  }
  const template = read(manifest.settingsTemplate);
  const keys = [...new Set([...template.matchAll(/^\s*([a-z][a-z0-9_]*):/gm)].map((m) => m[1]))];
  assert.ok(keys.length > 0);
  const named = new Set<string>();
  for (const f of MAIN_FILES) {
    for (const m of read(f).matchAll(/`([a-z][a-z0-9_]*):`/g)) {
      assert.ok(keys.includes(m[1]), `${f}: ${manifest.settingsFile} has no key ${m[1]}`);
      named.add(m[1]);
    }
  }
  assert.deepStrictEqual([...named].sort(), [...keys].sort(), 'the items describe every key of the template');
  assert.ok(kindList('skills').some((s) => read(`${s}/SKILL.md`).includes(`core/config/${manifest.settingsFile}`)), 'the skill says which file the keys are in');
});

test('the items say container-based, name the plugin they come with, and carry no personal value', () => {
  for (const f of ITEM_FILES) {
    const src = read(f);
    assert.doesNotMatch(src, /DDEV-only/i, `${f}: the workspace is container-based, DDEV by default`);
    assert.doesNotMatch(src, /\/home\/(?!YOUR_USER)[a-z]/, `${f} carries no personal path`);
    for (const m of src.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}/g) || []) assert.match(m, CFG.addresses, `${f}: ${m} is not an example address`);
    assert.doesNotMatch(src, /CHANGE_ME|gh[pousr]_[A-Za-z0-9]{8,}|github_pat_|glpat-[A-Za-z0-9_-]{8,}|ATATT[A-Za-z0-9]/, `${f} carries no token and no placeholder of one`);
  }
  for (const f of MAIN_FILES) {
    assert.match(read(f).replace(/\s+/g, ' '), /container-based (workspace )?\(DDEV by default\)|container-based, DDEV by default/, `${f} says what the workspace runs on`);
    assert.match(read(f), CFG.worksWith, `${f} names what the plugin works with`);
    assert.ok(read(f).includes(pkg.name) || f.startsWith('ai/prompts/'), `${f} says which plugin it comes with`);
  }
  for (const f of CFG.checkpoints) {
    assert.match(read(f), /Reviewed by a human/, `${f} carries the Checkpoints rule`);
    assert.match(read(f), /[Nn]ever tick/, `${f}: the two human-review boxes are never ticked by an assistant`);
  }
  const readme = read('README.md');
  for (const name of [...AGENTS, ...SKILLS, ...AI_COMMANDS, ...PROMPTS]) assert.ok(readme.includes(name), `the README lists ${name}`);
});
