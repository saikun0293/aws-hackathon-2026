import { type ClientSchema, a, defineData } from "@aws-amplify/backend"

/**
 * Define your data model.
 * The Todo model below is a starter — replace with your own models.
 * @see https://docs.amplify.aws/gen2/build-a-backend/data/data-modeling
 */
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      isDone: a.boolean()
    })
    .authorization((allow) => [allow.owner()])
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  }
})
