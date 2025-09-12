<script lang="ts">
	import { DAYS_OF_WEEK, WEEKDAYS, WEEKENDS, ALL_DAYS } from '$lib/types';
	
	interface Props {
		selectedDays: number[];
		label?: string;
		showPresets?: boolean;
	}
	
	let { 
		selectedDays = $bindable([]),
		label = "Available Days",
		showPresets = true
	}: Props = $props();
	
	// Toggle a specific day
	function toggleDay(dayIndex: number) {
		if (selectedDays.includes(dayIndex)) {
			selectedDays = selectedDays.filter(d => d !== dayIndex);
		} else {
			selectedDays = [...selectedDays, dayIndex].sort();
		}
	}
	
	// Preset functions
	function setWeekdays() {
		selectedDays = [...WEEKDAYS];
	}
	
	function setWeekends() {
		selectedDays = [...WEEKENDS];
	}
	
	function setAllDays() {
		selectedDays = [...ALL_DAYS];
	}
	
	function clearAll() {
		selectedDays = [];
	}
</script>

<div class="space-y-3">
	{#if label}
		<div class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
			{label}
		</div>
	{/if}
	
	<!-- Day buttons -->
	<div class="flex space-x-2">
		{#each DAYS_OF_WEEK as day}
			<button
				type="button"
				onclick={() => toggleDay(day.index)}
				class="w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200
					{selectedDays.includes(day.index)
						? 'bg-primary-500 text-white shadow-md hover:bg-primary-600'
						: 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				title={day.full}
			>
				{day.short}
			</button>
		{/each}
	</div>
	
	<!-- Preset buttons -->
	{#if showPresets}
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={setWeekdays}
				class="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
			>
				Weekdays
			</button>
			<button
				type="button"
				onclick={setWeekends}
				class="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
			>
				Weekends
			</button>
			<button
				type="button"
				onclick={setAllDays}
				class="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
			>
				Every Day
			</button>
			<button
				type="button"
				onclick={clearAll}
				class="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
			>
				Clear
			</button>
		</div>
	{/if}
	
	<!-- Selected days summary -->
	{#if selectedDays.length > 0}
		<div class="text-xs text-surface-500 dark:text-surface-400">
			Active on: {selectedDays.map(i => DAYS_OF_WEEK[i].full).join(', ')}
		</div>
	{:else}
		<div class="text-xs text-surface-400 dark:text-surface-500">
			No days selected (routine/step will be inactive)
		</div>
	{/if}
</div>
