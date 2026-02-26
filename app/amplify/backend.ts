import { defineBackend } from "@aws-amplify/backend"
import { auth } from "./auth/resource"
import { data } from "./data/resource"

/**
 * @see https://docs.amplify.aws/gen2/build-a-backend
 *
 * Add additional AWS services by importing their constructs and
 * passing them to defineBackend. For example:
 *   import { storage } from "./storage/resource";
 *   defineBackend({ auth, data, storage });
 */
defineBackend({
  auth,
  data
})
