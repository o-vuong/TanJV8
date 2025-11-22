import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
	{
		variants: {
			variant: {
				default: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-blue-500/50",
				destructive:
					"bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-500/50",
				outline:
					"border-2 border-slate-700 bg-slate-900/50 text-white hover:bg-slate-800 hover:border-slate-600 shadow-sm",
				secondary:
					"bg-slate-700 text-white hover:bg-slate-600 shadow-sm",
				ghost:
					"text-white hover:bg-slate-800",
				link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-8 rounded-md gap-1.5 px-3",
				lg: "h-12 rounded-lg px-8",
				icon: "size-10",
				"icon-sm": "size-8",
				"icon-lg": "size-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
