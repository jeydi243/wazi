import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
    id: number
    nom: string
    email: string
    avatar?: AvatarProps
    status: UserStatus
    location: string
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

export interface Stat {
    title: string
    icon: string
    value: number | string
    variation: number
    formatter?: (value: number) => string
}

export interface Sale {
    id: string
    date: string
    status: SaleStatus
    email: string
    amount: number
}

export interface Notification {
    id: number
    unread?: boolean
    sender: User
    body: string
    date: string
}
export interface Classe {
    id: string
    table_name: string
    description: string
    code: string
    nom: string
    status: string
    created_at: string,
    updated_at: string,
    update: Date,
    date_debut: Date,
    end_date: Date
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
    start: Date
    end: Date
}

export interface Lookup {
    id: string
    nom: string,
    classe: Classe,
    code: string,
    description: string,
}

export interface Organisation {
    id: string
    nom: string
    description?: string
    code?: string
    lookup?: Lookup
    status?: string
    prefixe?: string,
    organisation_parent?: Organisation
    organisation_parent_id?: string
}

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

export interface Client {
    id: string
    nom: string
    code: string
    description: string
    created_at?: string
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
export interface Article {
    id: string
    nom: string
    code: string
    description: string
    lookup: Lookup
    created_at?: string
    unite_conso: Lookup
    unite_stock: Lookup,
    gestion_num_lot: boolean
}
export interface ArticleAffectation {
    id: string
    article_id: Article
    organisation_id: Organisation
    created_at?: string
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

export interface Patient {
    id: string
    nom: string
    code: string
    prenom: string
    postnom: string
    sexe: string
    date_naissance: string
    status: string,
    mrn: string,
    avatar: string
}
export interface PatientOrg {
    id: string
    patients: Patient
    organisation_id: string
    date_debut: string
    date_fin: string
}

export interface Mutuelle {
    id: string
    nom: string
    code: string
    description: string
    lookup_id: string
    statut: string
    organisation_id: string
}
export interface PatientMutuelle {
    id: string
    mutuelle: Mutuelle
    patient: Patient
    date_debut: string
    date_fin?: string
    statut: string
    organisation: Organisation
}

export interface PatientListeAttente {
    id: string
    nom: string
    prenom: string
    postnom: string
    sexe: string
    date_naissance: string
    status: string
    mrn: string
    avatar: string
    statut: string
}

export interface RendezVous {
    id: string
    patient: Patient
    organisation: Organisation
    service: Organisation
    date_rdv: string
    heure: string
    statut: string
}

export interface Medecin {
    id: string | number;
    nom: string;
    prenom: string;
    postnom: string;
}

export interface Role {
    id: string;
    nom: string;
    description: string;
    code: string;
    entite: string
    date_debut: string;
    date_fin: string;
}

export interface UserRole {
    id: string
    user: Profil
    role: Role
    created_at: string
    date_debut: string
    date_fin: string
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


export interface Fournisseur {
    id: string
    nom: string
    code: string
    description: string
    type: Lookup
    created_at?: string
    updated_at?: string
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