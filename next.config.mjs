/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cursor SDK is a Node agent runtime (native deps + LICENSE.txt assets).
  // Keep it out of the Turbopack/webpack server bundle.
  serverExternalPackages: ["@cursor/sdk"],
  turbopack: {
    rules: {
      "*.txt": {
        loaders: ["ignore-loader"],
        as: "*.js",
      },
      "*.md": {
        loaders: ["ignore-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
