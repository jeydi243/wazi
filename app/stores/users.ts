import { defineStore } from 'pinia'
import type {Owner, UserRole } from '~/types'

export const useUsersStore = defineStore('users', () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()
    const owners = ref<Owner[] | null>([])
    const usersRoles = ref<UserRole[]>([])


    async function init() {
        if (!user) {
            return {
                data: null,
                error: 'User not logged in',
                loading: false
            }
        }

        if (user.value) {
            const { data: usersRolesData, error: usersRolesError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', user.value.id)

            if (usersRolesData) usersRoles.value = usersRolesData as unknown as UserRole[]
        }


    }

    return {
        owners,
        usersRoles,
        init
    }
})
