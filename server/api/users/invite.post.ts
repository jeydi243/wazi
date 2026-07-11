import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const client = await serverSupabaseServiceRole(event)
    const body = await readBody(event)

    const { email, redirectTo } = body

    if (!email) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email is required',
        })
    }

    const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo || undefined,
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data.user
})
