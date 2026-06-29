
export const POCKETBASE_URL = 'http://127.0.0.1:8090';

const mockRecord = null;
const mockToken = '';

export const pb = {
	authStore: {
		record: mockRecord,
		token: mockToken,
		isValid: false,
		onChange: vi.fn(),
		clear: vi.fn()
	},
	autoCancellation: vi.fn(),
	collection: vi.fn(() => ({
		authWithPassword: vi.fn(),
		create: vi.fn(),
		getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
		getOne: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	}))
};
