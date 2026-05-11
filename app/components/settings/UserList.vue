<script setup lang="ts">
import type { Profil } from '~/types'

const props = defineProps<{
    users: Profil[]
}>()

const usersRefs = ref<Element[]>([])

const selectedUser = defineModel<Profil | null>()

watch(selectedUser, () => {
    if (!selectedUser.value) {
        return
    }
    const ref = (usersRefs.value as any)[selectedUser.value.id]
    if (ref) {
        ref.scrollIntoView({ block: 'nearest' })
    }
})

defineShortcuts({
    arrowdown: () => {
        const index = props.users.findIndex(user => user.id === selectedUser.value?.id)

        if (index === -1) {
            selectedUser.value = props.users[0]
        } else if (index < props.users.length - 1) {
            selectedUser.value = props.users[index + 1]
        }
    },
    arrowup: () => {
        const index = props.users.findIndex(user => user.id === selectedUser.value?.id)

        if (index === -1) {
            selectedUser.value = props.users[props.users.length - 1]
        } else if (index > 0) {
            selectedUser.value = props.users[index - 1]
        }
    }
})
</script>

<template>
    <div class="overflow-y-auto divide-y divide-(--ui-border) h-full pb-2">
        <div v-for="(user, index) in users" :key="index" :ref="el => { (usersRefs as any)[user.id] = el as Element }">
            <div class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors" :class="[
                selectedUser && selectedUser.id === user.id ? 'border-(--ui-primary) bg-(--ui-primary)/10' : 'border-transparent hover:border-(--ui-primary) hover:bg-(--ui-primary)/5'
            ]" @click="selectedUser = user">
                <div class="flex items-center gap-3">
                    <UAvatar :alt="`${user.prenom} ${user.nom}`" size="sm" />
                    <div class="min-w- flex-1">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold text-(--ui-text-highlighted) truncate">
                                {{ user.prenom }} {{ user.nom }}
                            </span>
                        </div>
                        <p class="text-(--ui-text-dimmed) text-xs truncate">
                            @{{ user.user_name }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
