import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../db";
import { requireAuth } from "../../lib/auth/middleware";
import { z } from "zod";

const createGroupSchema = z.object({
	name: z.string().min(1, "Group name is required"),
});

export const Route = createFileRoute("/api/groups/")({
	server: {
		handlers: {
			// GET /api/groups - List all groups for the current user
			GET: async ({ request }) => {
				const session = await requireAuth(request);

				const groups = await prisma.group.findMany({
					where: {
						userId: session.user.id,
					},
					include: {
						projects: {
							include: {
								calculations: {
									where: {
										archived: false,
									},
									orderBy: {
										version: "desc",
									},
									take: 1, // Just get count, not all calculations
								},
							},
							orderBy: {
								createdAt: "desc",
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				});

				// Transform to include calculation counts
				const groupsWithCounts = groups.map((group) => ({
					...group,
					projects: group.projects.map((project) => ({
						...project,
						calculations: [], // Don't send calculation data, just metadata
						calculationCount: project.calculations.length,
					})),
				}));

				return new Response(JSON.stringify(groupsWithCounts), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},

			// POST /api/groups - Create a new group
			POST: async ({ request }) => {
				const session = await requireAuth(request);

				try {
					const body = await request.json();
					const validatedData = createGroupSchema.parse(body);

					const group = await prisma.group.create({
						data: {
							name: validatedData.name,
							userId: session.user.id,
						},
						include: {
							projects: true,
						},
					});

					return new Response(JSON.stringify(group), {
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

					console.error("Error creating group:", error);
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

