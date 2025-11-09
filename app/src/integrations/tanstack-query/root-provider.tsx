import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "../../lib/queries/client";

export function getContext() {
	const queryClient = createQueryClient();
	return {
		queryClient,
	};
}

export function Provider({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: ReturnType<typeof createQueryClient>;
}) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
