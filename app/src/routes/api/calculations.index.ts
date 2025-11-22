import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../db";
import { requireAuth } from "../../lib/auth/middleware";
import { z } from "zod";

const calculationInputSchema = z.object({
	projectId: z.string(),
	inputs: z.record(z.unknown()),
	results: z.record(z.unknown()),
});

export const Route = createFileRoute("/api/calculations/")({
	server: {
		handlers: {
			// GET /api/calculations?projectId=xxx
			GET: async ({ request }) => {
				const session = await requireAuth(request);
				const url = new URL(request.url);
				const projectId = url.searchParams.get("projectId");

				if (!projectId) {
					return new Response(
						JSON.stringify({ error: "projectId is required" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				// Verify user has access to this project
				const project = await prisma.project.findFirst({
					where: {
						id: projectId,
						group: {
							userId: session.user.id,
						},
					},
				});

				if (!project) {
					return new Response(JSON.stringify({ error: "Project not found" }), {
						status: 404,
						headers: { "Content-Type": "application/json" },
					});
				}

				const calculations = await prisma.calculation.findMany({
					where: {
						projectId,
						archived: false,
					},
					orderBy: {
						version: "desc",
					},
				});

				return new Response(JSON.stringify(calculations), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},

			// POST /api/calculations
			POST: async ({ request }) => {
				const session = await requireAuth(request);

				try {
					const body = await request.json();
					const validatedData = calculationInputSchema.parse(body);

					// Verify user has access to this project
					const project = await prisma.project.findFirst({
						where: {
							id: validatedData.projectId,
							group: {
								userId: session.user.id,
							},
						},
					});

					if (!project) {
						return new Response(
							JSON.stringify({ error: "Project not found" }),
							{
								status: 404,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Get the next version number
					const lastCalculation = await prisma.calculation.findFirst({
						where: {
							projectId: validatedData.projectId,
						},
						orderBy: {
							version: "desc",
						},
					});

					const nextVersion = (lastCalculation?.version ?? 0) + 1;

					// Create new calculation
					const calculation = await prisma.calculation.create({
						data: {
							projectId: validatedData.projectId,
							version: nextVersion,
							inputs: validatedData.inputs,
							results: validatedData.results,
						},
					});

					return new Response(JSON.stringify(calculation), {
						status: 201,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						return new Response(
							JSON.stringify({ error: "Validation error", details: error.errors }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					console.error("Error creating calculation:", error);
					return new Response(
						JSON.stringify({ error: "Internal server error" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});

