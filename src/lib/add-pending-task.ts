type AddPendingTaskEventDetails = { task: Promise<any> };

export type AddPendingTaskEvent = CustomEvent<AddPendingTaskEventDetails>;

declare global {
  interface HTMLElementEventMap {
    'pending-task': AddPendingTaskEvent;
  }
}

export const addPendingTask = <T>(emitter: EventTarget, task: Promise<T>) => {
  const pendingTask = new CustomEvent<AddPendingTaskEventDetails>('pending-task', {
    composed: true,
    bubbles: true,
    detail: { task },
  });

  emitter.dispatchEvent(pendingTask);

  return task;
};
