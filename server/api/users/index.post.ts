import { serverSupabaseServiceRole } from '#supabase/server'
import { createRouter, defineEventHandler, useBase } from 'h3'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseServiceRole(event)
    const body = await readBody(event)

    const { email, password, email_confirm, user_metadata } = body

    if (!email || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email and password are required',
        })
    }

    const { data, error } = await client.auth.admin.createUser({
        email,
        password,
        email_confirm: email_confirm ?? true,
        user_metadata,
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data.user
})
