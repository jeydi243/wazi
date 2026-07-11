import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const client = await serverSupabaseServiceRole(event)

    const { data: { users }, error } = await client.auth.admin.listUsers()

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return users
})
