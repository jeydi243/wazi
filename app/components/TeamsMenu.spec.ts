import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TeamsMenu from './TeamsMenu.vue'

describe('TeamsMenu', () => {
    it('renders correctly with default selected team', async () => {
        const component = await mountSuspended(TeamsMenu, {
            props: {
                collapsed: false
            }
        })

        expect(component.text()).toContain('Nuxt')
    })

    it('renders correctly when collapsed', async () => {
        const component = await mountSuspended(TeamsMenu, {
            props: {
                collapsed: true
            }
        })

        // Labels are hidden when collapsed
        expect(component.text()).not.toContain('Nuxt')
    })
})
