import type { Organisation } from './organisation'

export interface Patient {
    id: string
    nom: string
    code: string
    prenom: string
    postnom: string
    sexe: string
    date_naissance: string
    status: string
    mrn: string
    avatar: string
}

export interface PatientOrg {
    id: string
    patient: Patient
    organisation_id: string
    date_debut: string
    date_fin: string
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

export interface Mutuelle {
    id: string
    nom: string
    code: string
    description: string
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
    id: string | number
    nom: string
    prenom: string
    postnom: string
}
