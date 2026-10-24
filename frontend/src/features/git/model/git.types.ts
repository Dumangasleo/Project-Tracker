export interface GitServerStatus {
  enabled: boolean;
  webUrl: string | null;
  org: string;
  version: string | null;
}

export interface GitAccount {
  username: string;
  webUrl: string;
}

export interface ProjectRepository {
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  empty: boolean;
  private: boolean;
}

export type RepositoryMode = 'create' | 'link';

export interface IdeLink {
  label: string;
  href: string;
  hint: string;
}

/** VS Code opens these natively; JetBrains IDEs need the JetBrains Toolbox app to handle jetbrains:// links. */
export function ideLinks(cloneUrl: string): IdeLink[] {
  const url = encodeURIComponent(cloneUrl);
  const jetbrains = (tool: string) =>
    `jetbrains://${tool}/checkout/git?idea.required.plugins.id=Git4Idea&checkout.repo=${url}`;
  return [
    { label: 'VS Code', href: `vscode://vscode.git/clone?url=${url}`, hint: 'Opens the clone dialog in VS Code' },
    { label: 'IntelliJ IDEA', href: jetbrains('idea'), hint: 'Needs JetBrains Toolbox' },
    { label: 'WebStorm', href: jetbrains('web-storm'), hint: 'Needs JetBrains Toolbox' },
  ];
}

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
