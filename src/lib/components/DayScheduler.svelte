<script lang="ts">
	import { DAYS_OF_WEEK, WEEKDAYS, WEEKENDS, ALL_DAYS } from '$lib/types';
	
	interface Props {
		selectedDays: number[];
		label?: string;
		showPresets?: boolean;
		availableDays?: number[]; // Filter which days can be selected (for step-level scheduling)
	}
	
	let { 
		selectedDays = $bindable([]),
		label = "Available Days",
		showPresets = true,
		availableDays = ALL_DAYS // Default to all days if not provided
	}: Props = $props();

    // let routineDays = DAYS_OF_WEEK.filter(day => availableDays.includes(day.index));

		
	// Toggle a specific day
	function toggleDay(dayIndex: number) {
		if (selectedDays.includes(dayIndex)) {
			selectedDays = selectedDays.filter(d => d !== dayIndex);
		} else {
			selectedDays = [...selectedDays, dayIndex].sort();
		}
	}
	
	// Preset functions - filtered to only include available days
	function setWeekdays() {
		const availableWeekdays = WEEKDAYS.filter(day => availableDays.includes(day));
		selectedDays = [...availableWeekdays];
	}
	
	function setWeekends() {
		const availableWeekends = WEEKENDS.filter(day => availableDays.includes(day));
		selectedDays = [...availableWeekends];
	}
	
	function setAllDays() {
		selectedDays = [...availableDays];
	}
	
	function clearAll() {
		selectedDays = [];
	}

    $effect(() => {
        hasWeekdays = WEEKDAYS.some(day => availableDays.includes(day));
        hasWeekends = WEEKENDS.some(day => availableDays.includes(day));
    });

    $effect(() => {
        // Ensure selectedDays only contains days that are in availableDays
        availableDays;
        setTimeout(() => {
            // console.log('Available Days changed, updated selectedDays:', selectedDays);
            selectedDays = selectedDays.filter(d => availableDays.includes(d));
        }, 0);
    });
	
	// Check if presets are available with current context
	let hasWeekdays = $state(WEEKDAYS.some(day => availableDays.includes(day)));
	let hasWeekends = $state(WEEKENDS.some(day => availableDays.includes(day)));
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
                disabled={!availableDays.includes(day.index)}
			>
				{day.short}
			</button>
		{/each}
	</div>
	
	<!-- Preset buttons -->
	{#if showPresets}
		<div class="flex flex-wrap gap-2">
			{#if hasWeekdays}
				<button
					type="button"
					onclick={setWeekdays}
					class="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
				>
					Weekdays
				</button>
			{/if}
			{#if hasWeekends}
				<button
					type="button"
					onclick={setWeekends}
					class="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
				>
					Weekends
				</button>
			{/if}
			<button
				type="button"
				onclick={setAllDays}
				class="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
			>
				All Available
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
			Active on: {selectedDays.map(i => DAYS_OF_WEEK.find(d => d.index === i)?.full).filter(Boolean).join(', ')}
		</div>
	{:else}
		<div class="text-xs text-surface-400 dark:text-surface-500">
			No days selected (routine/step will be inactive)
		</div>
	{/if}
</div>
