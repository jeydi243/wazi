<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'

import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const open = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const parametresStore = useParametresStore()
const loading = ref(false)

const schema = z.object({
    client_id: z.string({ message: 'Veuillez selectionner un client' }),
    invoice_type_id: z.string({ message: 'Veuillez selectionner le type de facture' }),
    type_avoir: z.string({ message: 'Veuillez selectionner le type d\'avoir' }).optional(),
    numero_facture: z.string().optional(),
    invoice_parent_id: z.string().optional(),
    devise: z.string({ message: 'Devise requis' }),
    mode_paiement_id: z.string({ message: 'Mode de paiement requis' }),
    condition_paiement_id: z.string({ message: 'Condition de paiement requis' }),
    date_facture: z.date({ message: 'Date de facture requis' }).optional()
}).refine(data => {
    const code = getTypeFactures.value?.find((item: any) => item.id === data.invoice_type_id)?.code;
    console.log("Code: ", code);
    if (["FA", "EA"].includes(code || '') && (!data.invoice_parent_id || data.invoice_parent_id?.trim()?.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "Vous devez indiquer une facture initiale",
    path: ["invoice_header_id"]
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
    client_id: undefined,
    invoice_type_id: undefined,
    mode_paiement_id: undefined,
    condition_paiement_id: undefined,
    devise: undefined,
    date_facture: undefined,
    numero_facture: undefined,
    invoice_parent_id: undefined
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
const getInvoiceHeaders = computed(() => parametresStore.invoiceHeaders)
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
const itemsInvoiceHeaders = computed<SelectMenuItem[]>(() => getInvoiceHeaders.value?.map((item: any) => ({
    label: item.nom,
    id: item.id
})) || [])

const emit = defineEmits(['facture-added'])

const selectedTypeCode = computed(() => {
    return getTypeFactures.value?.find((item: any) => item.id === state.invoice_type_id)?.code
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    loading.value = true
    try {
        const payload = {
            ...event.data,
            date_facture: event.data.date_facture || new Date()
        }
        const { data, error } = await supabase
            .from('invoices')
            .insert([payload] as never[])
            .select()

        if (error) {
            toast.add({ title: 'Error', description: `Impossible d'ajouter la facture ${error.message}`, color: 'error' })
        } else {
            toast.add({ title: 'Facture Crée', description: `Nouvelle facture créée ${event.data.numero_facture}`, color: 'success' })
            emit('facture-added')
            open.value = false
        }
    } finally {
        loading.value = false
    }
}
</script>


<template>
    <USlideover v-model:open="open" title="Facturation" description="Ajouter une facture"
        :ui="{ content: 'max-w-4xl' }">
        <UButton label="Nouvelle Facture" icon="i-lucide-plus" />

        <template #body>
            <UForm id="facture-form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <div class="grid grid-cols-2 gap-2">
                    <UFormField label="Client" placeholder="_" name="client_id">
                        <USelectMenu v-model="state.client_id" value-key="id" :items="itemsClients" class="w-full" />
                    </UFormField>
                    <UFormField label="Type facture" placeholder="" name="invoice_type_id">
                        <USelectMenu v-model="state.invoice_type_id" value-key="id" :items="itemsTypeFacture"
                            empty="Aucun magasin disponible" class="w-full" />
                    </UFormField>
                    <div v-if="['FA', 'EA'].includes(selectedTypeCode || '')" class="grid grid-cols-2 gap-2">
                        <UFormField label="Type d'avoir" placeholder="" name="type_avoir">
                            <USelectMenu v-model="state.type_avoir" value-key="id" :items="itemsTypeAvoir"
                                empty="Aucun magasin disponible" class="w-full" />
                        </UFormField>
                        <UFormField label="Facture initiale" placeholder="" name="invoice_header_id">
                            <UInputMenu v-model="state.invoice_parent_id" :items="itemsInvoiceHeaders" class="w-full" />
                        </UFormField>
                    </div>
                    <UFormField label="Mode de paiement" placeholder="" name="mode_paiement">
                        <USelectMenu v-model="state.mode_paiement_id" value-key="id" :items="itemsModePaiements"
                            class="w-full" />
                    </UFormField>
                    <UFormField label="Condition de paiement" placeholder="" name="condition_paiement">
                        <USelectMenu v-model="state.condition_paiement_id" value-key="id"
                            :items="itemsConditionPaiements" class="w-full" />
                    </UFormField>
                    <UFormField label="Devise" placeholder="" name="devise">
                        <USelectMenu v-model="state.devise" value-key="id" :items="itemsDevises" class="w-full" />
                    </UFormField>
                </div>

            </UForm>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2 w-full">
                <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                <UButton label="Ajouter" color="primary" variant="solid" type="submit" form="facture-form"
                    :loading="loading" />
            </div>
        </template>
    </USlideover>
</template>
