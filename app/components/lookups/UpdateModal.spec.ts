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
            select: vi.fn().mockResolvedValue({ data: [{ id: '1', nom: 'Updated Lookup' }], error: null })
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

describe('LookupsUpdateModal', () => {
    const mockLookup = {
        id: '1',
        nom: 'Old Lookup',
        code: 'OLD-001',
        classe_id: '1',
        description: 'Old Description'
    }

    it('renders correctly', async () => {
        const component = await mountSuspended(UpdateModal, {
            props: {
                lookup: mockLookup,
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
                    USelectMenu: { template: '<div><slot /></div>' },
                    UButton: { template: '<button><slot /></button>' },
                    UForm: { template: '<form><slot /></form>' },
                    UIcon: true
                }
            }
        })

        expect(component.text()).toContain('Lookup')
    })
})
