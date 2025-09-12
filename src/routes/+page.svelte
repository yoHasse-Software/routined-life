<script lang="ts">
	import { onMount } from 'svelte';
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import { dataStore } from '$lib/DataStoreService.js';
	import { formatDuration, formatTime } from '$lib/Utilities';
	import { DAYS_OF_WEEK } from '$lib/types';
	import type { Routine, Session, SessionStatus, Step } from '$lib/types';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';
    import { Clock, ChevronLeft, ChevronRight, Calendar } from '@lucide/svelte';

	
	let routines = $state<Routine[]>([]);
	let recentSessions = $state<Session[]>([]);
	let routineStats = $state<Map<string, {stepCount: number, totalDuration: number}>>(new Map());
	let loading = $state(true);
	
	// Day selection state
	let selectedDate = $state(new Date());
	let currentDate = $state(new Date());
	let currentWeekDates = $state<Date[]>([]);
	let dayPopupOpen = $state(false);

	let value = $state(['recent']);
	
	onMount(async () => {
		initializeWeek();
		await loadData();
		loading = false;
	});
	
	// Reload data when selected date changes
	$effect(() => {
		if (selectedDate) {
			loadData();
		}
	});
	
	function initializeWeek() {
		const today = new Date();
		selectedDate = new Date(today);
		currentWeekDates = getCurrentWeekDates(today);
	}
	
	function getCurrentWeekDates(date: Date): Date[] {
		const startOfWeek = new Date(date);
		const day = startOfWeek.getDay();
		const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
		startOfWeek.setDate(diff);
		
		const weekDates = [];
		for (let i = 0; i < 7; i++) {
			const weekDate = new Date(startOfWeek);
			weekDate.setDate(startOfWeek.getDate() + i);
			weekDates.push(weekDate);
		}
		return weekDates;
	}
	
	function selectDate(date: Date) {
		selectedDate = new Date(date);
		dayPopupOpen = false; // Close popup after selection
	}
	
	function toggleDayPopup() {
		dayPopupOpen = !dayPopupOpen;
	}
	
	function closeDayPopup() {
		dayPopupOpen = false;
	}
	
	function previousWeek() {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() - 7);
		selectedDate = newDate;
		currentWeekDates = getCurrentWeekDates(newDate);
	}
	
	function nextWeek() {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + 7);
		selectedDate = newDate;
		currentWeekDates = getCurrentWeekDates(newDate);
	}
	
	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}
	
	function isSameDate(date1: Date, date2: Date): boolean {
		return date1.toDateString() === date2.toDateString();
	}
	
	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}
	
	function getShortDayName(date: Date): string {
		const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
		return DAYS_OF_WEEK[dayIndex].full.slice(0, 3); // Get first 3 characters
	}

	function getDayName(date: Date): string {
		const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
		return DAYS_OF_WEEK[dayIndex].full;
	}
	
	async function loadData() {
		routines = await dataStore.getRoutines();
		const sessions = await dataStore.getSessions();
		
		// Filter sessions for the selected date and completed status
		const selectedDateStr = selectedDate.toDateString();
		const sessionsForSelectedDate = sessions.filter(session => 
			session.startTimestamp.toDateString() === selectedDateStr &&
			session.status === 'completed'
		);
		recentSessions = sessionsForSelectedDate.slice(0, 10);
		
		// Load routine statistics
		const statsMap = new Map();
		for (const routine of routines) {
			const steps = await dataStore.getStepsForRoutine(routine.id);
			const totalDuration = steps.reduce((sum, step) => sum + step.durationSeconds, 0);
			statsMap.set(routine.id, {
				stepCount: steps.length,
				totalDuration: totalDuration
			});
		}
		routineStats = statsMap;
	}
	
	// Get filtered routines for the selected day
	function getFilteredRoutines(): Routine[] {
		const dayOfWeek = selectedDate.getDay();
		const selectedDateStr = selectedDate.toDateString();
		
		return routines.filter(routine => {
			// Check if routine is available for this day
			const isAvailableToday = !routine.availableDays || routine.availableDays.includes(dayOfWeek);
			if (!isAvailableToday) return false;
			
			// Check if routine has been completed today (unless it can repeat)
			const completedToday = recentSessions.some(session => 
				session.routineId === routine.id &&
				session.startTimestamp.toDateString() === selectedDateStr &&
				session.status === 'completed'
			);
			
			// Show if not completed today, or if it can repeat
			return !completedToday || routine.canRepeat;
		});
	}
	
	function getStatusColor(status: SessionStatus): string {
		switch (status) {
			case 'completed': return 'text-success-500';
			case 'partial': return 'text-warning-500';
			case 'abandoned': return 'text-error-500';
			default: return 'text-primary-500';
		}
	}

	function durationFromSession(session: Session): string {
		if (!session.startTimestamp || !session.endTimestamp) return 'N/A';
		const durationSeconds = Math.floor((session.endTimestamp.getTime() - session.startTimestamp.getTime()) / 1000);
		if (durationSeconds < 60) {
			return `${durationSeconds} sec`;
		} else if (durationSeconds < 3600) {
			return `${Math.ceil(durationSeconds / 60)} min`;
		} else {
			return `${(durationSeconds / 3600).toFixed(1)} hr`;
		}
	}

</script>

<svelte:head>
	<title>Routined Life - Dashboard</title>
</svelte:head>

