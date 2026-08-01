import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: true,
  },
  output: "export",
  trailingSlash: false,
}

export default nextConfig
