import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { supabase, supabaseAdmin, testUser, wait } from '../setup'
import { OpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources'
import { randomUUID } from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for testing environment
})

describe('Extended Authentication and AI Tests', () => {
  describe('Advanced Authentication', () => {
    let tempTestEmail: string
    let tempTestPassword: string

    beforeEach(() => {
      tempTestEmail = `test.${randomUUID()}@example.com`
      tempTestPassword = 'TestPassword123!'
    })

    afterEach(async () => {
      // Clean up temp test user
      try {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 100
        })
        const tempUser = users.find(u => u.email === tempTestEmail)
        if (tempUser) {
          await supabaseAdmin.auth.admin.deleteUser(tempUser.id)
        }
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    })

    it('should create and auto-confirm a new user', async () => {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: tempTestEmail,
        password: tempTestPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Test User',
          preferred_name: 'Tester'
        }
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      if (!data.user) throw new Error('User not created')
      expect(data.user.email).toBe(tempTestEmail)
      expect(data.user.email_confirmed_at).toBeDefined()
      expect(data.user.user_metadata.name).toBe('Test User')

      // Verify immediate sign-in works
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempTestEmail,
        password: tempTestPassword
      })

      expect(signInError).toBeNull()
      expect(signInData.session).toBeDefined()
    })

    it('should handle password reset with admin API', async () => {
      // First create a confirmed user
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: tempTestEmail,
        password: tempTestPassword,
        email_confirm: true
      })

      expect(createError).toBeNull()
      expect(userData.user).toBeDefined()
      if (!userData.user) throw new Error('User not created')

      // Update password using admin API
      const newPassword = 'NewTestPassword123!'
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.user.id,
        { password: newPassword }
      )

      expect(updateError).toBeNull()

      // Verify sign in with new password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempTestEmail,
        password: newPassword
      })

      expect(signInError).toBeNull()
      expect(signInData.session).toBeDefined()
    })
  })

  describe('Extended OpenAI Integration', () => {
    const systemPrompt = "You are an AI tutor specializing in computer networking concepts."
    const userContext = "I'm studying for my networking certification."
    
    it('should use GPT-3.5-turbo with proper message prepending', async () => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
        { role: "assistant", content: "I'll help you understand networking concepts. What would you like to know?" },
        { role: "user", content: "What is a subnet mask?" }
      ]

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 150
      })

      expect(completion.choices[0].message).toBeDefined()
      // Log messages sent to API for verification
      console.log('Messages sent to GPT-3.5:', JSON.stringify(messages, null, 2))
    }, 10000) // Increase timeout for OpenAI call

    // Note: Commenting out GPT-4 test as it requires special access
    /*
    it('should use GPT-4 with proper message prepending', async () => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
        { role: "user", content: "Can you explain TCP/IP?" }
      ]

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 150
      })

      expect(completion.choices[0].message).toBeDefined()
      console.log('Messages sent to GPT-4:', JSON.stringify(messages, null, 2))
    }, 15000)
    */
  })
})

describe('Extended Auth and AI Integration', () => {
  beforeAll(async () => {
    // Ensure we have a valid Supabase connection and OpenAI setup
    const { data, error } = await supabase.auth.getSession()
    expect(error).toBeNull()
  })

  it('should handle complex authentication and AI operations', async () => {
    // Test authentication with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    expect(authError).toBeNull()
    expect(authData.user).toBeDefined()
    expect(authData.user?.email).toBe(testUser.email)

    // Test AI operations
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for testing purposes.',
        },
        {
          role: 'user',
          content: 'What is 2+2?',
        },
      ],
    })

    expect(completion.choices[0].message.content).toBeDefined()
    expect(completion.choices[0].message.content?.toLowerCase()).toContain('4')

    // Test data operations with unique ID
    const testId = randomUUID()
    const { error: insertError } = await supabase
      .from('fractitoken_transactions')
      .insert({
        user_id: authData.user?.id,
        amount: 10,
        transaction_type: 'CREDIT',
        description: `Test transaction ${testId}`,
      })

    expect(insertError).toBeNull()

    // Verify transaction
    const { data: txData, error: txError } = await supabase
      .from('fractitoken_transactions')
      .select('*')
      .eq('description', `Test transaction ${testId}`)
      .single()

    expect(txError).toBeNull()
    expect(txData).toBeDefined()
    if (txData) {
      expect(txData.amount).toBe(10)
      expect(txData.transaction_type).toBe('CREDIT')
    }
  })
}) 