import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const client = await serverSupabaseServiceRole(event)
    const body = await readBody(event)

    const { type, email, redirectTo } = body

    if (!type || !email) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Type and email are required',
        })
    }

    const validTypes = ['signup', 'invite', 'magiclink', 'recovery', 'email_change_current', 'email_change_new']
    if (!validTypes.includes(type)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid type. Valid types: ${validTypes.join(', ')}`,
        })
    }

    const params: any = {
        type,
        email,
    }

    if (redirectTo) {
        params.options = { redirectTo }
    }

    const { data, error } = await client.auth.admin.generateLink(params)

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data.properties
})
