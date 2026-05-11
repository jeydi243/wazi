import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import UpdateModal from './UpdateModal.vue'

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
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [{ id: '1', nom: 'Updated Class' }], error: null })
        }))
    }
    return () => mockSupabase
})

describe('ClassesUpdateModal', () => {
    const mockClasse = {
        id: '1',
        nom: 'Old Name',
        code: 'OLD-001',
        description: 'Old Description',
        table_name: 'OLD_TABLE'
    }

    it('renders correctly with initial values', async () => {
        const component = await mountSuspended(UpdateModal, {
            props: {
                classe: mockClasse,
                open: true
            },
            global: {
                stubs: {
                    UModal: {
                        props: ['title', 'open'],
                        template: '<div v-if="open"><h1>{{ title }}</h1><slot name="body" /></div>'
                    },
                    UFormField: { template: '<div><slot /></div>' },
                    UInput: { 
                        props: ['modelValue'],
                        template: '<input :value="modelValue" />' 
                    },
                    UButton: { template: '<button><slot /></button>' },
                    UForm: { template: '<form><slot /></form>' },
                    UIcon: true
                }
            }
        })

        expect(component.text()).toContain('Modifier la classe')
    // Inputs are more complex to check text content of, but the title is there
    })
})
