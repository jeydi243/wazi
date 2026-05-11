import { serverSupabaseServiceRole } from '#supabase/server'
import { createRouter, defineEventHandler, useBase } from 'h3'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseServiceRole(event)
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User ID is required',
        })
    }

    const { email, password, user_metadata, email_confirm } = body

    const { data, error } = await client.auth.admin.updateUserById(id, {
        email,
        password,
        user_metadata,
        email_confirm: email_confirm,
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data.user
})
