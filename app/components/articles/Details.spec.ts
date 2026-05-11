import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Details from './Details.vue'

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
            if (table === 'article_organisations') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({ 
                        data: [{ id: 1, created_at: new Date().toISOString(), organisation: { nom: 'Org 1' } }], 
                        error: null 
                    }),
                    delete: vi.fn().mockReturnThis(),
                    insert: vi.fn().mockReturnThis()
                }
            }
            if (table === 'organisations') {
                return {
                    select: vi.fn().mockReturnThis(),
                    not: vi.fn().mockReturnThis(),
                    then: vi.fn().mockImplementation((resolve) => resolve({ 
                        data: [{ id: '2', nom: 'Org 2' }], 
                        error: null 
                    }))
                }
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis()
            }
        })
    }
    return () => mockSupabase
})

describe('ArticlesDetails', () => {
    const mockArticle = {
        id: '1',
        nom: 'Test Article',
        code: 'ART-001',
        description: 'A test article description'
    }

    it('renders article details correctly', async () => {
        const component = await mountSuspended(Details, {
            props: {
                article: mockArticle,
                open: true
            },
            global: {
                stubs: {
                    UModal: {
                        props: ['title', 'open'],
                        template: '<div v-if="open"><h1>{{ title }}</h1><slot name="body" /></div>'
                    },
                    UFormField: { template: '<div><slot /></div>' },
                    USelectMenu: { template: '<div><slot /></div>' },
                    UButton: { template: '<button><slot /></button>' },
                    UTable: { 
                        props: ['data'],
                        template: '<table><tr v-for="item in data"><td>{{ item.organisation?.nom }}</td></tr></table>'
                    },
                    UIcon: true
                }
            }
        })

        expect(component.text()).toContain('Test Article')
        expect(component.text()).toContain('ART-001')
        expect(component.text()).toContain('A test article description')
        expect(component.text()).toContain('Org 1')
    })

    it('renders nothing when article is null', async () => {
        const component = await mountSuspended(Details, {
            props: {
                article: null,
                open: true
            },
            global: {
                stubs: {
                    UModal: {
                        props: ['open'],
                        template: '<div v-if="open"><slot name="body" /></div>'
                    },
                    UIcon: true
                }
            }
        })

        expect(component.text()).not.toContain('Test Article')
    // It should show a loader (UIcon with animate-spin)
    })
})
