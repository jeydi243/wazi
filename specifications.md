# Spécifications Fonctionnelles : Application de Facturation

## 1. Introduction

Ce document détaille les fonctionnalités requises pour le développement d'une application de gestion de facturation destinée aux PME et auto-entrepreneurs. L'objectif est d'automatiser le cycle de vente, du devis au paiement.

## 2. Gestion des Référentiels

### 2.1 Gestion des Clients
- **Création/Modification** : Nom, Raison sociale, SIRET/TVA, Adresse de facturation, Email, Téléphone.
- **Historique** : Visualisation de toutes les factures et devis associés à un client.
- **Statut** : Possibilité d'activer ou de désactiver un client.

### 2.2 Catalogue de Produits et Services
- **Fiche Produit** : Libellé, Description, Prix unitaire HT, Taux de TVA applicable.
- **Gestion des Stocks** : (Optionnel) Suivi des quantités disponibles.

## 3. Cycle de Facturation

### 3.1 Création de Devis
- Transformation d'un devis en facture en un clic.
- Gestion des dates de validité.

### 3.2 Émission de Factures
- **Numérotation automatique** : Séquence chronologique et ininterrompue (ex: `FAC-2024-001`).
- **Calculs automatiques** : Total HT, Montant TVA par taux, Total TTC.
- **Mentions Légales** : Date d'émission, date d'échéance, conditions de retard.
- **Export** : Génération de la facture au format PDF.

### 3.3 Suivi des Paiements
- **États de facture** : Brouillon, Envoyée, Payée, En retard, Annulée.
- **Saisie des règlements** : Date du paiement, mode de règlement (Virement, Carte, Espèces).

## 4. Tableaux de Bord et Reporting
- Chiffre d'affaires (CA) mensuel et annuel.
- Visualisation des impayés (Balance âgée).
- Export comptable des ventes (format CSV/Excel).

## 5. Spécifications Techniques & Données

### 5.1 Architecture des données (SQL)
L'application s'appuiera sur une base de données relationnelle. Voici les entités principales :

```sql
-- Clients (ID, Nom, Email...)
-- Produits (ID, Designation, Prix_HT...)
-- Factures (ID, Numero, Date, Client_ID, Statut...)
-- Lignes_Facture (ID, Facture_ID, Produit_ID, Quantite, Prix_Unitaire...)
```

### 5.2 Sécurité et Accès
- Authentification par email/mot de passe.
- **Rôles** : 
    - **Administrateur** : Tout accès.
    - **Éditeur** : Facturation uniquement, sans accès aux rapports financiers.

## 6. Évolutions Futures
- Relances automatiques par email.
- Connexion aux API bancaires pour rapprochement.
- Signature électronique des devis.