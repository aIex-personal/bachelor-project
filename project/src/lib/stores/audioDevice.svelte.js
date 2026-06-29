
class AudioDeviceStore {
	
	devices = $state([]);

	
	selectedDeviceId = $state('');

	
	channelCount = $state(2);

	
	routingMode = $state( ('mixed'));

	
	isElectron = $state(false);

	
	canEnumerate = $state(false);

	
	loading = $state(false);

	
	error = $state( (null));

	
	get maxChannels() {
		return this.isElectron ? 16 : 2;
	}

	
	get channelOptions() {
		return [2, 4, 8, 16].filter(n => n <= this.maxChannels);
	}

	

	
	async init() {
		if (typeof window === 'undefined') return;

		this.isElectron = !!( (window).electronAPI?.isElectron);
		this.canEnumerate = typeof navigator.mediaDevices?.enumerateDevices === 'function';

		
		if (this.channelCount > this.maxChannels) {
			this.channelCount = this.maxChannels;
		}

		await this.refresh();

		
		if (this.canEnumerate) {
			navigator.mediaDevices.addEventListener('devicechange', () => this.refresh());
		}
	}

	

	
	get outputDevices() {
		return this.devices;
	}

	
	get selectedDevice() {
		if (!this.selectedDeviceId) return null;
		return this.devices.find(d => d.deviceId === this.selectedDeviceId) ?? null;
	}

	
	get isMultiChannel() {
		return this.routingMode === 'separated' && this.channelCount > 2;
	}

	

	
	async refresh() {
		if (!this.canEnumerate) return;

		this.loading = true;
		this.error = null;

		try {
			let all = await navigator.mediaDevices.enumerateDevices();
			let outputs = all.filter(d => d.kind === 'audiooutput');

			
			
			if (outputs.length > 0 && outputs.every(d => d.label === '')) {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					stream.getTracks().forEach(t => t.stop()); 
					all = await navigator.mediaDevices.enumerateDevices();
					outputs = all.filter(d => d.kind === 'audiooutput');
				} catch {
					
				}
			}

			this.devices = outputs;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}
}

export const audioDeviceStore = new AudioDeviceStore();
