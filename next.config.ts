import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Envio de imagens nos jobs (o limite de cada envio é checado na ação: 4 MB)
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;
