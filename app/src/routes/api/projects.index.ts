import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../db";
import { requireAuth } from "../../lib/auth/middleware";
import { z } from "zod";

const createProjectSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional(),
	groupId: z.string().min(1, "Group ID is required"),
});

export const Route = createFileRoute("/api/projects/")({
	server: {
		handlers: {
			// GET /api/projects?groupId=xxx - List projects for a group
			GET: async ({ request }) => {
				const session = await requireAuth(request);
				const url = new URL(request.url);
				const groupId = url.searchParams.get("groupId");

				if (!groupId) {
					return new Response(
						JSON.stringify({ error: "groupId parameter is required" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				// Verify user has access to this group
				const group = await prisma.group.findFirst({
					where: {
						id: groupId,
						userId: session.user.id,
					},
				});

				if (!group) {
					return new Response(JSON.stringify({ error: "Group not found" }), {
						status: 404,
						headers: { "Content-Type": "application/json" },
					});
				}

				const projects = await prisma.project.findMany({
					where: {
						groupId,
					},
					include: {
						calculations: {
							where: {
								archived: false,
							},
							orderBy: {
								version: "desc",
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				});

				return new Response(JSON.stringify(projects), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},

			// POST /api/projects - Create a new project
			POST: async ({ request }) => {
				const session = await requireAuth(request);

				try {
					const body = await request.json();
					const validatedData = createProjectSchema.parse(body);

					// Verify user has access to this group
					const group = await prisma.group.findFirst({
						where: {
							id: validatedData.groupId,
							userId: session.user.id,
						},
					});

					if (!group) {
						return new Response(
							JSON.stringify({ error: "Group not found" }),
							{
								status: 404,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const project = await prisma.project.create({
						data: {
							name: validatedData.name,
							description: validatedData.description || null,
							groupId: validatedData.groupId,
						},
						include: {
							calculations: true,
						},
					});

					return new Response(JSON.stringify(project), {
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

					console.error("Error creating project:", error);
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

