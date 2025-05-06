import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function createNewSignup() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'espressolico@gmail.com',
      email_confirm: false,
      password: 'YourTemporaryPassword123!',
      user_metadata: {
        registration_date: new Date().toISOString()
      }
    })

    if (error) {
      console.error('Error creating user:', error.message)
      return
    }

    console.log('User created successfully!')
    console.log('User ID:', data.user.id)
    console.log('Please check your email for the confirmation link.')

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createNewSignup() 