import { serverSupabaseServiceRole } from '#supabase/server'
// import { createRouter, defineEventHandler, useBase } from 'h3'


export default defineEventHandler(async (event) => {
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
