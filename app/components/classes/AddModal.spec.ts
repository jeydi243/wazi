import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AddModal from './AddModal.vue'

// Mock useToast
mockNuxtImport('useToast', () => {
    return () => ({
        add: vi.fn()
    })
})

// Mock useSupabaseClient
mockNuxtImport('useSupabaseClient', () => {
    const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [{ id: '1', nom: 'New Class' }], error: null })
        }))
    }
    return () => mockSupabase
})

describe('ClassesAddModal', () => {
    it('renders correctly', async () => {
        const component = await mountSuspended(AddModal)

        expect(component.text()).toContain('New classe')
    })
})
