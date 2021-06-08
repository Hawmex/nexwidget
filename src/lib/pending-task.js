'use strict';

export const addPendingTask = (emitter, task) => {
  const pendingTask = new CustomEvent('pending-task', {
    composed: true,
    bubbles: true,
    detail: { task },
  });

  emitter.dispatchEvent(pendingTask);

  return task;
};
