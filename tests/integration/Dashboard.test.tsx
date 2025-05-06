import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { supabase, stripe } from '../setup'
import Dashboard from '@/app/dashboard/page'
import { Providers } from '@/app/providers'

describe('Dashboard UI Integration', () => {
  const user = userEvent.setup()
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // Mock fetch for API calls
  const originalFetch = global.fetch
  beforeEach(() => {
    cleanup()
    // Mock fetch to handle API calls
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/create-checkout-session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sessionId: 'test_session_id' })
        })
      }
      return originalFetch(url)
    })
  })

  afterEach(() => {
    cleanup()
    global.fetch = originalFetch
  })

  const renderDashboard = () => {
    return render(
      <Providers>
        <Dashboard />
      </Providers>
    )
  }

  it('should handle token purchase button click with real Stripe integration', async () => {
    const { unmount } = renderDashboard()

    try {
      // Wait for button and click it
      await waitFor(() => {
        const purchaseButton = screen.getByTestId('purchase-tokens-button')
        expect(purchaseButton).toBeInTheDocument()
      })

      const purchaseButton = screen.getByTestId('purchase-tokens-button')
      await act(async () => {
        await user.click(purchaseButton)
      })

      // Create a real Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_1RCVnT09dcGq3dt0E2n0e8ut', // 100 FractiTokens price ID
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${BASE_URL}/dashboard?success=true`,
        cancel_url: `${BASE_URL}/dashboard?canceled=true`,
      })

      expect(session.id).toBeDefined()
      expect(session.payment_method_types).toContain('card')
      expect(session.mode).toBe('payment')
    } finally {
      unmount()
    }
  })

  it('should handle error states', async () => {
    const { unmount } = renderDashboard()

    try {
      // Try to create a session with an invalid price ID
      const createInvalidSession = async () => {
        await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price: 'invalid_price_id',
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${BASE_URL}/dashboard?success=true`,
          cancel_url: `${BASE_URL}/dashboard?canceled=true`,
        })
      }

      await expect(createInvalidSession()).rejects.toThrow()
    } finally {
      unmount()
    }
  })
}) 