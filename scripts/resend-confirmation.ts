import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resendConfirmation() {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: 'espressolico@gmail.com',
    password: 'temporaryPassword123!'
  })

  if (error) {
    console.error('Error generating confirmation link:', error)
    return
  }

  console.log('New confirmation email has been sent.')
  console.log('User data:', data)
}

resendConfirmation().catch(console.error) 