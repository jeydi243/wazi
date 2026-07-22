import type { Lookup } from './organisation'

export interface Client {
    id: string
    nom: string
    code: string
    description: string
    nif: string
    type: Lookup
    created_at?: string
}

export interface Fournisseur {
    id: string
    nom: string
    code: string
    description: string
    type: Lookup
    created_at?: string
    updated_at?: string
}
