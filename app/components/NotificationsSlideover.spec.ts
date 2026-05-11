import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import NotificationsSlideover from './NotificationsSlideover.vue'

// Mock useDashboard
mockNuxtImport('useDashboard', () => {
    return () => ({
        isNotificationsSlideoverOpen: ref(true)
    })
})

// Mock useFetch
mockNuxtImport('useFetch', () => {
    return () => ({
        data: ref([
            {
                id: '1',
                unread: true,
                sender: { name: 'Test User', avatar: { src: '' } },
                date: new Date().toISOString(),
                body: 'Test notification'
            }
        ])
    })
})

describe('NotificationsSlideover', () => {
    it('renders notifications correctly', async () => {
        const component = await mountSuspended(NotificationsSlideover, {
            global: {
                stubs: {
                    // Stub USlideover to render slots inline and avoid teleportation issues
                    USlideover: {
                        props: ['title', 'open'],
                        template: '<div v-if="open"><h1>{{ title }}</h1><slot name="body" /></div>'
                    },
                    UChip: { template: '<div><slot /></div>' },
                    UAvatar: { template: '<img>' },
                    UIcon: true,
                    NuxtLink: { template: '<a><slot /></a>' }
                }
            }
        })

        expect(component.text()).toContain('Notifications')
        expect(component.text()).toContain('Test User')
        expect(component.text()).toContain('Test notification')
    })
})
