import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set project root so Next doesn't infer it as "frontend/app"
    root: __dirname,
  },
  reactCompiler: true,
};

export default nextConfig;
