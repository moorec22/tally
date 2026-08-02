export type Env = {
  ASSETS: Fetcher
  DB: D1Database
  AUTH_BYPASS_EMAIL?: string
  CF_ACCESS_AUD?: string
  CF_ACCESS_TEAM_DOMAIN?: string
}

export type Account = {
  email_address: string
}
