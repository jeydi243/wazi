-- Migration: Enable Row Level Security on all tables
-- Date: 2025-07-11
-- Purpose: Secure all database tables with RLS policies

-- ============================================================
-- Helper functions
-- ============================================================

-- Check if the authenticated user has an admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = (SELECT user_id FROM public.profils WHERE user_id = auth.uid() LIMIT 1)
    AND LOWER(r.name) = 'admin'
  );
$$;

-- Get the owner_id of the current authenticated user from their profile
CREATE OR REPLACE FUNCTION public.get_user_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT owner_id::uuid FROM public.profils WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- Enabling RLS and creating policies
-- ============================================================

-- ---------- Lookups (shared reference data) ----------
ALTER TABLE public.lookups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lookups_select" ON public.lookups;
CREATE POLICY "lookups_select" ON public.lookups
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lookups_all_admin" ON public.lookups;
CREATE POLICY "lookups_all_admin" ON public.lookups
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Classes (shared reference data) ----------
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classes_select" ON public.classes;
CREATE POLICY "classes_select" ON public.classes
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "classes_all_admin" ON public.classes;
CREATE POLICY "classes_all_admin" ON public.classes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Roles (shared reference data) ----------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select" ON public.roles;
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "roles_all_admin" ON public.roles;
CREATE POLICY "roles_all_admin" ON public.roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Profils ----------
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profils_owner" ON public.profils;
CREATE POLICY "profils_owner" ON public.profils
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id() OR user_id = auth.uid())
  WITH CHECK (owner_id = public.get_user_owner_id() OR user_id = auth.uid());
DROP POLICY IF EXISTS "profils_all_admin" ON public.profils;
CREATE POLICY "profils_all_admin" ON public.profils
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- User Roles ----------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_owner" ON public.user_roles;
CREATE POLICY "user_roles_owner" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.profils WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "user_roles_all_admin" ON public.user_roles;
CREATE POLICY "user_roles_all_admin" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Organisations ----------
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organisations_owner" ON public.organisations;
CREATE POLICY "organisations_owner" ON public.organisations
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "organisations_all_admin" ON public.organisations;
CREATE POLICY "organisations_all_admin" ON public.organisations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Articles ----------
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "articles_owner" ON public.articles;
CREATE POLICY "articles_owner" ON public.articles
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "articles_all_admin" ON public.articles;
CREATE POLICY "articles_all_admin" ON public.articles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Clients ----------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_owner" ON public.clients;
CREATE POLICY "clients_owner" ON public.clients
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "clients_all_admin" ON public.clients;
CREATE POLICY "clients_all_admin" ON public.clients
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Invoices ----------
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_owner" ON public.invoices;
CREATE POLICY "invoices_owner" ON public.invoices
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "invoices_all_admin" ON public.invoices;
CREATE POLICY "invoices_all_admin" ON public.invoices
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Invoices Lines ----------
ALTER TABLE public.invoices_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_lines_owner" ON public.invoices_lines;
CREATE POLICY "invoices_lines_owner" ON public.invoices_lines
  FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "invoices_lines_all_admin" ON public.invoices_lines;
