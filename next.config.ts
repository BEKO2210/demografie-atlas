import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const githubBasePath = isGitHubPages
  ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  : "";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      trailingSlash: true,
      basePath: githubBasePath,
      assetPrefix: githubBasePath,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
