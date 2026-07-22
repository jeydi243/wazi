import { defineStore } from "pinia";
import type { Client, Fournisseur } from "~/types";

export const useClientsStore = defineStore("clients", () => {
	const supabase = useSupabaseClient();
	const items = ref<Client[]>([]);
	const loading = ref(false);

	async function fetchAll(ownerId?: string | null) {
		loading.value = true;
		let query = supabase.from("clients").select("*, type:type_id(*)");
		if (ownerId) query = query.eq("owner_id", ownerId);
		const { data, error } = await query;
		if (error) throw error;
		if (data) items.value = data as unknown as Client[];
		loading.value = false;
		return items.value;
	}

	async function fetchById(id: string) {
		const { data, error } = await supabase
			.from("clients")
			.select("*")
			.eq("id", id)
			.single();
		if (error) throw error;
		return data as unknown as Client;
	}

	async function create(data: Partial<Client>) {
		const { data: created, error } = await supabase
			.from("clients")
			.insert(data)
			.select();
		if (error) throw error;
		if (created) items.value.unshift(created[0] as unknown as Client);
		return created[0];
	}

	async function update(id: string, data: Partial<Client>) {
		const { data: updated, error } = await supabase
			.from("clients")
			.update(data)
			.eq("id", id)
			.select();
		if (error) throw error;
		if (updated) {
			const idx = items.value.findIndex((c) => c.id === id);
			if (idx !== -1) items.value[idx] = updated[0] as unknown as Client;
		}
		return updated?.[0];
	}

	async function remove(id: string) {
		const { error } = await supabase.from("clients").delete().eq("id", id);
		if (error) throw error;
		items.value = items.value.filter((c) => c.id !== id);
	}

	async function fetchFournisseurs() {
		const { data } = await supabase.from("fournisseurs").select("id, nom");
		return data as unknown as Fournisseur[];
	}

	async function fetchAssignedOrgIds(clientId: string): Promise<string[]> {
		const { data } = await supabase
			.from("client_organisations")
			.select("organisation_id")
			.eq("client_id", clientId);
		return (data || []).map((r: any) => r.organisation_id);
	}

	async function attachOrg(clientId: string, organisationId: string) {
		const { error } = await supabase
			.from("client_organisations")
			.insert({ client_id: clientId, organisation_id: organisationId });
		if (error) throw error;
	}

	async function detachOrg(id: string) {
		const { error } = await supabase
			.from("client_organisations")
			.delete()
			.eq("id", id);
		if (error) throw error;
	}

	return {
		items,
		loading,
		fetchAll,
		fetchById,
		create,
		update,
		remove,
		fetchFournisseurs,
		fetchAssignedOrgIds,
		attachOrg,
		detachOrg,
	};
});
