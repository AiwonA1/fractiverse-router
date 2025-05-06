'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  useToast,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabase/client'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Simple type for user data
type UserData = {
  token_balance?: number
}

export default function Dashboard() {
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session')
      }

      const { data: userData, error } = await supabase
        .from('user_quick_reference')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) throw error

      setData(userData)
      setError('')
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Error fetching data')
      toast({
        title: 'Error fetching data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchaseTokens() {
    try {
      setPurchaseLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please sign in to purchase tokens')
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_100_tokens',
          userId: session.user.id,
        }),
      })

      const { sessionId } = await response.json()
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to initialize')

      await stripe.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error initiating purchase',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setPurchaseLoading(false)
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {error && (
          <Alert 
            status="error" 
            data-testid="dashboard-error"
            bgColor="red.500"
            color="white"
            variant="solid"
          >
            <AlertIcon color="white" />
            {error}
          </Alert>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Dashboard</Heading>
          <Button
            colorScheme="blue"
            onClick={handlePurchaseTokens}
            isLoading={purchaseLoading}
            loadingText="Processing..."
            data-testid="purchase-tokens-button"
            disabled={purchaseLoading}
            aria-busy={purchaseLoading}
            _disabled={{
              opacity: 0.6,
              cursor: 'not-allowed'
            }}
          >
            Purchase Tokens
          </Button>
        </Box>

        {/* Dashboard content will be implemented here */}
      </VStack>
    </Container>
  )
} 