<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Lookup, STKHeader } from '~/types'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const parametresStore = useParametresStore()

const schema = z.object({
    client_id: z.string({ message: 'Veuillez selectionner un client' }),
    type_facture: z.string({ message: 'Veuillez selectionner le type de facture' }),
    type_avoir: z.string({ message: 'Veuillez selectionner le type d\'avoir' }).optional(),
    numero_facture: z.string().optional(),
    devise: z.string({ message: 'Devise requis' }),
    mode_paiement: z.string({ message: 'Mode de paiement requis' }),
    condition_paiement: z.string({ message: 'Condition de paiement requis' }),
    date_facture: z.date({ message: 'Date de facture requis' }),
    user_id: z.string({ message: 'Utilisateur requis' })
})

const state = reactive<Partial<Schema>>({
    client_id: undefined,
    type_facture: undefined,
    mode_paiement: undefined,
    condition_paiement: undefined,
    devise: undefined,
    date_facture: undefined,
    numero_facture: undefined,
    user_id: user.value?.id || ''
})
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

const getTypeFactures = computed(() => parametresStore.getTypeFactures)  
const getDevises = computed(() => parametresStore.getDevise)  
const getTypeAvoirs = computed(() => parametresStore.getTypeAvoirs)
const getModePaiements = computed(() => parametresStore.getModePaiement)
const getConditionPaiements = computed(() => parametresStore.getConditionPaiement)
const getClients = computed(() => parametresStore.clients)


const dateTrxModel = computed({
    get: () => state.date_facture ? toCalendarDate(state.date_facture) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_facture = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})
const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())

const itemsTypeFacture = computed<SelectMenuItem[]>(() => getTypeFactures.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])

const itemsTypeAvoir = computed<SelectMenuItem[]>(() => getTypeAvoirs.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])
const itemsDevises = computed<SelectMenuItem[]>(() => getDevises.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])
const itemsModePaiements = computed<SelectMenuItem[]>(() => getModePaiements.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])
const itemsConditionPaiements = computed<SelectMenuItem[]>(() => getConditionPaiements.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])
const itemsClients = computed<SelectMenuItem[]>(() => getClients.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])

const emit = defineEmits(['facture-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...event.data }] as never[])
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Impossible d'ajouter la facture ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Facture Crée', description: `Nouvelle facture créée ${event.data.numero_facture}`, color: 'success' })
        emit('facture-added')
        open.value = false
    }
}
</script>


<template>
    <UModal v-model:open="open" title="Facturation" description="Ajouter une facture">
        <UButton label="Nouvelle Facture" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Client" placeholder="_" name="client_id">
                    <USelectMenu v-model="state.client_id" value-key="id" :items="itemsClients" class="w-full" />
                </UFormField>
                <UFormField label="Type facture" placeholder="" name="type_facture">
                    <USelectMenu v-model="state.type_facture" value-key="id" :items="itemsTypeFacture"
                        empty="Aucun magasin disponible" class="w-full" />
                </UFormField>
                <UFormField v-if="state.type_facture === 'AVOIR'" label="Type d'avoir" placeholder="" name="type_avoir">
                    <USelectMenu v-model="state.type_avoir" value-key="id" :items="itemsTypeAvoir"
                        empty="Aucun magasin disponible" class="w-full" />
                </UFormField>
                <UFormField label="Mode de paiement" placeholder="" name="mode_paiement">
                    <USelectMenu v-model="state.mode_paiement" value-key="id" :items="itemsModePaiements" class="w-full" />
                </UFormField>
                <UFormField label="Condition de paiement" placeholder="" name="condition_paiement">
                    <USelectMenu v-model="state.condition_paiement" value-key="id" :items="itemsConditionPaiements" class="w-full" />
                </UFormField>
                <UFormField label="Devise" placeholder="" name="devise">
                    <USelectMenu v-model="state.devise" value-key="id" :items="itemsDevises" class="w-full" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
