import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'
import path from 'path'
import '@testing-library/jest-dom/vitest'
import React from 'react'
import Stripe from 'stripe'

// Load test environment variables
const envPath = path.resolve(process.cwd(), '.env.test')
console.log('Loading environment variables from:', envPath)
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('Error loading .env.test file:', result.error)
} else {
  console.log('Environment file loaded successfully')
}

// Debug environment variables
console.log('Environment Variables Check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY)
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Verify environment variables before creating clients
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.test')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.test')
}
if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_KEY in .env.test')
}
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY in .env.test')
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY in .env.test')
}

console.log('Initializing Supabase client with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

let supabase: ReturnType<typeof createClient>
let supabaseAdmin: ReturnType<typeof createClient>
let stripe: Stripe
let openai: OpenAI

try {
  // Initialize Supabase client
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  )
  console.log('Supabase client initialized successfully')
} catch (error) {
  console.error('Error initializing Supabase client:', error)
  throw error
}

try {
  // Initialize Supabase Admin client
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  )
  console.log('Supabase Admin client initialized successfully')
} catch (error) {
  console.error('Error initializing Supabase Admin client:', error)
  throw error
}

try {
  // Initialize Stripe
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  })
  console.log('Stripe client initialized successfully')
} catch (error) {
  console.error('Error initializing Stripe client:', error)
  throw error
}

try {
  // Initialize OpenAI client
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  })
  console.log('OpenAI client initialized successfully')
} catch (error) {
  console.error('Error initializing OpenAI client:', error)
  throw error
}

// Export initialized clients
export { supabase, supabaseAdmin, stripe, openai }

// Test user data
export const testUser = {
  email: `test.${Date.now()}@fractiverse.test`,
  password: 'Test123!',
  id: '',
  metadata: {}
}

// Mock Chakra UI Next.js components
vi.mock('@chakra-ui/next-js', () => ({
  CacheProvider: ({ children }: { children: React.ReactNode }) => children,
  Image: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: any }) => 
    React.createElement('img', { src, alt, ...props })
}))

// Mock Next.js image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => {
    return React.createElement('img', { src: props.src, alt: props.alt })
  }
}))

// Mock ResizeObserver (required for React components)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver

// Helper function to wait for a specified time
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Create tables if they don't exist
async function createTables() {
  try {
    // Create users table
    await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'users',
      definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        email text UNIQUE,
        metadata jsonb
      `
    })

    // Create fractitoken_balances table
    await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'fractitoken_balances',
      definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        balance integer NOT NULL DEFAULT 0,
        last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id)
      `
    })

    // Create chat_history table
    await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'chat_history',
      definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        message text NOT NULL,
        role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      `
    })

    // Create l4_l8_content table
    await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'l4_l8_content',
      definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        layer integer NOT NULL CHECK (layer >= 4 AND layer <= 8),
        title text NOT NULL,
        content text NOT NULL,
        summary text,
        ref_citations jsonb DEFAULT '[]'::jsonb,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      `
    })

  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

// Add type declaration for global userId
declare global {
  var userId: string | undefined;
}

// Function to ensure test user exists and is signed in
async function ensureTestUser() {
  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    if (!signInError && signInData.user) {
      testUser.id = signInData.user.id
      testUser.metadata = signInData.user.user_metadata || {}
      return
    }

    // If sign in fails, create new user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true
    })

    if (createError) {
      throw createError
    }

    if (!userData.user) {
      throw new Error('Failed to create test user')
    }

    testUser.id = userData.user.id
    testUser.metadata = userData.user.user_metadata || {}

    // Sign in with new user
    const { error: newSignInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    if (newSignInError) {
      throw newSignInError
    }
  } catch (error) {
    console.error('Error ensuring test user:', error)
    throw error
  }
}

// Setup test environment
beforeAll(async () => {
  console.log('Setting up test environment with:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    testUser: testUser.email
  })

  try {
    // Create necessary tables first
    await createTables()
    await wait(1000)

    // Ensure test user exists and is signed in
    await ensureTestUser()
    await wait(1000)

    // Initialize user data
    await supabaseAdmin
      .from('fractitoken_balances')
      .upsert({ 
        user_id: testUser.id, 
        balance: 100,
        last_updated: new Date().toISOString()
      })
    await wait(1000)

    // Initialize chat history
    const messages = Array.from({ length: 15 }, (_, i) => ({
      user_id: testUser.id,
      message: `Test message ${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      created_at: new Date(Date.now() - (15 - i) * 60000).toISOString()
    }))

    await supabaseAdmin
      .from('chat_history')
      .upsert(messages)
    await wait(1000)

  } catch (error) {
    console.error('Failed to set up test environment:', error)
    throw error
  }
})

// Cleanup after each test
afterEach(async () => {
  // Ensure we're still signed in
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })
  }
  await wait(500)
})

// Cleanup after all tests
afterAll(async () => {
  try {
    // Clean up test data
    await supabaseAdmin
      .from('fractitoken_balances')
      .delete()
      .eq('user_id', testUser.id)
    await wait(500)

    await supabaseAdmin
      .from('chat_history')
      .delete()
      .eq('user_id', testUser.id)
    await wait(500)

    // Delete test user
    await supabaseAdmin.auth.admin.deleteUser(testUser.id)
    await wait(500)
  } catch (error) {
    console.error('Error in cleanup:', error)
  }
}) 