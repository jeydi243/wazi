<template>

    <UModal v-model:open="openEdit" title="Modifier l'utilisateur" :description="selectedUser?.email">
        <UForm :schema="editSchema" :state="editState" @submit="onEditSubmit" class="space-y-4 p-4">
            <UFormField label="Email" name="email">
                <UInput v-model="editState.email" type="email" placeholder="Nouvel email" />
            </UFormField>
            <UFormField label="Téléphone" name="phone">
                <UInput v-model="editState.phone" type="tel" placeholder="+33..." />
            </UFormField>
            <UFormField label="Mot de passe" name="password">
                <UInput v-model="editState.password" type="password" placeholder="Nouveau mot de passe" />
            </UFormField>
            <UFormField label="Email confirmé" name="email_confirm">
                <div class="flex items-center gap-2">
                    <USwitch v-model="editState.email_confirm" />
                    <span class="text-sm text-(--ui-text-muted)">
                        {{ editState.email_confirm ? 'Confirmé' : 'Non confirmé' }}
                    </span>
                </div>
            </UFormField>
            <p class="text-xs text-(--ui-text-muted)">Laissez les champs vides pour ne pas les modifier.</p>
            <div class="flex justify-end gap-2 pt-2">
                <UButton label="Annuler" color="neutral" variant="subtle" @click="openEdit = false"
                    :disabled="actionLoading" />
                <UButton type="submit" label="Enregistrer" color="primary" :loading="actionLoading" />
            </div>
        </UForm>
    </UModal>
</template>
<script setup lang="ts">
import * as z from 'zod'

const editSchema = z.object({
    email: z.string().email("Format d'email invalide").optional(),
    phone: z.string().optional(),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional(),
    email_confirm: z.boolean().optional(),
})
</script>