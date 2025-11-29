import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../db";
import { requireAuth } from "../../lib/auth/middleware";

export const Route = createFileRoute("/api/calculations/$id")({
	server: {
		handlers: {
			// GET /api/calculations/:id
			GET: async ({ request, params }) => {
				const session = await requireAuth(request);
				const { id } = params;

				const calculation = await prisma.calculation.findFirst({
					where: {
						id,
						project: {
							group: {
								userId: session.user.id,
							},
						},
					},
					include: {
						project: true,
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

			return new Response(JSON.stringify(calculation), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		},
		},
	},
});
