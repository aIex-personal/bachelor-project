
import PocketBase from 'pocketbase';

export const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

export function createServerClient(token) {
	const pb = new PocketBase(POCKETBASE_URL);
	if (token) {
		pb.authStore.save(token, null);
	}
	return pb;
}

export function parseToken(token) {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
		return payload;
	} catch {
		return null;
	}
}

export async function validateToken(token) {
	try {
		const payload = parseToken(token);
		if (!payload || !payload.id) return null;

		const now = Math.floor(Date.now() / 1000);
		if (payload.exp && payload.exp < now) return null;

		const pb = createServerClient(token);
		const user = await pb.collection('users').getOne(payload.id);
		return user;
	} catch {
		return null;
	}
}
