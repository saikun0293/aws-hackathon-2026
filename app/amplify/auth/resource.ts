import { defineAuth } from "@aws-amplify/backend"

/**
 * Define and configure your auth resource.
 * Supports email/password login with optional social providers (Google, Apple, Facebook).
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true
  }
})
