export interface AddedLine {
  line: number;
  text: string;
}

export interface DiffFile {
  path: string;
  deleted: boolean;
  binary: boolean;
  added: AddedLine[];
  additions: number;
  deletions: number;
}

const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  let file: DiffFile | null = null;
  let newLine = 0;
  let inHunk = false;

  for (const raw of diff.split('\n')) {
    const text = raw.endsWith('\r') ? raw.slice(0, -1) : raw;

    if (text.startsWith('diff --git ')) {
      const match = text.match(/ b\/(.+)$/);
      file = {
        path: match?.[1] ?? '',
        deleted: false,
        binary: false,
        added: [],
        additions: 0,
        deletions: 0,
      };
      files.push(file);
      inHunk = false;
      continue;
    }
    if (!file) continue;

    const hunk = text.match(HUNK_HEADER);
    if (hunk) {
      newLine = Number(hunk[1]);
      inHunk = true;
    } else if (!inHunk) {
      if (text.startsWith('+++ ')) {
        if (text === '+++ /dev/null') file.deleted = true;
        else file.path = text.replace(/^\+\+\+ (b\/)?/, '');
      } else if (text.startsWith('Binary files ')) {
        file.binary = true;
      }
    } else if (text.startsWith('+')) {
      file.added.push({ line: newLine, text: text.slice(1) });
      file.additions++;
      newLine++;
    } else if (text.startsWith('-')) {
      file.deletions++;
    } else if (text.startsWith(' ')) {
      newLine++;
    }
  }
  return files;
}

export function diffStats(files: DiffFile[]): {
  filesChanged: number;
  additions: number;
  deletions: number;
} {
  return {
    filesChanged: files.length,
    additions: files.reduce((sum, file) => sum + file.additions, 0),
    deletions: files.reduce((sum, file) => sum + file.deletions, 0),
  };
}

/** Prefixes every new-side line with its line number so a model can cite exact lines. */
export function numberDiffLines(diff: string): string {
  const output: string[] = [];
  let newLine = 0;
  let inHunk = false;

  for (const raw of diff.split('\n')) {
    const text = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    const hunk = text.match(HUNK_HEADER);
    if (hunk) {
      newLine = Number(hunk[1]);
      inHunk = true;
      output.push(text);
    } else if (text.startsWith('diff --git ')) {
      inHunk = false;
      output.push(text);
    } else if (inHunk && (text.startsWith('+') || text.startsWith(' '))) {
      output.push(`${String(newLine).padStart(5)} ${text}`);
      newLine++;
    } else if (inHunk && text.startsWith('-')) {
      output.push(`      ${text}`);
    } else {
      output.push(text);
    }
  }
  return output.join('\n');
}

/** Splits a multi-file diff into one chunk per file, keeping the original text. */
export function splitDiffByFile(
  diff: string,
): { path: string; text: string }[] {
  const chunks = diff
    .split(/(?=^diff --git )/m)
    .filter((chunk) => chunk.startsWith('diff --git '));
  return chunks.map((text) => ({
    path: parseDiff(text)[0]?.path ?? '',
    text,
  }));
}
