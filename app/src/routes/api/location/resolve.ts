import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../../db";

export const Route = createFileRoute("/api/location/resolve")({
	server: {
		handlers: {
			// GET /api/location/resolve?zipCode=xxxxx
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const zipCode = url.searchParams.get("zipCode");

				if (!zipCode) {
					return new Response(
						JSON.stringify({ error: "zipCode parameter is required" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				// Validate ZIP code format
				if (!/^\d{5}$/u.test(zipCode)) {
					return new Response(
						JSON.stringify({ error: "Invalid ZIP code format. Must be 5 digits" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				try {
					const climateRef = await prisma.climateRef.findUnique({
						where: { zipCode },
					});

					if (!climateRef) {
						return new Response(
							JSON.stringify({
								error: `Climate data not found for ZIP code ${zipCode}`,
							}),
							{
								status: 404,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Return climate data in the expected format
					return new Response(
						JSON.stringify({
							climateRefId: climateRef.id,
							variables: climateRef.variables,
							revision: climateRef.revision,
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					);
				} catch (error) {
					console.error("Error resolving location:", error);
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
