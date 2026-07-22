import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'
export type Period = 'daily' | 'weekly' | 'monthly'

export interface User {
    id: number
    nom: string
    email: string
    avatar?: AvatarProps
    status: UserStatus
    location: string
}

export interface Range {
    start: Date
    end: Date
}

export interface Mail {
    id: number
    unread?: boolean
    from: User
    subject: string
    body: string
    date: string
}

export interface Member {
    nom: string
    username: string
    role: 'member' | 'owner'
    avatar: Avatar
}

export interface Notification {
    id: number
    unread?: boolean
    sender: User
    body: string
    date: string
}

export interface Sale {
    id: string
    date: string
    status: SaleStatus
    email: string
    amount: number
}

export interface Stat {
    title: string
    icon: string
    value: number | string
    variation: number
    formatter?: (value: number) => string
}

export type { Patient, PatientOrg, PatientMutuelle, PatientListeAttente, Mutuelle, RendezVous, Medecin } from './patient'
export type { Organisation, Classe, Lookup } from './organisation'
export type { Facture, Tarifaire, TarifaireLine } from './facture'
export type { Client, Fournisseur } from './client'
export type { Article, ArticleAffectation, STKHeader, STKLine, STKLineDetail, Stock } from './stock'
export type { Profil, Role, UserRole, Affectation, Owner } from './auth'
