import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const client = await serverSupabaseServiceRole(event)
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User ID is required',
        })
    }

    const { ban } = body

    const banDuration = ban ? '876600h' : 'none'

    const { data, error } = await client.auth.admin.updateUserById(id, {
        ban_duration: banDuration,
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data.user
})
