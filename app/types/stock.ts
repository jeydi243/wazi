import type { Lookup, Organisation } from './organisation'
import type { Fournisseur } from './client'

export interface Article {
    id: string
    nom: string
    code: string
    description: string
    lookup: Lookup
    created_at?: string
    unite_conso: Lookup
    unite_stock: Lookup
    gestion_num_lot: boolean
}

export interface ArticleAffectation {
    id: string
    article_id: Article
    organisation_id: Organisation
    created_at?: string
}

export interface STKHeader {
    id: string
    in_organisation: Organisation
    out_organisation?: Organisation
    date_trx: string
    fournisseur?: Fournisseur
    numero_commande?: string
    numero_livraison?: string
    numero_document: string
    statut: string
    type: string
}

export interface STKLine {
    id: string
    header: STKHeader
    article: Article
    quantite_trx: number
    prix_unitaire: number
    numero_lot: string
    details?: STKLineDetail[]
}

export interface STKLineDetail {
    id: string
    line_id: string
    numero_serie: string
    date_trx: string
    statut: string
    created_at?: string
}

export interface Stock {
    id: string
    organisation: Organisation
    location: Organisation
    article: Article
    quantite: number
    numero_lot: string
    statut: string
    date_trx: string
    created_at?: string
}
