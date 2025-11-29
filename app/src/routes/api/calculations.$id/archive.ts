import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../../db";
import { requireAuth } from "../../../lib/auth/middleware";

export const Route = createFileRoute("/api/calculations/$id/archive")({
	server: {
		handlers: {
			POST: async ({ request, params }) => {
				const session = await requireAuth(request);
				const { id } = params;

				// Verify the calculation belongs to the requesting user
				const calculation = await prisma.calculation.findFirst({
					where: {
						id,
						project: {
							group: {
								userId: session.user.id,
							},
						},
					},
				});

				if (!calculation) {
					return new Response(
						JSON.stringify({ error: "Calculation not found" }),
						{
							status: 404,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				const updated = await prisma.calculation.update({
					where: { id },
					data: { archived: true },
				});

				return new Response(JSON.stringify(updated), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
