import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    testTimeout: 30000,
    env: {
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_KEY: 'test-key',
      SUPABASE_SERVICE_KEY: 'test-service-key',
    },
  },
})
