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
  Text,
  Center,
} from '@chakra-ui/react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabase/client'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Simple type for user data
type UserData = {
  token_balance?: number
}

export default function Home() {
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState<any>(null)
  const toast = useToast()

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchDashboardData(session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) {
        await fetchDashboardData(session)
      }
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDashboardData(currentSession: any) {
    if (!currentSession) return

    try {
      const { data: userData, error } = await supabase
        .from('user_quick_reference')
        .select('*')
        .eq('user_id', currentSession.user.id)
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
    }
  }

  async function handleSignIn() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      toast({
        title: 'Error signing in',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
      setData(null)
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'Error signing out',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  async function handlePurchaseTokens() {
    try {
      setPurchaseLoading(true)
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

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center>
          <Text>Loading...</Text>
        </Center>
      </Container>
    )
  }

  if (!session) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center>
          <VStack spacing={4}>
            <Heading size="lg">Welcome to Fractiverse Router</Heading>
            <Text>Please sign in to continue</Text>
            <Button
              colorScheme="blue"
              onClick={handleSignIn}
            >
              Sign in with GitHub
            </Button>
          </VStack>
        </Center>
      </Container>
    )
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
          <Box>
            <Button
              colorScheme="blue"
              onClick={handlePurchaseTokens}
              isLoading={purchaseLoading}
              loadingText="Processing..."
              data-testid="purchase-tokens-button"
              disabled={purchaseLoading}
              aria-busy={purchaseLoading}
              mr={4}
              _disabled={{
                opacity: 0.6,
                cursor: 'not-allowed'
              }}
            >
              Purchase Tokens
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </Box>
        </Box>

        {data?.token_balance !== undefined && (
          <Box>
            <Text fontSize="lg">Token Balance: {data.token_balance}</Text>
          </Box>
        )}
      </VStack>
    </Container>
  )
} 