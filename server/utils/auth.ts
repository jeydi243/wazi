import type { H3Event } from 'h3'

export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé — authentification requise',
    })
  }

  return user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)

  const client = serverSupabaseServiceRole(event)

  const { data: userRoles, error: rolesError } = await client
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', user.id)
    .single()

  if (rolesError || !userRoles) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès refusé — rôle administrateur requis',
    })
  }

  const rolesData = userRoles.roles as unknown as { name: string }
  if (rolesData.name !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès refusé — rôle administrateur requis',
    })
  }

  return user
}
