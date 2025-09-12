<script lang="ts">
	import { type AppSettings } from '$lib/types';
	import { ArrowLeft, Sun, Moon } from '@lucide/svelte';
	import { DataStoreService } from '$lib/DataStoreService';
	import { onMount } from 'svelte';
    import { Switch } from '@skeletonlabs/skeleton-svelte';

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

	function handleAutoEmojiChange(checked: boolean) {
		settings.autoEmoji = checked;
		saveSettings();
	}

	function handleDarkModeChange(checked: boolean) {
		settings.darkMode = checked;
		saveSettings();
	}

	function handleWeekStartChange(checked: boolean) {
		settings.weekStartsOnMonday = checked;
		saveSettings();
	}

	function handleTimeFormatChange(checked: boolean) {
		settings.timeFormat24h = checked;
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
		<div class="card p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold mb-1">
						🎭 Automatically add emoji based on name
					</h3>
					<p class="text-surface-600 dark:text-surface-300 text-sm">
						When enabled, emojis will be automatically suggested based on routine names
					</p>
				</div>
				<Switch 
					name="autoEmoji" 
					checked={settings.autoEmoji}
					onCheckedChange={(e) => handleAutoEmojiChange(e.checked)}
				/>
			</div>
		</div>

		<!-- Dark Mode Setting -->
		<div class="card p-6">
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
				<Switch 
					name="darkMode" 
					checked={settings.darkMode}
					onCheckedChange={(e) => handleDarkModeChange(e.checked)}
					disabled
				/>
			</div>
		</div>

		<!-- Week Start Setting -->
		<div class="card p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold mb-1">
						📅 Start week at Monday
					</h3>
					<p class="text-surface-600 dark:text-surface-300 text-sm">
						When enabled, weeks will start on Monday. When disabled, weeks will start on Sunday
					</p>
				</div>
				<Switch 
					name="weekStart" 
					checked={settings.weekStartsOnMonday}
					onCheckedChange={(e) => handleWeekStartChange(e.checked)}
				/>
			</div>
		</div>

		<!-- Time Format Setting -->
		<div class="card p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold mb-1">
						🕐 24-hour time format
					</h3>
					<p class="text-surface-600 dark:text-surface-300 text-sm">
						When enabled, times will be displayed in 24-hour format (e.g., 14:30). When disabled, 12-hour format will be used (e.g., 2:30 PM)
					</p>
				</div>
				<Switch 
					name="timeFormat" 
					checked={settings.timeFormat24h}
					onCheckedChange={(e) => handleTimeFormatChange(e.checked)}
				/>
			</div>
		</div>
	</div>
</div>
