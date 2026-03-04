import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@sanctuary/api",
    "@sanctuary/db",
    "@sanctuary/types",
    "@sanctuary/i18n",
  ],
};

export default nextConfig;
