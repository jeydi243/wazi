export interface Classe {
    id: string
    table_name: string
    description: string
    code: string
    nom: string
    status: string
    created_at: string
    updated_at: string
    update: Date
    date_debut: Date
    end_date: Date
}

export interface Lookup {
    id: string
    nom: string
    classe: Classe
    code: string
    description: string
}

export interface Organisation {
    id: string
    nom: string
    description?: string
    code?: string
    lookup?: Lookup
    status?: string
    nid?: string
    prefixe?: string
    organisation_parent?: Organisation
    organisation_parent_id?: string
}
