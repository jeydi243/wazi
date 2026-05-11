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
        from: vi.fn().mockImplementation((table) => {
            if (table === 'lookups') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({ 
                        data: [{ id: '1', nom: 'Category 1' }], 
                        error: null 
                    })
                }
            }
            return {
                select: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis()
            }
        })
    }
    return () => mockSupabase
})

describe('ArticlesAddModal', () => {
    it('renders correctly', async () => {
        const component = await mountSuspended(AddModal)

        expect(component.text()).toContain('Add article')
    })
})
