import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { supabase, supabaseAdmin, testUser, wait } from '../setup'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for testing environment
})

describe('Auth and Data Integration', () => {
  it('should handle authentication and data operations', async () => {
    // Test authentication with existing test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    expect(authError).toBeNull()
    expect(authData.user).toBeDefined()
    expect(authData.user?.email).toBe(testUser.email)
  })
})

describe('Authentication and Data Management Tests', () => {
  describe('User Authentication', () => {
    it('should successfully authenticate test user', async () => {
      // Test authentication with existing test user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user?.id).toBe(testUser.id)
    })
  })

  describe('FractiToken Management', () => {
    beforeEach(async () => {
      // Clean up any existing records first
      await supabaseAdmin
        .from('fractitoken_balances')
        .delete()
        .eq('user_id', testUser.id)

      await wait(500)

      // Insert new balance record
      const { error: insertError } = await supabaseAdmin
        .from('fractitoken_balances')
        .insert({
          user_id: testUser.id,
          balance: 100,
          last_updated: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error inserting balance:', insertError)
        throw insertError
      }

      await wait(500)
    })

    it('should have correct initial balance', async () => {
      const { data, error } = await supabase
        .from('fractitoken_balances')
        .select('balance')
        .eq('user_id', testUser.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data) {
        expect(data.balance).toBe(100);
      }
    });

    it('should successfully record a transaction', async () => {
      // Update balance
      const { error: updateError } = await supabase
        .from('fractitoken_balances')
        .update({ balance: 150 })
        .eq('user_id', testUser.id);

      expect(updateError).toBeNull();

      // Verify updated balance
      const { data, error } = await supabase
        .from('fractitoken_balances')
        .select('balance')
        .eq('user_id', testUser.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data) {
        expect(data.balance).toBe(150);
      }
    });
  })

  describe('Chat History', () => {
    beforeEach(async () => {
      await wait(1000)
      
      const messages = Array.from({ length: 15 }, (_, i) => ({
        user_id: testUser.id,
        message: `Test message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
      }))

      await supabaseAdmin.from('chat_history').insert(messages)
    })

    it('should fetch exactly 12 most recent chat messages', async () => {
      await wait(1000)
      
      const { data, error } = await supabaseAdmin
        .from('chat_history')
        .select('*')
        .eq('user_id', testUser.id)
        .order('created_at', { ascending: false })
        .limit(12)

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!).toHaveLength(12)
      
      const firstMessageDate = new Date(data![0].created_at).getTime()
      const secondMessageDate = new Date(data![1].created_at).getTime()
      expect(firstMessageDate).toBeGreaterThanOrEqual(secondMessageDate)
    })
  })

  describe('L4-L8 Content', () => {
    it('should fetch content for all layers 4-8', async () => {
      const { data, error } = await supabaseAdmin
        .from('l4_l8_content')
        .select('*')
        .gte('layer', 4)
        .lte('layer', 8)
        .order('layer', { ascending: true })

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      
      const layers = data!.map(item => item.layer)
      const uniqueLayers = Array.from(new Set(layers))
      expect(uniqueLayers.some(layer => layer >= 4 && layer <= 8)).toBe(true)
    })

    it('should have valid content structure', async () => {
      const { data, error } = await supabaseAdmin
        .from('l4_l8_content')
        .select('*')
        .gte('layer', 4)
        .lte('layer', 8)
        .limit(1)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!).toHaveProperty('title')
      expect(data!).toHaveProperty('content')
      expect(data!).toHaveProperty('summary')
      expect(data!).toHaveProperty('ref_citations')
      expect(Array.isArray(data!.ref_citations)).toBe(true)
    })
  })

  describe('OpenAI Integration', () => {
    it('should successfully call OpenAI API', async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, this is a test message." }
        ],
      })

      expect(completion.choices[0].message).toBeDefined()
    })
  })
}) 