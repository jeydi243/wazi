import type { Lookup, Organisation } from './organisation'
import type { Client } from './client'
import type { Article } from './stock'

export interface Facture {
    id: string
    client: Client
    date_facture: string
    mode_paiement: Lookup
    numero_facture: string
    numero_livraison?: string
    numero_document: string
    statut: string
    invoice_type: Lookup
    montant_ttc: number
    montant_tva: number
    montant_ht: number
    remise: number
}

export interface Tarifaire {
    id: string
    nom: string
    code: string
    description: string
    organisation: Organisation
}

export interface TarifaireLine {
    id: string
    tarifaire: Tarifaire
    article: Article
    prix: number
    date_debut: string
    date_fin?: string
}
