import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resendConfirmation() {
  try {
    // First, get the user
    const { data: users, error: userError } = await supabaseAdmin
      .from('auth.users')
      .select('*')
      .eq('email', 'espressolico@gmail.com')
      .single()

    if (userError) {
      console.error('Error finding user:', userError)
      return
    }

    // Then resend the confirmation email
    const { data, error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: 'espressolico@gmail.com',
    })

    if (error) {
      console.error('Error resending confirmation:', error)
      return
    }

    console.log('Confirmation email has been resent.')
    console.log('Response:', data)
  } catch (err) {
    console.error('Error:', err)
  }
}

resendConfirmation() 