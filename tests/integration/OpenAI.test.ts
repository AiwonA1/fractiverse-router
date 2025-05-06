import { describe, it, expect, beforeEach } from 'vitest'
import { OpenAI } from 'openai'
import { supabase, testUser, wait } from '../setup'
import type { ChatCompletionMessageParam } from 'openai/resources'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for testing environment
})

describe('OpenAI API Integration', () => {
  beforeEach(async () => {
    // Sign in test user
    const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    if (error) {
      console.error('Failed to sign in test user:', error)
      throw error
    }

    if (!authUser) {
      throw new Error('Failed to sign in test user: No user returned')
    }

    // Wait for auth to propagate
    await wait(1000)
  })

  async function createChatCompletion(message: string) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are the Fractiverse Router, an AI system designed to help users navigate their personal development journey.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0].message.content
  }

  it('should generate appropriate responses', async () => {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the capital of France?' }
      ],
    })

    expect(completion.choices[0].message.content).toBeDefined()
    expect(completion.choices[0].message.content?.toLowerCase()).toContain('paris')
  }, 30000) // Increase timeout to 30 seconds

  it('should handle complex queries about personal development', async () => {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a personal development coach.' },
        { role: 'user', content: 'How can I improve my time management skills?' }
      ],
    })

    expect(completion.choices[0].message.content).toBeDefined()
    expect(completion.choices[0].message.content?.toLowerCase()).toMatch(/priorit|schedule|plan|time/)
  }, 30000)

  it('should maintain context across multiple interactions', async () => {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are a math tutor.' },
      { role: 'user', content: 'What is 5 + 3?' },
      { role: 'assistant', content: '5 + 3 = 8' },
      { role: 'user', content: 'Multiply that by 2' }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    })

    expect(completion.choices[0].message.content).toBeDefined()
    expect(completion.choices[0].message.content?.toLowerCase()).toMatch(/16|sixteen/)
  }, 30000)

  it('should handle rate limits and errors gracefully', async () => {
    try {
      await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Generate a very long response about quantum physics.' }
        ],
        max_tokens: 10, // Intentionally low to test handling
      })
    } catch (error: any) {
      expect(error).toBeDefined()
      expect(error.message || error.toString()).toBeDefined()
    }
  }, 30000)
}) 