CREATE POLICY "invoices_lines_all_admin" ON public.invoices_lines
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Factures ----------
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factures_owner" ON public.factures;
CREATE POLICY "factures_owner" ON public.factures
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "factures_all_admin" ON public.factures;
CREATE POLICY "factures_all_admin" ON public.factures
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Tarifaires ----------
ALTER TABLE public.tarifaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tarifaires_owner" ON public.tarifaires;
CREATE POLICY "tarifaires_owner" ON public.tarifaires
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "tarifaires_all_admin" ON public.tarifaires;
CREATE POLICY "tarifaires_all_admin" ON public.tarifaires
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Tarifaires Lines ----------
ALTER TABLE public.tarifaires_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tarifaires_lines_owner" ON public.tarifaires_lines;
CREATE POLICY "tarifaires_lines_owner" ON public.tarifaires_lines
  FOR ALL TO authenticated
  USING (tarifaire_id IN (SELECT id FROM public.tarifaires WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (tarifaire_id IN (SELECT id FROM public.tarifaires WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "tarifaires_lines_all_admin" ON public.tarifaires_lines;
CREATE POLICY "tarifaires_lines_all_admin" ON public.tarifaires_lines
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Affectations ----------
ALTER TABLE public.affectations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affectations_owner" ON public.affectations;
CREATE POLICY "affectations_owner" ON public.affectations
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM public.profils WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (user_id IN (SELECT id FROM public.profils WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "affectations_all_admin" ON public.affectations;
CREATE POLICY "affectations_all_admin" ON public.affectations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Patients ----------
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_owner" ON public.patients;
CREATE POLICY "patients_owner" ON public.patients
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "patients_all_admin" ON public.patients;
CREATE POLICY "patients_all_admin" ON public.patients
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Patients Organisations ----------
ALTER TABLE public.patients_organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_orgs_owner" ON public.patients_organisations;
CREATE POLICY "patients_orgs_owner" ON public.patients_organisations
  FOR ALL TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "patients_orgs_all_admin" ON public.patients_organisations;
CREATE POLICY "patients_orgs_all_admin" ON public.patients_organisations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Patients Mutuelles ----------
ALTER TABLE public.patients_mutuelles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_mut_owner" ON public.patients_mutuelles;
CREATE POLICY "patients_mut_owner" ON public.patients_mutuelles
  FOR ALL TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "patients_mut_all_admin" ON public.patients_mutuelles;
CREATE POLICY "patients_mut_all_admin" ON public.patients_mutuelles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Mutuelles ----------
ALTER TABLE public.mutuelles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mutuelles_owner" ON public.mutuelles;
CREATE POLICY "mutuelles_owner" ON public.mutuelles
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "mutuelles_all_admin" ON public.mutuelles;
CREATE POLICY "mutuelles_all_admin" ON public.mutuelles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Stock Transaction Headers ----------
ALTER TABLE public.stk_trx_headers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stk_trx_headers_owner" ON public.stk_trx_headers;
CREATE POLICY "stk_trx_headers_owner" ON public.stk_trx_headers
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "stk_trx_headers_all_admin" ON public.stk_trx_headers;
CREATE POLICY "stk_trx_headers_all_admin" ON public.stk_trx_headers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Stock Transaction Lines ----------
ALTER TABLE public.stk_trx_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stk_trx_lines_owner" ON public.stk_trx_lines;
CREATE POLICY "stk_trx_lines_owner" ON public.stk_trx_lines
  FOR ALL TO authenticated
  USING (header_id IN (SELECT id FROM public.stk_trx_headers WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (header_id IN (SELECT id FROM public.stk_trx_headers WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "stk_trx_lines_all_admin" ON public.stk_trx_lines;
CREATE POLICY "stk_trx_lines_all_admin" ON public.stk_trx_lines
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Stock Transaction Line Details ----------
ALTER TABLE public.stk_trx_lines_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stk_trx_lines_details_owner" ON public.stk_trx_lines_details;
CREATE POLICY "stk_trx_lines_details_owner" ON public.stk_trx_lines_details
  FOR ALL TO authenticated
  USING (line_id IN (
    SELECT l.id FROM public.stk_trx_lines l
    JOIN public.stk_trx_headers h ON h.id = l.header_id
    WHERE h.owner_id = public.get_user_owner_id()
  ))
  WITH CHECK (line_id IN (
    SELECT l.id FROM public.stk_trx_lines l
    JOIN public.stk_trx_headers h ON h.id = l.header_id
    WHERE h.owner_id = public.get_user_owner_id()
  ));
DROP POLICY IF EXISTS "stk_trx_lines_details_all_admin" ON public.stk_trx_lines_details;
CREATE POLICY "stk_trx_lines_details_all_admin" ON public.stk_trx_lines_details
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Stock Transaction Details ----------
ALTER TABLE public.stk_trx_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stk_trx_details_owner" ON public.stk_trx_details;
CREATE POLICY "stk_trx_details_owner" ON public.stk_trx_details
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "stk_trx_details_all_admin" ON public.stk_trx_details;
CREATE POLICY "stk_trx_details_all_admin" ON public.stk_trx_details
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Stock Data ----------
ALTER TABLE public.stk_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stk_data_owner" ON public.stk_data;
CREATE POLICY "stk_data_owner" ON public.stk_data
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "stk_data_all_admin" ON public.stk_data;
CREATE POLICY "stk_data_all_admin" ON public.stk_data
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Fournisseurs ----------
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fournisseurs_owner" ON public.fournisseurs;
CREATE POLICY "fournisseurs_owner" ON public.fournisseurs
  FOR ALL TO authenticated
  USING (owner_id = public.get_user_owner_id())
  WITH CHECK (owner_id = public.get_user_owner_id());
DROP POLICY IF EXISTS "fournisseurs_all_admin" ON public.fournisseurs;
CREATE POLICY "fournisseurs_all_admin" ON public.fournisseurs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Article Organisations ----------
ALTER TABLE public.article_organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "article_orgs_owner" ON public.article_organisations;
CREATE POLICY "article_orgs_owner" ON public.article_organisations
  FOR ALL TO authenticated
  USING (article_id IN (SELECT id FROM public.articles WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (article_id IN (SELECT id FROM public.articles WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "article_orgs_all_admin" ON public.article_organisations;
CREATE POLICY "article_orgs_all_admin" ON public.article_organisations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Client Organisations ----------
ALTER TABLE public.client_organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_orgs_owner" ON public.client_organisations;
CREATE POLICY "client_orgs_owner" ON public.client_organisations
  FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "client_orgs_all_admin" ON public.client_organisations;
CREATE POLICY "client_orgs_all_admin" ON public.client_organisations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Organisation Tokens ----------
ALTER TABLE public.organisation_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_tokens_owner" ON public.organisation_tokens;
CREATE POLICY "org_tokens_owner" ON public.organisation_tokens
  FOR ALL TO authenticated
  USING (organisation_id IN (SELECT id FROM public.organisations WHERE owner_id = public.get_user_owner_id()))
  WITH CHECK (organisation_id IN (SELECT id FROM public.organisations WHERE owner_id = public.get_user_owner_id()));
DROP POLICY IF EXISTS "org_tokens_all_admin" ON public.organisation_tokens;
CREATE POLICY "org_tokens_all_admin" ON public.organisation_tokens
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Employees (from existing migration) ----------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_all_admin" ON public.employees;
CREATE POLICY "employees_all_admin" ON public.employees
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
