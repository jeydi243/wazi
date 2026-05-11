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

const schema = z.object({
    fournisseur_id: z.string({ message: 'Veuillez selectionner un fournisseur' }),
    in_organisation_id: z.string({ message: 'Veuillez selectionner l\'organisation de transfert' }),
    numero_commande: z.string({ message: 'Numero commande requis' }),
    numero_livraison: z.string({ message: 'Numero livraison requis' }),
    numero_document: z.string({ message: 'Numero document requis' }).optional(),
    date_trx: z.date({ message: 'Date de transfert requis' }),
    user_id: z.string({ message: 'Utilisateur requis' }),
    type: z.enum(['IN', 'OUT'], { message: 'Type doit être IN ou OUT' }),
})

const state = reactive<Partial<Schema>>({
    fournisseur_id: undefined,
    in_organisation_id: undefined,
    numero_commande: undefined,
    numero_document: undefined,
    numero_livraison: undefined,
    date_trx: undefined,
    user_id: user.value?.id || '',
    type: 'IN',
})
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}
const { data: fournisseurs } = await useLazyAsyncData('fournisseurs', async () => {
    const { data } = await supabase.from('fournisseurs').select('id, nom')
    return data
})
const { data: magasinsUser } = await useLazyAsyncData('magasins-user ' + user.value?.id, async () => {
    // const { data } = await supabase.from('affectations')
    //     .select('organisation:organisations!inner(*)')
    //     .eq('user_id', user.value?.id || '')
    const { data, error } = await supabase
        .from('affectations')
        .select(`
            user_id,
            organisation:organisations!inner(
                *,
                lookups!inner(*)
            )
        `)
        .eq('user_id', user.value?.id || '')
        .eq('organisation.lookups.code', 'MAG');
    return data
})

const dateTrxModel = computed({
    get: () => state.date_trx ? toCalendarDate(state.date_trx) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_trx = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})
const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
const items = computed<SelectMenuItem[]>(() => fournisseurs.value?.map((fss: any) => ({
    label: fss.nom,
    id: fss.id
})) || [])

const itemsMagasin = computed<SelectMenuItem[]>(() => magasinsUser.value?.map((item: any) => ({
    label: item.organisation.nom,
    id: item.organisation.id
})) || [])

const emit = defineEmits(['transfert-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('stk_trx_headers')
        .insert([{ ...event.data }] as never[])
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Impossible d'ajouter le transfert ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Transfert Crée', description: `Nouveau transfert externe créé ${event.data.numero_document}`, color: 'success' })
        emit('transfert-added')
        open.value = false
    }
}
</script>


<template>
    <UModal v-model:open="open" title="Transfert Externe" description="Ajouter un transfert externe">
        <UButton label="Nouveau Transfert" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Fournisseur" placeholder="_" name="fournisseur_id">
                    <USelectMenu v-model="state.fournisseur_id" value-key="id" :items="items" class="w-full" />
                </UFormField>
                <UFormField label="Organisation de transfert" placeholder="" name="in_organisation_id">
                    <USelectMenu v-model="state.in_organisation_id" value-key="id" :items="itemsMagasin"
                                 empty="Aucun magasin disponible" class="w-full" />
                </UFormField>
                <UFormField label="Numero Commande" placeholder="" name="numero_commande">
                    <UInput v-model="state.numero_commande" class="w-full" />
                </UFormField>
                <UFormField label="Type" name="type">
                    <URadioGroup v-model="state.type" disabled
                                 :items="[{ label: 'Entrée (IN)', value: 'IN' }, { label: 'Sortie (OUT)', value: 'OUT' }]"
                                 orientation="horizontal" />
                </UFormField>
                <UFormField label="Numero Livraison" placeholder="" name="numero_livraison">
                    <UInput v-model="state.numero_livraison" class="w-full" />
                </UFormField>
                <UFormField label="Date de transfert" placeholder="08/12/2025" name="date_trx">
                    <UInputDate v-model="dateTrxModel" class="w-full" :max-date="maxDate">
                        <template #trailing>
                            <UPopover>
                                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                         aria-label="Select a date" class="px-0" />

                                <template #content>
                                    <UCalendar v-model="dateTrxModel" class="p-2" :max-date="maxDate" />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
