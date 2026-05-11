import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import UserMenu from './UserMenu.vue'

// Mock composables using mockNuxtImport
mockNuxtImport('useColorMode', () => {
    return () => ({ value: 'light', preference: 'light' })
})

mockNuxtImport('useAppConfig', () => {
    return () => ({
        ui: {
            colors: {
                primary: 'blue',
                neutral: 'slate'
            }
        },
        icon: {
            collections: []
        }
    })
})

mockNuxtImport('useSupabaseClient', () => {
    return () => ({
        auth: {
            signOut: vi.fn().mockResolvedValue({ error: null })
        }
    })
})

mockNuxtImport('useToast', () => {
    return () => ({
        add: vi.fn()
    })
})

mockNuxtImport('useSupabaseUser', () => {
    return () => ({
        value: { email: 'test@example.com' }
    })
})

mockNuxtImport('navigateTo', () => {
    return vi.fn()
})

describe('UserMenu', () => {
    it('renders user name correctly', async () => {
        const component = await mountSuspended(UserMenu, {
            props: {
                collapsed: false
            }
        })

        expect(component.text()).toContain('Benjamin Canac')
    })

    it('renders correctly when collapsed', async () => {
        const component = await mountSuspended(UserMenu, {
            props: {
                collapsed: true
            }
        })

        expect(component.text()).not.toContain('Benjamin Canac')
    })
})
