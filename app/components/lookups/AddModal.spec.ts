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
            select: vi.fn().mockResolvedValue({ data: [{ id: '1', nom: 'New Lookup' }], error: null })
        }))
    }
    return () => mockSupabase
})

// Mock useParametresStore
mockNuxtImport('useParametresStore', () => {
    return () => ({
        getClasseItems: [{ label: 'Classe A', id: '1' }]
    })
})

describe('LookupsAddModal', () => {
    it('renders correctly', async () => {
        const component = await mountSuspended(AddModal, {
            props: {
                classe_id: '1'
            }
        })

        expect(component.text()).toContain('New lookup')
    })
})
