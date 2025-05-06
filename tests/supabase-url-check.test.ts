import { describe, it, expect } from 'vitest'
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

describe('Supabase URL Check', () => {
  it('should load and validate Supabase URL', () => {
    // Load environment variables
    const envPath = path.resolve(process.cwd(), '.env.test')
    console.log('Loading from:', envPath)
    const result = dotenv.config({ path: envPath })
    
    // Log the results
    console.log('Dotenv result:', {
      error: result.error,
      parsed: result.parsed ? {
        ...result.parsed,
        NEXT_PUBLIC_SUPABASE_URL: result.parsed.NEXT_PUBLIC_SUPABASE_URL,
        // Hide sensitive values
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '[HIDDEN]',
        SUPABASE_SERVICE_KEY: '[HIDDEN]',
        STRIPE_SECRET_KEY: '[HIDDEN]',
        OPENAI_API_KEY: '[HIDDEN]'
      } : null
    })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log('URL from process.env:', url)
    console.log('URL type:', typeof url)
    console.log('URL length:', url?.length)
    
    // Verify URL
    expect(url).toBe('https://akblhlomvguiczxglzis.supabase.co')
    
    // Try creating a client
    try {
      const client = createClient(
        url!,
        'dummy-key-for-testing',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      )
      console.log('Client created successfully')
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  })
}) 