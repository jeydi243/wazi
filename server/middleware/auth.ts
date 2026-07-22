export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    event.context.user = user
  }
  catch {
    event.context.user = null
  }
})

declare module 'h3' {
  interface H3EventContext {
    user: ReturnType<typeof serverSupabaseUser> extends Promise<infer T> ? T : never
  }
}
