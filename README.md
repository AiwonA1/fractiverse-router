# Fractiverse Router

[![Vercel Deployment Status](https://therealsujitk-vercel-badge.vercel.app/?app=fractiverse-router-layer4-layer8)](https://fractiverse-router-layer4-layer8.vercel.app)

## Environment Setup

This project uses environment variables for configuration. These are split between client-side (public) and server-side (private) variables.

### Environment Files

1. Copy `.env.example` to create your environment files:
```bash
cp .env.example .env        # Production/development environment
cp .env.example .env.test   # Test environment
```

2. Update the environment variables in each file with your actual values:

- **Supabase Configuration**
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for client-side operations
  - `SUPABASE_SERVICE_KEY`: Private service key for server-side operations

- **OpenAI Configuration**
  - `OPENAI_API_KEY`: Your OpenAI API key (server-side only)

- **Stripe Configuration**
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Public key for client-side Stripe operations
  - `STRIPE_SECRET_KEY`: Private key for server-side Stripe operations

- **Application Configuration**
  - `NEXT_PUBLIC_BASE_URL`: Base URL for your application

### Security Considerations

1. Never commit environment files (`.env`, `.env.test`, etc.) to version control
2. Keep server-side keys secure and never expose them to the client
3. Use appropriate key prefixes:
   - `NEXT_PUBLIC_` for client-side variables
   - No prefix for server-side variables

### Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Testing

1. Set up test environment:
```bash
cp .env.example .env.test
```

2. Update test credentials in `.env.test`

3. Run tests:
```bash
npm test
```

## Project Structure

- `src/lib/server/config.ts`: Server-side configuration and environment validation
- `src/lib/client/config.ts`: Client-side configuration
- `tests/`: Test files and configuration

## Security Best Practices

1. All sensitive keys and credentials are stored in environment variables
2. Server-side operations use service keys
3. Client-side operations use public keys only
4. Environment files are git-ignored
5. Type-safe environment variable access
6. Validation of required environment variables
7. Separation of client and server configurations 