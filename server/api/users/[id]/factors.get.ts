import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const client = await serverSupabaseServiceRole(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User ID is required',
        })
    }

    const { data, error } = await client.auth.admin.mfa.listFactors({ userId: id })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data.factors
})
