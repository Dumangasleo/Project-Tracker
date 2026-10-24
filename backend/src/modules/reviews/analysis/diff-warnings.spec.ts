import { diffStats, numberDiffLines, parseDiff, splitDiffByFile } from './diff';
import { findWarnings } from './diff-warnings';

const DIFF = [
  'diff --git a/frontend/src/Task.vue b/frontend/src/Task.vue',
  'index 1111111..2222222 100644',
  '--- a/frontend/src/Task.vue',
  '+++ b/frontend/src/Task.vue',
  '@@ -10,3 +10,5 @@ export default {',
  ' <template>',
  '-  <p>{{ note }}</p>',
  '+  <p v-html="note"></p>',
  '+  <span>{{ count }}</span>',
  ' </template>',
  '@@ -40,2 +42,3 @@',
  ' const a = 1;',
  '+console.log(user.email);',
  ' const b = 2;',
  'diff --git a/backend/src/tasks.service.ts b/backend/src/tasks.service.ts',
  '--- a/backend/src/tasks.service.ts',
  '+++ b/backend/src/tasks.service.ts',
  '@@ -1,1 +1,3 @@',
  ' import x from "y";',
  "+const jwtSecret = 'super-secret-value';",
  '+await repo.query(`SELECT * FROM Tasks WHERE id = ${id}`);',
  'diff --git a/backend/.env b/backend/.env',
  'new file mode 100644',
  '--- /dev/null',
  '+++ b/backend/.env',
  '@@ -0,0 +1 @@',
  '+DB_PASSWORD=hunter2',
  'diff --git a/old.ts b/old.ts',
  'deleted file mode 100644',
  '--- a/old.ts',
  '+++ /dev/null',
  '@@ -1 +0,0 @@',
  '-console.log("gone");',
].join('\n');

describe('diff parsing', () => {
  const files = parseDiff(DIFF);

  it('tracks new-file line numbers for added lines', () => {
    expect(files[0].path).toBe('frontend/src/Task.vue');
    expect(files[0].added).toEqual([
      { line: 11, text: '  <p v-html="note"></p>' },
      { line: 12, text: '  <span>{{ count }}</span>' },
      { line: 43, text: 'console.log(user.email);' },
    ]);
    expect(files[3]).toMatchObject({ path: 'old.ts', deleted: true });
  });

  it('counts changed files and lines', () => {
    expect(diffStats(files)).toEqual({
      filesChanged: 4,
      additions: 6,
      deletions: 2,
    });
  });

  it('numbers lines for the AI prompt and splits per file', () => {
    expect(numberDiffLines(DIFF)).toContain('   11 +  <p v-html="note"></p>');
    expect(splitDiffByFile(DIFF).map((chunk) => chunk.path)).toEqual([
      'frontend/src/Task.vue',
      'backend/src/tasks.service.ts',
      'backend/.env',
      'old.ts',
    ]);
  });
});

describe('findWarnings', () => {
  const warnings = findWarnings(parseDiff(DIFF));
  const titles = warnings.map((warning) => warning.title);

  it('flags risky code on added lines with the right location', () => {
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'backend/.env',
          severity: 'CRITICAL',
          line: null,
        }),
        expect.objectContaining({
          path: 'backend/src/tasks.service.ts',
          line: 2,
          severity: 'HIGH',
          title: 'Hard-coded password or secret',
        }),
        expect.objectContaining({
          path: 'backend/src/tasks.service.ts',
          line: 3,
          title: 'SQL built with string interpolation',
        }),
        expect.objectContaining({
          path: 'frontend/src/Task.vue',
          line: 11,
          title: 'v-html renders raw HTML (XSS risk)',
        }),
        expect.objectContaining({
          path: 'frontend/src/Task.vue',
          line: 43,
          severity: 'LOW',
          title: 'Leftover console.log',
        }),
      ]),
    );
  });

  it('ignores deleted files and lists the most severe findings first', () => {
    expect(warnings.some((warning) => warning.path === 'old.ts')).toBe(false);
    expect(warnings[0].severity).toBe('CRITICAL');
    expect(titles.indexOf('Leftover console.log')).toBe(warnings.length - 1);
  });

  it('does not flag secrets in test files', () => {
    const testDiff = DIFF.replaceAll(
      'backend/src/tasks.service.ts',
      'backend/src/tasks.service.spec.ts',
    );
    expect(
      findWarnings(parseDiff(testDiff)).some(
        (warning) => warning.title === 'Hard-coded password or secret',
      ),
    ).toBe(false);
  });
});
