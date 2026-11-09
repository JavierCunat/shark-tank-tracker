import type { NextConfig } from "next";

const config: NextConfig = {
  // pg is a Node-only package; keep it out of the client bundle.
  serverExternalPackages: ["pg"],
};

export default config;
