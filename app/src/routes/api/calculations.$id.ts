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

			// POST /api/calculations/:id/archive
			POST: async ({ request, params }) => {
				const session = await requireAuth(request);
				const { id } = params;

				// Check if the request is for archiving
				const url = new URL(request.url);
				const isArchive = url.pathname.endsWith("/archive");

				if (!isArchive) {
					return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
						status: 400,
						headers: { "Content-Type": "application/json" },
					});
				}

				// Verify user has access to this calculation
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

				// Archive the calculation
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
