<script setup lang="ts">
definePageMeta({
    layout: false // On ne veut pas de sidebar sur cet écran
})

const steps = [
    { id: 1, label: 'Vérification de l\'identité' },
    { id: 2, label: 'Initialisation de la session' },
    { id: 3, label: 'Chargement des paramètres' },
    { id: 4, label: 'Préparation de l\'espace de travail' }
]

const currentStep = ref(0)
const user = useSupabaseUser()

// Animation artificielle pour le feeling "premium"
onMounted(() => {
    const interval = setInterval(() => {
        if (currentStep.value < steps.length) {
            currentStep.value++
        } else {
            clearInterval(interval)
            // Une fois l'animation finie, si on a un user, on redirige
            if (user.value) {
                navigateTo('/')
            }
        }
    }, 700)
})

// Sécurité au cas où l'animation est finie mais user n'est pas encore là (rare avec Supabase)
// Ou si l'utilisateur rafraîchit la page et est déjà connecté
watch(user, (newUser) => {
    if (newUser && currentStep.value >= steps.length) {
        navigateTo('/')
    }
}, { immediate: true })
</script>

<template>
    <div class="flex h-screen w-full items-center justify-center bg-(--ui-bg) overflow-hidden relative">
        <!-- Cercles de fond pour le style glassmorphism -->
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />

        <div class="max-w-md w-full p-12 relative z-10">
            <div class="flex flex-col items-center mb-12">
                <div class="p-3 bg-primary/10 rounded-2xl mb-4">
                    <UIcon name="i-lucide-shield-check" class="w-10 h-10 text-primary" />
                </div>
                <h1 class="text-2xl font-bold text-(--ui-text-highlighted)">Sécurisation de l'accès</h1>
                <p class="text-(--ui-text-muted) text-sm mt-1">Veuillez patienter quelques instants</p>
            </div>

            <div class="space-y-6">
                <div v-for="(step, index) in steps" :key="step.id" 
                     class="flex items-center gap-5 transition-all duration-700 ease-out"
                     :class="[
                         index <= currentStep ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4 blur-sm',
                         index < currentStep ? 'text-(--ui-text-muted)' : ''
                     ]">
                    <div class="relative flex items-center justify-center shrink-0">
                        <div v-if="index < currentStep" class="bg-primary/20 text-primary rounded-full p-1.5 transition-all duration-500 scale-110">
                            <UIcon name="i-lucide-check" class="w-4 h-4 stroke-[3]" />
                        </div>
                        <div v-else-if="index === currentStep" class="relative flex items-center justify-center">
                            <UIcon name="i-lucide-loader-2" class="w-7 h-7 text-primary animate-spin" />
                            <div class="absolute w-7 h-7 bg-primary/10 rounded-full animate-ping opacity-30" />
                        </div>
                        <div v-else class="w-6 h-6 rounded-full border-2 border-(--ui-border) opacity-50" />
                    </div>

                    <span class="text-lg font-medium transition-colors duration-500" 
                          :class="[index === currentStep ? 'text-primary' : '']">
                        {{ step.label }}
                    </span>
                </div>
            </div>

            <!-- Barre de progression discrète -->
            <div class="mt-16 relative">
                <div class="h-1.5 w-full bg-(--ui-bg-elevated) rounded-full overflow-hidden">
                    <div class="h-full bg-primary transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(var(--ui-primary-rgb),0.5)]" 
                         :style="{ width: `${(currentStep / steps.length) * 100}%` }" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Optionnel : ajout d'un léger effet de grain pour le côté premium */
.bg-grain {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.02;
  pointer-events: none;
}
</style>
