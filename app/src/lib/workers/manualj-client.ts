import type { BuildingInputs, CalculationResults } from "@manualj/calc-engine";
import type {
	WorkerMessage,
	WorkerResponse,
} from "../../workers/manualj.worker";

export class ManualJWorkerClient {
	private worker: Worker;
	private pending = new Map<
		string,
		{
			resolve: (value: CalculationResults) => void;
			reject: (reason: Error) => void;
			onProgress?: (progress: number) => void;
			timeoutId: ReturnType<typeof setTimeout>;
		}
	>();

	constructor() {
		this.worker = new Worker(
			new URL("../../workers/manualj.worker.ts", import.meta.url),
			{
				type: "module",
			},
		);
		this.worker.onmessage = this.handleMessage;
		this.worker.onerror = (error) => {
			this.flushPending(new Error(`Worker error: ${error.message}`));
		};
	}

	calculate(
		inputs: BuildingInputs,
		options: {
			timeoutMs?: number;
			onProgress?: (progress: number) => void;
		} = {},
	): Promise<CalculationResults> {
		const id = crypto.randomUUID();
		const timeoutMs = options.timeoutMs ?? 30_000;

		return new Promise<CalculationResults>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				this.cancel(id);
				reject(new Error("Calculation timeout"));
			}, timeoutMs);

			this.pending.set(id, {
				resolve: (results) => {
					clearTimeout(timeoutId);
					resolve(results);
				},
				reject: (error) => {
					clearTimeout(timeoutId);
					reject(error);
				},
				onProgress: options.onProgress,
				timeoutId,
			});

			this.worker.postMessage({
				id,
				type: "CALCULATE",
				inputs,
			} satisfies WorkerMessage);
		});
	}

	cancel(id: string) {
		this.worker.postMessage({ id, type: "CANCEL" } satisfies WorkerMessage);
		const pending = this.pending.get(id);
		if (pending) {
			clearTimeout(pending.timeoutId);
			pending.reject(new Error("Calculation cancelled"));
			this.pending.delete(id);
		}
	}

	dispose() {
		this.flushPending(new Error("Worker disposed"));
		this.worker.terminate();
	}

	private handleMessage = (event: MessageEvent<WorkerResponse>) => {
		const { id, type, results, error, progress } = event.data;
		const pending = this.pending.get(id);
		if (!pending) return;

		if (type === "PROGRESS" && typeof progress === "number") {
			pending.onProgress?.(progress);
			return;
		}

		if (type === "RESULT" && results) {
			pending.resolve(results);
			this.pending.delete(id);
			return;
		}

		if (type === "ERROR") {
			pending.reject(new Error(error ?? "Calculation failed"));
			this.pending.delete(id);
		}
	};

	private flushPending(error: Error) {
		for (const [id, pending] of this.pending) {
			clearTimeout(pending.timeoutId);
			pending.reject(error);
			this.pending.delete(id);
		}
	}
}

let singleton: ManualJWorkerClient | null = null;

export function getManualJWorker() {
	if (!singleton) {
		singleton = new ManualJWorkerClient();
	}
	return singleton;
}
