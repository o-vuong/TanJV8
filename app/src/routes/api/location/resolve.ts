import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../../db";
import { fetchClimateDataForZip } from "../../../lib/climate/fetch-climate";

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
            }
          );
        }

        // Validate ZIP code format
        if (!/^\d{5}$/u.test(zipCode)) {
          return new Response(
            JSON.stringify({
              error: "Invalid ZIP code format. Must be 5 digits",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        try {
          // First, check if we have this ZIP code in the database
          let climateRef = await prisma.climateRef.findUnique({
            where: { zipCode },
          });

          // If not in database, fetch from external API and save it
          if (!climateRef) {
            try {
              const climateData = await fetchClimateDataForZip(zipCode);

              // Save to database for future use
              climateRef = await prisma.climateRef.create({
                data: {
                  zipCode,
                  revision: new Date().getFullYear(),
                  variables: {
                    summerDesignTemp: climateData.summerDesignTemp,
                    winterDesignTemp: climateData.winterDesignTemp,
                    latitude: climateData.latitude,
                    longitude: climateData.longitude,
                  },
                },
              });
            } catch (fetchError) {
              console.error("Error fetching climate data:", fetchError);
              return new Response(
                JSON.stringify({
                  error: `Unable to resolve climate data for ZIP code ${zipCode}. Please try again or contact support.`,
                }),
                {
                  status: 500,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
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
            }
          );
        } catch (error) {
          console.error("Error resolving location:", error);
          return new Response(
            JSON.stringify({
              error: "Internal server error",
              details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
