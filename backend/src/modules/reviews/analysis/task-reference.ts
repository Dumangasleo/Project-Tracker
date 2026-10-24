const TASK_KEY = /\b(?:T|TASK)-(\d+)\b/i;
const TASK_BRANCH = /^(?:[\w.-]+\/)?(?:task|t)[/_-](\d+)(?:\b|[/_-])/i;

/**
 * Finds the task a pull request belongs to: "T-12" (or "TASK-12") in the title, branch or description,
 * or a branch named like "task/12-checkout-page".
 */
export function findTaskId(
  title: string,
  branch: string,
  body?: string | null,
): number | null {
  for (const text of [title, branch, body ?? '']) {
    const match = text.match(TASK_KEY);
    if (match) return Number(match[1]);
  }
  const fromBranch = branch.match(TASK_BRANCH);
  return fromBranch ? Number(fromBranch[1]) : null;
}

export const taskKey = (taskId: number): string => `T-${taskId}`;
