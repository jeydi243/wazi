import type { Lookup, Organisation } from './organisation'
import type { Client } from './client'

export interface Profil {
    id: string
    email: string
    nom: string
    prenom: string
    postnom: string
    user_name: string
    user_id: string
    client_id: Client
}

export interface Role {
    id: string
    nom: string
    description: string
    code: string
    entite: string
    date_debut: string
    date_fin: string
}

export interface UserRole {
    id: string
    user: Profil
    role: Role
    organisation: Organisation
    created_at: string
    date_debut: string
    date_fin: string
}

export interface Affectation {
    id: string
    user_id: string
    lookup: Lookup
    organisation?: Organisation
    created_at?: string
    date_debut?: string
    date_fin?: string
}

export interface Owner {
    id: string
    nom: string
    description: string
}
