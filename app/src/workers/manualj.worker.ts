import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import { calculateSimplifiedManualJ } from "@manualj/calc-engine";

export interface WorkerMessage {
	id: string;
	type: "CALCULATE" | "CANCEL";
	inputs?: ManualJInputs;
}

export interface WorkerResponse {
	id: string;
	type: "RESULT" | "ERROR" | "PROGRESS";
	results?: ManualJResults;
	error?: string;
	progress?: number;
	duration?: number;
}

let currentId: string | null = null;
let cancelled = false;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
	const { id, type, inputs } = event.data;

	switch (type) {
		case "CALCULATE": {
			if (!inputs) {
				self.postMessage({
					id,
					type: "ERROR",
					error: "No inputs provided",
				} satisfies WorkerResponse);
				return;
			}

			currentId = id;
			cancelled = false;

			self.postMessage({
				id,
				type: "PROGRESS",
				progress: 10,
			} satisfies WorkerResponse);

			queueMicrotask(() => {
				if (cancelled) return;
				try {
					const startTime = performance.now();
					const results = calculateSimplifiedManualJ(inputs);
					const duration = performance.now() - startTime;
					
					self.postMessage({
						id,
						type: "PROGRESS",
						progress: 90,
					} satisfies WorkerResponse);
					if (!cancelled) {
						self.postMessage({
							id,
							type: "RESULT",
							results,
							duration,
						} satisfies WorkerResponse);
					}
				} catch (error) {
					if (!cancelled) {
						self.postMessage({
							id,
							type: "ERROR",
							error:
								error instanceof Error ? error.message : "Calculation failed",
						} satisfies WorkerResponse);
					}
				} finally {
					currentId = null;
				}
			});
			break;
		}
		case "CANCEL": {
			if (currentId === id) {
				cancelled = true;
				currentId = null;
			}
			break;
		}
	}
};
