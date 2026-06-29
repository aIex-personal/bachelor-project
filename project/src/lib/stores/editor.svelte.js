import { generateSoundName } from '$lib/utils/naming.js';

function defaultSound() {
	return {
		id: '',
		name: '',
		wave_type: 'sine',
		frequency: 200,
		frequency_end: 200,
		amplitude: 0.7,
		duration: 100,
		envelope: [],
		tags: [],
		category: '',
		notes: ''
	};
}

class EditorStore {
	
	activeTab = $state('new');

	
	sound = $state(defaultSound());

	
	isDirty = $state(false);

	
	isSaving = $state(false);

	
	editingId = $state(null);

	
	editingBlockId = $state(null);

	
	notification = $state(null);
	notifType = $state('success');
	#notifTimer = null;

	
	newSound() {
		this.editingId = null;
		this.editingBlockId = null;
		this.sound = defaultSound();
		this.isDirty = false;
		this.activeTab = 'new';
	}

	
	loadForEdit(soundData, blockId = null) {
		this.editingId = soundData.id;
		this.editingBlockId = blockId;
		this.sound = { ...soundData };
		this.isDirty = false;
		this.activeTab = 'edit';
	}

	
	updateField(field, value) {
		this.sound = { ...this.sound, [field]: value };
		if (!this.sound.name || this.sound.name === '') {
			this.sound.name = generateSoundName(this.sound.wave_type, this.sound.frequency, this.sound.amplitude);
		}
		this.isDirty = true;
	}

	
	autoName() {
		this.sound.name = generateSoundName(this.sound.wave_type, this.sound.frequency, this.sound.amplitude);
	}

	
	notify(message, type = 'success') {
		this.notification = message;
		this.notifType = type;
		if (this.#notifTimer) clearTimeout(this.#notifTimer);
		this.#notifTimer = setTimeout(() => {
			this.notification = null;
		}, 3000);
	}

	
	reset() {
		this.sound = defaultSound();
		this.editingId = null;
		this.editingBlockId = null;
		this.isDirty = false;
		this.activeTab = 'new';
	}
}

export const editorStore = new EditorStore();
