<script setup lang="ts">
const items = [{
    label: 'Consultation',
    icon: 'i-heroicons-chat-bubble-left-right',
    slot: 'consultation'
}, {
    label: 'Signes Vitaux',
    icon: 'i-heroicons-heart',
    slot: 'vitals'
}, {
    label: 'Historique',
    icon: 'i-heroicons-clock',
    slot: 'history'
}]

const state = reactive({
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    temperature: '',
    bloodPressure: '',
    weight: '',
    heartRate: ''
})

const toast = useToast()

function saveConsultation() {
    toast.add({ title: 'Consultation enregistrée', icon: 'i-heroicons-check-circle', color: 'green' })
}
</script>

<template>
    <div class="p-4 space-y-4">
        <!-- Header Patient Info -->
        <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Avatar" size="lg" />
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Jean Dupont</h1>
                    <p class="text-gray-500 dark:text-gray-400">Homme • 45 ans • Dossier #12345</p>
                </div>
            </div>
            <div class="flex gap-2">
                <UButton icon="i-heroicons-document-arrow-down" color="gray" variant="ghost">Historique PDF</UButton>
                <UButton icon="i-heroicons-x-mark" color="white" to="/">Fermer</UButton>
            </div>
        </div>

        <UDivider />

        <UTabs :items="items" class="w-full">
            <template #consultation>
                <UCard class="mt-4">
                    <template #header>
                        <h3 class="text-lg font-semibold">Nouvelle Consultation</h3>
                    </template>

                    <form class="space-y-4" @submit.prevent="saveConsultation">
                        <UFormGroup label="Symptômes" name="symptoms">
                            <UTextarea v-model="state.symptoms" placeholder="Décrivez les symptômes du patient..."
                                       autoresize />
                        </UFormGroup>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UFormGroup label="Diagnostic" name="diagnosis">
                                <UInput v-model="state.diagnosis" icon="i-heroicons-magnifying-glass"
                                        placeholder="Diagnostic principal" />
                            </UFormGroup>
                            <UFormGroup label="Type de consultation" name="type">
                                <USelect :options="['Générale', 'Suivi', 'Urgence', 'Spécialisée']"
                                         placeholder="Sélectionner..." />
                            </UFormGroup>
                        </div>

                        <UFormGroup label="Prescription / Traitement" name="prescription">
                            <UTextarea v-model="state.prescription" placeholder="Liste des médicaments et posologie..."
                                       :rows="3" />
                        </UFormGroup>

                        <UFormGroup label="Notes Privées (Médecin)" name="notes">
                            <UTextarea v-model="state.notes" placeholder="Notes réservées au personnel médical..."
                                       :rows="2" color="gray" variant="outline" />
                        </UFormGroup>

                        <div class="flex justify-end pt-2">
                            <UButton type="submit" size="lg" icon="i-heroicons-check">
                                Enregistrer la consultation
                            </UButton>
                        </div>
                    </form>
                </UCard>
            </template>

            <template #vitals>
                <UCard class="mt-4">
                    <template #header>
                        <h3 class="text-lg font-semibold">Signes Vitaux</h3>
                    </template>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <UFormGroup label="Température (°C)">
                            <UInput v-model="state.temperature" placeholder="37.0" icon="i-heroicons-fire">
                                <template #trailing>°C</template>
                            </UInput>
                        </UFormGroup>
                        <UFormGroup label="Tension Artérielle">
                            <UInput v-model="state.bloodPressure" placeholder="120/80" icon="i-heroicons-heart" />
                        </UFormGroup>
                        <UFormGroup label="Poids (kg)">
                            <UInput v-model="state.weight" placeholder="70" icon="i-heroicons-scale">
                                <template #trailing>kg</template>
                            </UInput>
                        </UFormGroup>
                        <UFormGroup label="Fréquence Cardiaque">
                            <UInput v-model="state.heartRate" placeholder="70" icon="i-heroicons-bolt">
                                <template #trailing>bpm</template>
                            </UInput>
                        </UFormGroup>
                    </div>
                </UCard>
            </template>

            <template #history>
                <UCard class="mt-4">
                    <div class="text-center py-8 text-gray-500">
                        <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun historique disponible pour le moment.</p>
                    </div>
                </UCard>
            </template>
        </UTabs>
    </div>
</template>
