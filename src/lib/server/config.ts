// Server-side environment configuration
const requiredServerEnvVars = [
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
] as const

const requiredPublicEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_BASE_URL',
] as const

type ServerEnvVars = typeof requiredServerEnvVars[number]
type PublicEnvVars = typeof requiredPublicEnvVars[number]

// Validate server environment variables
function validateEnvVars() {
  const missing: string[] = []

  requiredServerEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  })

  requiredPublicEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  })

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Only validate on server side
if (typeof window === 'undefined') {
  validateEnvVars()
}

export const serverConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
  },
} as const

// Type helper for environment variables
export function getServerEnvVar(key: ServerEnvVars): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export function getPublicEnvVar(key: PublicEnvVars): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
} 