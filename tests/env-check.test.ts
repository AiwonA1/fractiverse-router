import { describe, it, expect } from 'vitest'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') })

describe('Environment Variables', () => {
  it('should have all required environment variables', () => {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).not.toBe('your_supabase_url_here')
    
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).not.toBe('your_supabase_anon_key_here')
    
    expect(process.env.SUPABASE_SERVICE_KEY).toBeDefined()
    expect(process.env.SUPABASE_SERVICE_KEY).not.toBe('your_supabase_service_key_here')
    
    expect(process.env.STRIPE_SECRET_KEY).toBeDefined()
    expect(process.env.STRIPE_SECRET_KEY).not.toBe('sk_test_your_secret_key_here')
  })
}) 