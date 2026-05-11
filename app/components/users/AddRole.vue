<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Lookup, Organisation, Profil } from '~/types'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const props = defineProps<{
    user: Profil | null
}>()

const emit = defineEmits(['role-added'])

const supabase = useSupabaseClient()
const toast = useToast()
const open = ref(false)
const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())

const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}
const schema = z.object({
    role_id: z.string().min(1, 'Role requis'),
    user_id: z.string().min(1, 'Veuillez specifier l\'utilisateur'),
    date_debut: z.date().max(new Date(), 'Date de debut doit etre inferieur à la date actuelle')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    role_id: undefined,
    user_id: props.user?.id,
    date_debut: undefined
})

watch(() => props.user, (newVal) => {
    if (newVal) {
        state.user_id = newVal.id
    }
}, { immediate: true })

const inputDateDebutRef = useTemplateRef('inputDateDebutRef')
const dateDebutModel = computed({
    get: () => state.date_debut ? toCalendarDate(state.date_debut) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_debut = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})



// Fetch Lookups for role types
const { data: roles } = await useAsyncData('role-items', async () => {
    const { data, error } = await supabase
        .from('roles')
        .select('id, nom, code')
    if (error) throw error
    return data
})

// Fetch Services (Organisations with "Service Médicale" description in lookup)
const { data: profils } = await useAsyncData('profil-items', async () => {
    const { data, error } = await supabase
        .from('profils')
        .select('id, nom, prenom, postnom')
    if (error) throw error
    return data as Profil[]
})

const rolesItems = computed<SelectMenuItem[]>(() => roles.value?.map((l: any) => ({
    label: l.nom,
    id: l.id
})) || [])

const profilItems = computed<SelectMenuItem[]>(() => profils.value?.map((profil: Profil) => ({
    label: `${profil.nom} ${profil.prenom}`,
    id: profil.id
})) || [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { error } = await (supabase.from('user_roles') as any)
        .insert({
            ...event.data
        } as never)

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Affectation ajoutée avec succès', color: 'success' })
        open.value = false
        emit('role-added')

        // Reset state
        state.role_id = undefined
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Attribuer un role" description="Attribuer un role à l'utilisateur">
        <UButton icon="i-lucide-plus" label="Attribuer un role" color="primary" size="sm" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Utilisateur" name="user_id" class="w-full">
                    <USelectMenu v-model="state.user_id" class="w-full" value-key="id" :items="profilItems"
                                 placeholder="Choisir un service..." icon="i-lucide-building" disabled />
                </UFormField>
                <UFormField label="Role" name="role_id" class="w-full">
                    <USelectMenu v-model="state.role_id" class="w-full" value-key="id" :items="rolesItems"
                                 placeholder="Sélectionner un role..." />
                </UFormField>
                <UFormField label="Date de debut" placeholder="08/12/2025" name="date_debut">
                    <UInputDate v-model="dateDebutModel" class="w-full" :max-date="maxDate">
                        <template #trailing>
                            <UPopover>
                                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                         aria-label="Select a date" class="px-0" />

                                <template #content>
                                    <UCalendar v-model="dateDebutModel" class="p-2" :max-date="maxDate" />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                </UFormField>

                <div class="flex justify-end gap-2 pt-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Attribuer un role" color="primary" icon="material-symbols:add" variant="solid"
                             type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>