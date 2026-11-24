export class WorkerTimeoutError extends Error {
  constructor(ms: number) {
    super(`Processing took longer than ${ms / 1000}s and was stopped.`);
    this.name = "WorkerTimeoutError";
  }
}

export class SupersededError extends Error {
  constructor() {
    super("Superseded by a newer request.");
    this.name = "SupersededError";
  }
}

/**
 * Runs one task at a time in a dedicated Web Worker. If a task exceeds the
 * timeout, or a newer task arrives while one is running, the worker is
 * terminated (the only way to stop runaway JS such as catastrophic regex
 * backtracking) and a fresh one is created on the next call.
 */
export class TaskWorker<Req extends object, Res> {
  private worker: Worker | null = null;
  private seq = 0;
  private pending: { id: number; resolve: (r: Res) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;

  constructor(private readonly factory: () => Worker, private readonly timeoutMs: number) {}

  private ensure(): Worker {
    if (!this.worker) {
      this.worker = this.factory();
      this.worker.onmessage = (e: MessageEvent<{ id: number; result: Res }>) => {
        const p = this.pending;
        if (!p || e.data.id !== p.id) return;
        clearTimeout(p.timer);
        this.pending = null;
        p.resolve(e.data.result);
      };
      this.worker.onerror = (e) => {
        const p = this.pending;
        this.kill();
        p?.reject(new Error(e.message || "Worker failed."));
      };
    }
    return this.worker;
  }

  private kill() {
    if (this.pending) clearTimeout(this.pending.timer);
    this.pending = null;
    this.worker?.terminate();
    this.worker = null;
  }

  run(req: Req): Promise<Res> {
    if (this.pending) {
      const old = this.pending;
      this.kill();
      old.reject(new SupersededError());
    }
    const id = ++this.seq;
    const w = this.ensure();
    return new Promise<Res>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.kill();
        reject(new WorkerTimeoutError(this.timeoutMs));
      }, this.timeoutMs);
      this.pending = { id, resolve, reject, timer };
      w.postMessage({ ...req, id });
    });
  }

  dispose() {
    const p = this.pending;
    this.kill();
    p?.reject(new SupersededError());
  }
}
