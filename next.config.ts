import type { NextConfig } from "next";
// Autorizar apenas o hostname deste Codespace, sem wildcard global.
const codespaceHost =
  process.env.CODESPACE_NAME &&
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
    ? `${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
    : undefined;
const config: NextConfig = {
  poweredByHeader: false,
  // Inclui argumentos de Server Actions, URLs de pedidos/fetch e consola do browser.
  // Diagnóstico de Auth deve usar apenas resultados sanitizados, nunca dados brutos.
  logging: false,
  allowedDevOrigins: ["127.0.0.1", ...(codespaceHost ? [codespaceHost] : [])],
  experimental: {
    serverActions: { allowedOrigins: codespaceHost ? [codespaceHost] : [] },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      ...["/auth/confirm", "/actualizar-palavra-passe", "/recuperar-acesso", "/entrar", "/acesso-restrito", "/diagnostico-csrf"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      })),
    ];
  },
};
export default config;
