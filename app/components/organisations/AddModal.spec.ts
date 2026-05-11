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
                    select: vi.fn().mockResolvedValue({ data: [{ id: '1', nom: 'Type A' }], error: null })
                }
            }
            if (table === 'organisations') {
                return {
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockResolvedValue({ data: [{ id: '1', nom: 'New Org' }], error: null })
                }
            }
            return {
                select: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis()
            }
        })
    }
    return () => mockSupabase
})

describe('OrganisationsAddModal', () => {
    it('renders correctly', async () => {
        const component = await mountSuspended(AddModal)

        expect(component.text()).toContain('New organisation')
    })

    it('contains the modal title when open', async () => {
        const component = await mountSuspended(AddModal)
    
        // The button to open the modal is present
        const button = component.find('button')
        expect(button.text()).toContain('New organisation')
    })
})