<!-- Main Content with bottom padding for fixed toolbar -->
<div class="container mx-auto p-4 max-w-6xl pb-24">
	<!-- Header -->
	<header class="mb-8">
		<h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
			🌟 Routined Life
		</h1>
		<p class="text-surface-600 dark:text-surface-300">
			Manage your daily routines and build healthy habits
		</p>
	</header>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
				<p class="text-surface-600 dark:text-surface-300">Loading your routines...</p>
			</div>
		</div>
	{:else}
		<div class="grid lg:grid-cols-2 gap-8">
			<!-- Available Routines -->
			<section>
				<div class="flex justify-end items-center mb-4">

					<button 
						onclick={toggleDayPopup}
						class="flex  items-center space-x-2 px-3 py-2 
							{isToday(selectedDate) ? "bg-primary-500 hover:bg-primary-600" : "bg-tertiary-200 dark:bg-tertiary-700 hover:bg-tertiary-300 dark:hover:bg-tertiary-600"}
							text-white rounded-lg transition-colors"
					>
						<span>{getDayName(selectedDate)}</span>
						<Calendar size={16} />
					</button>
				</div>
				{#if getFilteredRoutines().length > 0}
					<div class="space-y-4">
						{#each getFilteredRoutines() as routine (routine.id)}
							{@const stats = routineStats.get(routine.id)}
							<div class="card p-4 bg-surface-100 dark:bg-surface-800" style="border-left: 4px solid {routine.color}">
								<div class="flex items-center justify-between mb-3">
									<div class="flex items-center space-x-3 flex-1">
										<span class="text-2xl">{routine.emoji}</span>
										<div class="flex-1">
											<h3 class="font-semibold text-surface-900 dark:text-surface-100 text-lg">
												{routine.name}
											</h3>
											{#if routine.notes}
												<p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
													{routine.notes}
												</p>
											{/if}
											{#if stats}
												<div class="flex items-center space-x-4 text-sm text-surface-500 dark:text-surface-400">
													<span>{stats.stepCount} steps</span>
													<span>{formatTime(stats.totalDuration)}</span>
												</div>
											{/if}
										</div>
									</div>
									<div class="flex space-x-2">
										<a href="/routines/{routine.id}/run" class="btn btn-primary">Start</a>
										<a href="/routines/{routine.id}" class="btn btn-secondary">View</a>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="card p-6 text-center bg-surface-100 dark:bg-surface-800">
						<p class="text-surface-600 dark:text-surface-300">
							{isSameDate(selectedDate, new Date()) 
								? "All routines completed for today! 🎉" 
								: `No available routines for ${formatDate(selectedDate)}`}
						</p>
					</div>
				{/if}
			</section>

			<!-- Completed Today -->
			<section>
				<Accordion {value} onValueChange={(e) => (value = e.value)} collapsible>
					<Accordion.Item value="completed">
						{#snippet lead()}<Clock />{/snippet}
						{#snippet control()}Completed on {getDayName(selectedDate)}{/snippet}
						{#snippet panel()}
							{#if recentSessions.length > 0}
								<div class="space-y-3">
									{#each recentSessions as session (session.id)}
										{@const routine = routines.find(r => r.id === session.routineId)}
										{#if routine}
											<div class="card p-3 bg-surface-100 dark:bg-surface-800">
												<div class="flex items-center justify-between">
													<div class="flex items-center space-x-2">
														<span class="text-lg">{routine.emoji}</span>
														<div>
															<p class="font-medium text-surface-900 dark:text-surface-100">
																{routine.name}
															</p>
															<p class="text-xs text-surface-600 dark:text-surface-300">
																Completed at {session.startTimestamp.toLocaleTimeString()}
															</p>
															{#if session.endTimestamp}
																<p class="text-xs text-surface-500 dark:text-surface-400">
																	Duration: {durationFromSession(session)}
																</p>
															{/if}
														</div>
													</div>
													<a href="/routines/{routine.id}" class="btn btn-secondary btn-sm">View</a>
												</div>
											</div>
										{/if}
									{/each}
								</div>
							{:else}
								<div class="card p-6 text-center bg-surface-100 dark:bg-surface-800">
									<p class="text-surface-600 dark:text-surface-300">
										No routines completed on {formatDate(selectedDate)}
									</p>
								</div>
							{/if}
						{/snippet}
					</Accordion.Item>
				</Accordion>
			</section>
		</div>
	{/if}
</div>

<!-- Day Selection Popup -->
{#if dayPopupOpen}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black opacity-50 z-[60]" 
		onclick={closeDayPopup}
		onkeydown={(e) => e.key === 'Escape' && closeDayPopup()}
		role="button"
		tabindex="0"
	></div>
	
	<!-- Popup Bar -->
	<div class="fixed bottom-0 left-0 right-0 bg-surface-100 dark:bg-surface-800 border-t border-surface-300 dark:border-surface-600 z-[70] p-4 sm:p-6">
		<div class="w-full sm:container sm:mx-auto sm:max-w-6xl">
			<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4 text-center">
				Select Day
			</h3>
			<div class="grid grid-cols-7 gap-1 sm:gap-2">
				{#each currentWeekDates as date, index}
					{@const isSelected = isSameDate(date, selectedDate)}
					{@const isToday = isSameDate(date, new Date())}
					<button 
						class="day-button p-3 sm:p-4 rounded-lg text-center transition-all hover:scale-105 min-h-[60px] sm:min-h-auto"
						class:bg-primary-500={isSelected}
						class:text-white={isSelected}
						class:bg-surface-200={!isSelected}
						class:dark:bg-surface-700={!isSelected}
						class:bg-tertiary-200={isToday && !isSelected}
						class:dark:bg-tertiary-800={isToday && !isSelected}
						onclick={() => selectDate(date)}
					>
						<div class="font-medium text-xs sm:text-sm">{DAYS_OF_WEEK[index].full.slice(0, 3)}</div>
						<div class="text-base sm:text-lg font-bold">{date.getDate()}</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<BottomToolbar />
