import type { Severity } from '../review.enums';
import type { DiffFile } from './diff';

export interface Finding {
  path: string | null;
  line: number | null;
  severity: Severity;
  title: string;
  details: string;
}

interface LineRule {
  id: string;
  severity: Severity;
  title: string;
  details: string;
  pattern: RegExp;
  files?: RegExp;
  skipTests?: boolean;
}

const TEST_FILE =
  /(\.(spec|test)\.[cm]?[jt]sx?$)|(^|\/)(__tests__|test|tests)\//;
const SKIPPED_FILE =
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|\.min\.(js|css)$|(^|\/)(dist|build|coverage)\//;
const ENV_FILE = /(^|\/)\.env(\.[\w-]+)?$/;
const ENV_TEMPLATE = /\.(example|sample|template)$/;
const LARGE_PR_LINES = 600;
const MAX_FINDINGS = 60;

const LINE_RULES: LineRule[] = [
  {
    id: 'merge-conflict',
    severity: 'CRITICAL',
    title: 'Merge conflict marker left in the code',
    details:
      'Resolve the conflict and remove the <<<<<<< / ======= / >>>>>>> lines.',
    pattern: /^(<{7}|={7}|>{7})( |$)/,
  },
  {
    id: 'private-key',
    severity: 'CRITICAL',
    title: 'Private key committed',
    details:
      'Remove the key, rotate it, and load it from an environment variable or secret store instead.',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  },
  {
    id: 'access-token',
    severity: 'CRITICAL',
    title: 'Access key or token committed',
    details:
      'This looks like a real AWS, GitHub, Google or Slack credential. Revoke it and move it to the environment.',
    pattern:
      /\b(AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|AIza[0-9A-Za-z_-]{35}|xox[abpr]-[A-Za-z0-9-]{10,})\b/,
  },
  {
    id: 'hardcoded-secret',
    severity: 'HIGH',
    title: 'Hard-coded password or secret',
    details:
      'Secrets in code end up in git history. Read it from configuration (e.g. ConfigService / import.meta.env) instead.',
    pattern:
      /\b(password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|jwt[_-]?secret)\b["']?\s*[:=]\s*["'`][^"'`\s]{6,}["'`]/i,
    skipTests: true,
  },
  {
    id: 'sql-interpolation',
    severity: 'HIGH',
    title: 'SQL built with string interpolation',
    details:
      'Values inside ${...} are not escaped, which allows SQL injection. Use parameters, e.g. .where("x = :x", { x }).',
    pattern:
      /\.(query|where|andWhere|orWhere|having|orderBy)\s*\(\s*`[^`]*\$\{/,
  },
  {
    id: 'v-html',
    severity: 'HIGH',
    title: 'v-html renders raw HTML (XSS risk)',
    details:
      'If the value can contain user or API data, an attacker can inject scripts. Use text interpolation {{ }} or sanitize first.',
    pattern: /\bv-html\s*=/,
    files: /\.vue$/,
  },
  {
    id: 'eval',
    severity: 'HIGH',
    title: 'eval() or new Function() executes strings as code',
    details: 'Avoid running dynamic code; it is a common injection vector.',
    pattern: /\beval\s*\(|\bnew Function\s*\(/,
  },
  {
    id: 'tls-disabled',
    severity: 'HIGH',
    title: 'TLS certificate checks disabled',
    details:
      'rejectUnauthorized: false / NODE_TLS_REJECT_UNAUTHORIZED makes HTTPS open to man-in-the-middle attacks.',
    pattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED/,
  },
  {
    id: 'inner-html',
    severity: 'MEDIUM',
    title: 'innerHTML / outerHTML assignment',
    details:
      'Assigning HTML strings can lead to XSS. Prefer textContent or a framework binding.',
    pattern: /\.(inner|outer)HTML\s*=/,
  },
  {
    id: 'focused-test',
    severity: 'MEDIUM',
    title: 'Focused test (.only) will skip every other test',
    details: 'Remove .only before merging.',
    pattern: /\b(describe|it|test)\.only\s*\(/,
  },
  {
    id: 'debugger',
    severity: 'MEDIUM',
    title: 'debugger statement left in the code',
    details: 'Remove it before merging.',
    pattern: /^\s*debugger\s*;?\s*$/,
  },
  {
    id: 'console-log',
    severity: 'LOW',
    title: 'Leftover console.log',
    details:
      'Remove debug logging, or use the app logger. Logs can leak personal data.',
    pattern: /\bconsole\.(log|debug)\s*\(/,
  },
  {
    id: 'any-type',
    severity: 'LOW',
    title: 'Type "any" turns off type checking',
    details: 'Use a real type or unknown.',
    pattern: /:\s*any\b|\bas\s+any\b|<any>/,
    files: /\.(ts|tsx|vue)$/,
  },
  {
    id: 'checks-disabled',
    severity: 'LOW',
    title: 'Type or lint check disabled',
    details:
      '@ts-ignore / eslint-disable can hide real bugs. Add a reason or fix the underlying issue.',
    pattern: /@ts-ignore|@ts-nocheck|eslint-disable/,
  },
  {
    id: 'todo',
    severity: 'LOW',
    title: 'TODO / FIXME left in the code',
    details: 'Finish it or create a task for it.',
    pattern: /\b(TODO|FIXME|HACK|XXX)\b/,
  },
];

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/** Free, offline pattern checks on the added lines of a pull request. */
export function findWarnings(files: DiffFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    if (file.deleted || file.binary || SKIPPED_FILE.test(file.path)) continue;

    if (ENV_FILE.test(file.path) && !ENV_TEMPLATE.test(file.path)) {
      findings.push({
        path: file.path,
        line: null,
        severity: 'CRITICAL',
        title: 'Environment file committed',
        details:
          '.env files usually hold passwords and keys. Remove it from the PR, add it to .gitignore, and rotate the secrets inside.',
      });
      continue;
    }

    const isTest = TEST_FILE.test(file.path);
    for (const rule of LINE_RULES) {
      if (rule.files && !rule.files.test(file.path)) continue;
      if (rule.skipTests && isTest) continue;

      const hits = file.added.filter(({ text }) => rule.pattern.test(text));
      if (hits.length === 0) continue;

      findings.push({
        path: file.path,
        line: hits[0].line,
        severity: rule.severity,
        title: rule.title,
        details:
          hits.length > 1
            ? `${rule.details} Found ${hits.length} times in this file (lines ${hits
                .slice(0, 5)
                .map((hit) => hit.line)
                .join(', ')}${hits.length > 5 ? ', …' : ''}).`
            : rule.details,
      });
    }
  }

  const changedLines = files.reduce(
    (sum, file) => sum + file.additions + file.deletions,
    0,
  );
  if (changedLines > LARGE_PR_LINES) {
    findings.push({
      path: null,
      line: null,
      severity: 'MEDIUM',
      title: `Large pull request (${changedLines} changed lines)`,
      details:
        'Big PRs are hard to review well. Consider splitting it into smaller PRs.',
    });
  }

  return findings
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, MAX_FINDINGS);
}
