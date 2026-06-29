import { goto } from '$app/navigation';
import { pb } from '$lib/api/pocketbase.js';

class AuthStore {
	
	user = $state(null);
	token = $state('');
	isLoading = $state(true);

	constructor() {
		
		if (typeof window !== 'undefined') {
			this.user = pb.authStore.record;
			this.token = pb.authStore.token;
			this.isLoading = false;

			
			pb.authStore.onChange((token, record) => {
				this.user = record;
				this.token = token;
			});
		}
	}

	
	get isAuthenticated() {
		return pb.authStore.isValid && this.user !== null;
	}

	
	get role() {
		return this.user?.role ?? null;
	}

	
	get isAdmin() {
		return this.role === 'superadmin' || this.role === 'manager';
	}

	
	get isSuperAdmin() {
		return this.role === 'superadmin';
	}

	
	async login(email, password) {
		const result = await pb.collection('users').authWithPassword(email, password);
		return result;
	}

	
	async register(email, password, name) {
		
		let role = 'user';
		try {
			const existing = await pb.collection('users').getList(1, 1, { fields: 'id' });
			if (existing.totalItems === 0) {
				role = 'superadmin';
			}
		} catch {
			
		}

		const user = await pb.collection('users').create({
			email,
			password,
			passwordConfirm: password,
			name,
			role
		});

		
		await this.login(email, password);
		return user;
	}

	
	async logout() {
		pb.authStore.clear();
		await goto('/login');
	}

	
	async refresh() {
		if (pb.authStore.isValid) {
			try {
				await pb.collection('users').authRefresh();
			} catch {
				this.logout();
			}
		}
	}
}

export const authStore = new AuthStore();
