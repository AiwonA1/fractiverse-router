import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabase, supabaseAdmin } from '../setup'

const TEST_EMAIL = 'test.signup@example.com'
const TEST_PASSWORD = 'testPassword123!'

describe('User Signup Flow', () => {
  beforeEach(async () => {
    try {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const testUser = users?.users.find(user => user.email === TEST_EMAIL)
      if (testUser) {
        await supabaseAdmin.auth.admin.deleteUser(testUser.id)
      }
    } catch (error) {
      console.error('Error in test cleanup:', error)
    }
  })

  afterEach(async () => {
    try {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const testUser = users?.users.find(user => user.email === TEST_EMAIL)
      if (testUser) {
        await supabaseAdmin.auth.admin.deleteUser(testUser.id)
      }
    } catch (error) {
      console.error('Error in test cleanup:', error)
    }
  })

  it('should create a new user with auto confirmation', async () => {
    // Create new user with admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { name: 'Test Signup User' }
    })

    expect(error).toBeNull()
    expect(data?.user).toBeDefined()
    expect(data?.user?.email).toBe(TEST_EMAIL)
    expect(data?.user?.email_confirmed_at).toBeDefined()

    // Verify the user can sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    expect(signInError).toBeNull()
    expect(signInData?.user).toBeDefined()
    expect(signInData?.user?.email).toBe(TEST_EMAIL)
  })
}) 