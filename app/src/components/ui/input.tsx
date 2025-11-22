import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-base text-white shadow-sm transition-all outline-none",
				"placeholder:text-gray-500",
				"hover:border-slate-600",
				"focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
