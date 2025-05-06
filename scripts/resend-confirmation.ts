import { supabaseAdmin } from '../tests/setup'

async function resendConfirmation() {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: 'espressolico@gmail.com'
  })

  if (error) {
    console.error('Error generating confirmation link:', error)
    return
  }

  console.log('New confirmation email has been sent.')
  console.log('User data:', data)
}

resendConfirmation().catch(console.error) 