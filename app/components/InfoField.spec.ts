import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import InfoField from './InfoField.vue'

describe('InfoField', () => {
    it('renders label and value correctly', async () => {
        const component = await mountSuspended(InfoField, {
            props: {
                label: 'Test Label',
                value: 'Test Value'
            }
        })

        expect(component.text()).toContain('Test Label')
        expect(component.text()).toContain('Test Value')
    })

    it('renders default value when value is missing', async () => {
        const component = await mountSuspended(InfoField, {
            props: {
                label: 'Test Label'
            }
        })

        expect(component.text()).toContain('—')
    })

    it('applies mono class when mono prop is true', async () => {
        const component = await mountSuspended(InfoField, {
            props: {
                label: 'Test Label',
                value: '12345',
                mono: true
            }
        })

        const valueElement = component.find('p.text-sm')
        expect(valueElement.classes()).toContain('font-mono')
    })
})
