import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), react()],
  optimizeDeps: {
    exclude: ["@prisma/client"],
  },
  ssr: {
    external: ["@prisma/client", "better-auth/client", "react-to-print"],
    noExternal: [],
  },
  server: {
    watch: {
      ignored: ["**/routeTree.gen.ts"],
    },
  },
});
