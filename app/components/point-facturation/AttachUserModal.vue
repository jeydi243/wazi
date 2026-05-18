<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { Organisation, Profil } from '~/types'

const props = defineProps<{
    parent: Organisation | null
}>()

const emit = defineEmits(['user-added'])

const schema = z.object({
    user_id: z.string().min(1, 'Utilisateur requis'),
    date_debut: z.date({ message: 'Date de début requise' }),
    date_fin: z.date().optional()
})

const open = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    user_id: undefined,
    date_debut: undefined,
    date_fin: undefined
})

const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())

const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

const dateDebutModel = computed<any>({
    get: () => state.date_debut ? toCalendarDate(state.date_debut) : undefined,
    set: (value: any) => {
        state.date_debut = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})

const dateFinModel = computed<any>({
    get: () => state.date_fin ? toCalendarDate(state.date_fin) : undefined,
    set: (value: any) => {
        state.date_fin = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})

// Fetch users (profils)
const { data: profils } = await useAsyncData('profil-items-for-attach', async () => {
    const { data, error } = await supabase
        .from('profils')
        .select('id, nom, prenom, postnom, user_id')
    if (error) throw error
    return data as Profil[]
})

const profilItems = computed<SelectMenuItem[]>(() => profils.value?.map((p: Profil) => ({
    label: `${p.nom} ${p.prenom} ${p.postnom || ''}`,
    id: p.user_id
})) || [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!props.parent?.id) return

    // Find lookup for affectation type "Facturation" or general TYPE_AFFECTATION
    const { data: lookupData } = await (supabase
        .from('lookups')
        .select('id, classes!inner(*)')
        .eq('classes.table_name', 'TYPE_AFFECTATION')
        .ilike('nom', '%facturation%')
        .single() as any)

    let lookupId = lookupData?.id
    if (!lookupId) {
        const { data: fallbackLookup } = await (supabase
            .from('lookups')
            .select('id, classes!inner(*)')
            .eq('classes.table_name', 'TYPE_AFFECTATION')
            .limit(1)
            .single() as any)
        lookupId = fallbackLookup?.id
    }

    if (!lookupId) {
        toast.add({ title: 'Erreur', description: 'Aucun type d\'affectation trouvé dans la base de données', color: 'error' })
        return
    }

    const { data, error } = await (supabase.from('affectations') as any)
        .insert({
            user_id: event.data.user_id,
            organisation_id: props.parent.id,
            lookup_id: lookupId,
            date_debut: event.data.date_debut?.toISOString(),
            date_fin: event.data.date_fin?.toISOString() || null
        })
        .select()

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: `Utilisateur attaché avec succès`, color: 'success' })
        emit('user-added')
        open.value = false
        // Reset state
        state.user_id = undefined
        state.date_debut = undefined
        state.date_fin = undefined
    }
}
</script>

<template>
    <UModal v-model:open="open" title="Attacher un utilisateur" description="Attacher un utilisateur à cette organisation">
        <UButton label="Attacher un utilisateur" icon="i-lucide-plus" size="sm" variant="subtle" />

        <template #body>
            <div v-if="props.parent" class="mb-4 p-3 bg-(--ui-bg-elevated) rounded-lg border border-(--ui-border) text-sm">
                <!-- <p class="text-(--ui-text-muted) flex items-center gap-2 mb-1">
                    <UIcon name="i-lucide-building" />
                    Organisation Parente
                </p> -->
                <p class="font-medium text-(--ui-text-highlighted)">
                    {{ props.parent.nom }} 
                    <span class="text-xs font-mono opacity-60 ml-1">({{ props.parent.code || 'N/A' }})</span>
                </p>
            </div>

            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Utilisateur" name="user_id">
                    <USelectMenu v-model="state.user_id" class="w-full" value-key="id" :items="profilItems" placeholder="Choisir un utilisateur" />
                </UFormField>
                <UFormField label="Date debut" name="date_debut">
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
                <UFormField label="Date fin" name="date_fin">
                    <UInputDate v-model="dateFinModel" class="w-full">
                        <template #trailing>
                            <UPopover>
                                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                         aria-label="Select a date" class="px-0" />

                                <template #content>
                                    <UCalendar v-model="dateFinModel" class="p-2" />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                </UFormField>
        
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Attacher" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
