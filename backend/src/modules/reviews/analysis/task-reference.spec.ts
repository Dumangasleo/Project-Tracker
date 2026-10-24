import { findTaskId, taskKey } from './task-reference';

describe('findTaskId', () => {
  it.each([
    ['T-12 Checkout page', 'feature/checkout', null, 12],
    ['Checkout page', 'feature/TASK-7-checkout', null, 7],
    ['Checkout page', 'main-fix', 'Closes t-30', 30],
    ['Checkout page', 'task/45-checkout-page', null, 45],
    ['Checkout page', 'dev/task-9', null, 9],
    ['Checkout page', 'task_101', null, 101],
  ])('"%s" / %s / %s -> %s', (title, branch, body, expected) => {
    expect(findTaskId(title, branch, body)).toBe(expected);
  });

  it.each([
    ['Fix #12', 'feature/checkout', 'See issue #4'],
    ['Update ART-5 docs', 'tasks-overview', null],
    ['Bump version', 'release/1.2.3', ''],
  ])('ignores "%s" / %s', (title, branch, body) => {
    expect(findTaskId(title, branch, body)).toBeNull();
  });

  it('formats the key shown to developers', () => {
    expect(taskKey(12)).toBe('T-12');
  });
});
