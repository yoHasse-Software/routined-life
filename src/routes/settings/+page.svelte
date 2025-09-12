<script lang="ts">
	import { type AppSettings } from '$lib/types';
	import { ArrowLeft, Sun, Moon } from '@lucide/svelte';
	import { DataStoreService } from '$lib/DataStoreService';
	import { onMount } from 'svelte';

	let settings = $state<AppSettings>({
		autoEmoji: true,
		darkMode: false,
		weekStartsOnMonday: true,
		timeFormat24h: true
	});

	onMount(() => {
		// Load settings from localStorage or set defaults
		const savedSettings = DataStoreService.getSettings();
		if (savedSettings) {
			settings = savedSettings;
		}
	});

	function saveSettings() {
		DataStoreService.saveSettings(settings);
	}

	function handleAutoEmojiChange(event: Event) {
		const target = event.target as HTMLInputElement;
		settings.autoEmoji = target.checked;
		saveSettings();
	}

	function handleDarkModeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		settings.darkMode = target.checked;
		saveSettings();
	}

	function handleWeekStartChange(event: Event) {
		const target = event.target as HTMLInputElement;
		settings.weekStartsOnMonday = target.checked;
		saveSettings();
	}

	function handleTimeFormatChange(event: Event) {
		const target = event.target as HTMLInputElement;
		settings.timeFormat24h = target.checked;
		saveSettings();
	}
</script>



<div class="container mx-auto px-4 py-6 max-w-4xl">
	<!-- Header -->
	<header class="mb-8">
		<div class="flex items-center gap-4 mb-4">
			<a 
				href="/"
				class="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
				title="Back to Home"
			>
				<ArrowLeft size={24} />
			</a>
			<div>
				<h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400">
					⚙️ Settings
				</h1>
				<p class="text-surface-600 dark:text-surface-300">
					Customize your Routined Life experience
				</p>
			</div>
		</div>
	</header>

	<!-- Settings Content -->
	<div class="space-y-6">
		<!-- Auto Emoji Setting -->
		<div class=" p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold mb-1">
						🎭 Automatically add emoji based on name
					</h3>
					<p class="text-surface-600 dark:text-surface-300 text-sm">
						When enabled, emojis will be automatically suggested based on routine names
					</p>
				</div>
				<label class="toggle-switch">
					<input 
						type="checkbox"
						name="autoEmoji"
						checked={settings.autoEmoji}
						onchange={handleAutoEmojiChange}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>

		<!-- Dark Mode Setting -->
		<div class=" p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-2">
						{#if settings.darkMode}
							<Moon size={20} />
						{:else}
							<Sun size={20} />
						{/if}
					</div>
					<div>
						<h3 class="text-lg font-semibold mb-1">
							Dark or light theme
						</h3>
						<p class="text-surface-600 dark:text-surface-300 text-sm">
							Choose between dark and light appearance (not implemented yet)
						</p>
					</div>
				</div>
				<label class="toggle-switch">
					<input 
						type="checkbox"
						name="darkMode"
						checked={settings.darkMode}
						onchange={handleDarkModeChange}
						disabled
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>

		<!-- Week Start Setting -->
		<div class=" p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold mb-1">
						📅 Start week at Monday
					</h3>
					<p class="text-surface-600 dark:text-surface-300 text-sm">
						When enabled, weeks will start on Monday. When disabled, weeks will start on Sunday
					</p>
				</div>
				<label class="toggle-switch">
					<input 
						type="checkbox"
						name="weekStart"
						checked={settings.weekStartsOnMonday}
						onchange={handleWeekStartChange}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>

		<!-- Time Format Setting -->
		<div class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold mb-1">
						🕐 24-hour time format
					</h3>
					<p class="text-surface-600 dark:text-surface-300 text-sm">
						When enabled, times will be displayed in 24-hour format (e.g., 14:30). When disabled, 12-hour format will be used (e.g., 2:30 PM)
					</p>
				</div>
				<label class="toggle-switch">
					<input 
						type="checkbox"
						name="timeFormat"
						checked={settings.timeFormat24h}
						onchange={handleTimeFormatChange}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom toggle switch styling */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.3s;
		border-radius: 24px;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: var(--color-surface-100);
		transition: 0.3s;
		border-radius: 50%;
        border: 1px solid var(--color-surface-300);
	}

	input:checked + .toggle-slider {
		background-color: var(--color-primary-500);
	}

	input:checked + .toggle-slider:before {
		transform: translateX(20px);
	}

	input:disabled + .toggle-slider {
		background-color: #e5e7eb;
		cursor: not-allowed;
	}

	input:disabled + .toggle-slider:before {
		background-color: #f3f4f6;
	}
</style>