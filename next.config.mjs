/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow phone / ngrok access in `next dev` (otherwise client JS won't hydrate
  // and assessment taps appear broken).
  allowedDevOrigins: [
    "amie-nonprobable-preharmoniously.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
    "192.168.3.111",
    "192.168.3.126",
    "127.0.0.1",
  ],
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
