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
  Code,
} from '@chakra-ui/react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabase/client'

// Debug flag
const DEBUG = true

function debug(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args)
  }
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Simple type for user data
type UserData = {
  token_balance?: number
}

type DebugInfo = {
  sessionCheck?: { timestamp: string; hasSession: boolean };
  sessionError?: { timestamp: string; error: any };
  userData?: { timestamp: string; data: any };
  dataError?: { timestamp: string; error: any };
  signIn?: { timestamp: string; data: any };
  signInError?: { timestamp: string; error: any };
  signOut?: { timestamp: string; success: boolean };
  signOutError?: { timestamp: string; error: any };
  purchase?: { timestamp: string; sessionId: string };
  purchaseError?: { timestamp: string; error: any };
}

export default function Home() {
  console.log('[DEBUG] Initializing Home page', {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasStripe: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  });
  
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({})
  const toast = useToast()

  useEffect(() => {
    debug('Component mounted')
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      debug('Auth state changed:', { event: _event, hasSession: !!session })
      setSession(session)
      if (session) {
        fetchDashboardData(session)
      }
    })

    return () => {
      debug('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    debug('Checking user session')
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        debug('Session error:', sessionError)
        throw sessionError
      }
      
      debug('Session check result:', { hasSession: !!session })
      setSession(session)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, sessionCheck: { timestamp: new Date().toISOString(), hasSession: !!session }}))
      
      if (session) {
        await fetchDashboardData(session)
      }
    } catch (error) {
      console.error('Error checking user session:', error)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, sessionError: { timestamp: new Date().toISOString(), error }}))
    } finally {
      setLoading(false)
    }
  }

  async function fetchDashboardData(currentSession: any) {
    if (!currentSession) {
      debug('No session provided to fetchDashboardData')
      return
    }

    debug('Fetching dashboard data for user:', currentSession.user.id)
    try {
      const { data: userData, error } = await supabase
        .from('user_quick_reference')
        .select('*')
        .eq('user_id', currentSession.user.id)
        .single()

      if (error) {
        debug('Error fetching user data:', error)
        throw error
      }

      debug('Dashboard data fetched:', userData)
      setData(userData)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, userData: { timestamp: new Date().toISOString(), data: userData }}))
      setError('')
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Error fetching data')
      setDebugInfo((prev: DebugInfo) => ({ ...prev, dataError: { timestamp: new Date().toISOString(), error }}))
      toast({
        title: 'Error fetching data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  async function handleSignIn() {
    debug('Initiating sign in')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      
      if (error) {
        debug('Sign in error:', error)
        throw error
      }
      
      debug('Sign in initiated:', data)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, signIn: { timestamp: new Date().toISOString(), data }}))
    } catch (error) {
      console.error('Error signing in:', error)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, signInError: { timestamp: new Date().toISOString(), error }}))
      toast({
        title: 'Error signing in',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  async function handleSignOut() {
    debug('Initiating sign out')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        debug('Sign out error:', error)
        throw error
      }
      debug('Successfully signed out')
      setSession(null)
      setData(null)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, signOut: { timestamp: new Date().toISOString(), success: true }}))
    } catch (error) {
      console.error('Error signing out:', error)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, signOutError: { timestamp: new Date().toISOString(), error }}))
      toast({
        title: 'Error signing out',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  async function handlePurchaseTokens() {
    debug('Initiating token purchase')
    try {
      setPurchaseLoading(true)
      if (!session) {
        throw new Error('Please sign in to purchase tokens')
      }

      debug('Making checkout session request')
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_100_tokens',
          userId: session.user.id,
        }),
      })

      if (!response.ok) {
        debug('Checkout session response not ok:', response.status)
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      debug('Got checkout session:', sessionId)
      
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to initialize')

      debug('Redirecting to checkout')
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
      if (stripeError) {
        debug('Stripe redirect error:', stripeError)
        throw stripeError
      }
      
      setDebugInfo((prev: DebugInfo) => ({ ...prev, purchase: { timestamp: new Date().toISOString(), sessionId }}))
    } catch (error) {
      console.error('Error:', error)
      setDebugInfo((prev: DebugInfo) => ({ ...prev, purchaseError: { timestamp: new Date().toISOString(), error }}))
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
          <VStack spacing={4}>
            <Text>Loading...</Text>
            {DEBUG && (
              <Code p={4} borderRadius="md">
                Debug Info: Initializing...
              </Code>
            )}
          </VStack>
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
            {DEBUG && (
              <Code p={4} borderRadius="md" whiteSpace="pre-wrap">
                Debug Info:{'\n'}
                {JSON.stringify(debugInfo, null, 2)}
              </Code>
            )}
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

        {DEBUG && (
          <Box mt={8} p={4} borderRadius="md" borderWidth={1}>
            <Heading size="sm" mb={4}>Debug Information</Heading>
            <Code display="block" whiteSpace="pre-wrap" p={4} borderRadius="md">
              {JSON.stringify({
                session: {
                  user: session?.user?.id,
                  authenticated: !!session,
                },
                ...debugInfo,
                currentState: {
                  loading,
                  error,
                  hasData: !!data,
                  purchaseLoading,
                }
              }, null, 2)}
            </Code>
          </Box>
        )}
      </VStack>
    </Container>
  )
} 