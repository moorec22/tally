import { createRemoteJWKSet, jwtVerify } from "jose"

import { jsonResponse } from "./http"
import type { Account, Env } from "./types"

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function normalizeAccessIssuer(teamDomain: string) {
  const normalizedTeamDomain = teamDomain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")

  return `https://${normalizedTeamDomain}`
}

function accessJwks(issuer: string) {
  const existingJwks = jwksByIssuer.get(issuer)

  if (existingJwks) {
    return existingJwks
  }

  const jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", issuer))
  jwksByIssuer.set(issuer, jwks)

  return jwks
}

export function parseAccessAudiences(accessAud: string) {
  return accessAud
    .split(",")
    .map((audience) => audience.trim())
    .filter(Boolean)
}

export async function authenticateRequest(
  request: Request,
  env: Env,
): Promise<Account> {
  if (env.AUTH_BYPASS_EMAIL) {
    return { email_address: env.AUTH_BYPASS_EMAIL }
  }

  const audiences = env.CF_ACCESS_AUD
    ? parseAccessAudiences(env.CF_ACCESS_AUD)
    : []

  if (audiences.length === 0 || !env.CF_ACCESS_TEAM_DOMAIN) {
    throw new Response("Cloudflare Access is not configured.", { status: 500 })
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion")

  if (!token) {
    throw jsonResponse({ error: "Authentication required" }, { status: 401 })
  }

  const issuer = normalizeAccessIssuer(env.CF_ACCESS_TEAM_DOMAIN)

  try {
    const { payload } = await jwtVerify(token, accessJwks(issuer), {
      audience: audiences,
      issuer,
    })

    if (typeof payload.email !== "string" || !payload.email.trim()) {
      throw new Error("Access token does not include an email claim.")
    }

    return { email_address: payload.email }
  } catch {
    throw jsonResponse({ error: "Authentication required" }, { status: 401 })
  }
}
