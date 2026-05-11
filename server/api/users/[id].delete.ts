import { serverSupabaseServiceRole } from '#supabase/server'
import { createRouter, defineEventHandler, useBase } from 'h3'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseServiceRole(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User ID is required',
        })
    }

    const { data, error } = await client.auth.admin.deleteUser(id)

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return { message: 'User deleted successfully' }
})
