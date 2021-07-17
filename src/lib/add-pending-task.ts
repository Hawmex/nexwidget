export type AddPendingTaskEventDetails = { task: Promise<any> };
export type AddPendingTaskEvent = CustomEvent<AddPendingTaskEventDetails>;

declare global {
  interface HTMLElementEventMap {
    'pending-task': AddPendingTaskEvent;
  }
}

export const addPendingTask = (emitter: EventTarget, task: Promise<any>) => {
  const pendingTask = new CustomEvent<AddPendingTaskEventDetails>('pending-task', {
    composed: true,
    bubbles: true,
    detail: { task },
  });

  emitter.dispatchEvent(pendingTask);

  return task;
};
