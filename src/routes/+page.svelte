<script lang="ts">
	import { onMount } from 'svelte';
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import { DataStoreService } from '$lib/DataStoreService.js';
	import { formatDuration, formatTime } from '$lib/Utilities';
	import { DAYS_OF_WEEK } from '$lib/types';
	import type { Routine, Session, SessionStatus, Step } from '$lib/types';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';
        import { Clock, ChevronLeft, ChevronRight, Calendar, Settings, Star, Rocket } from '@lucide/svelte';

	
	let routines = $state<Routine[]>([]);
	let recentSessions = $state<Session[]>([]);
	let routineStats = $state<Map<string, {stepCount: number, totalDuration: number}>>(new Map());
	let loading = $state(true);
	
	// Day selection state
	let selectedDate = $state(new Date());
	
	let currentWeekDates = $state<Date[]>([]);
	let dayPopupOpen = $state(false);
	let completedTodayOpen = $state(false);

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
	
	function toggleCompletedToday() {
		completedTodayOpen = !completedTodayOpen;
	}
	
	function closeCompletedToday() {
		completedTodayOpen = false;
	}
	
	function previousDay() {
		const currentIndex = currentWeekDates.findIndex(date => isSameDate(date, selectedDate));
		if (currentIndex > 0) {
			selectDate(currentWeekDates[currentIndex - 1]);
		}
	}
	
	function nextDay() {
		const currentIndex = currentWeekDates.findIndex(date => isSameDate(date, selectedDate));
		if (currentIndex < currentWeekDates.length - 1) {
			selectDate(currentWeekDates[currentIndex + 1]);
		}
	}
	
	function canGoPrevious(): boolean {
		const currentIndex = currentWeekDates.findIndex(date => isSameDate(date, selectedDate));
		return currentIndex > 0;
	}
	
	function canGoNext(): boolean {
		const currentIndex = currentWeekDates.findIndex(date => isSameDate(date, selectedDate));
		return currentIndex < currentWeekDates.length - 1;
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
		routines = await DataStoreService.getRoutines();
		const sessions = await DataStoreService.getSessions();
		
		// Filter sessions for the selected date and completed status
		const selectedDateStr = selectedDate.toDateString();
		const sessionsForSelectedDate = sessions.filter((session: Session) => 
			session.startTimestamp.toDateString() === selectedDateStr &&
			session.status === 'completed'
		);
		recentSessions = sessionsForSelectedDate.slice(0, 10);
		
		// Load routine statistics
		const statsMap = new Map();
		for (const routine of routines) {
			const steps = await DataStoreService.getStepsForRoutine(routine.id);
			const totalDuration = steps.reduce((sum: number, step: Step) => sum + step.durationSeconds, 0);
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

<!-- Main Content with bottom padding for fixed toolbar and day selector -->
<div 
	class="container mx-auto p-4 max-w-6xl pb-32"

>
	<!-- Header -->
	<header class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
					<div class="flex items-center justify-start space-x-3"> <Star class="text-warning-500" /><span>Routined Life</span></div>
				</h1>
				<p class="text-surface-600 dark:text-surface-300">
					Manage your daily routines and build healthy habits
				</p>
			</div>
			<a 
				href="/settings"
				class="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
				title="Settings"
			>
				<Settings size={24} />
			</a>
		</div>
	</header>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
				<p class="text-surface-600 dark:text-surface-300">Loading your routines...</p>
			</div>
		</div>
	{:else}
		<!-- Available Routines - Now takes full width -->
		<section>
			{#if getFilteredRoutines().length > 0}
				<div class="space-y-4">
					{#each getFilteredRoutines() as routine (routine.id)}
						{@const stats = routineStats.get(routine.id)}
						<a 
							href="/routines/{routine.id}"
							class="card p-4 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all cursor-pointer hover:scale-[1.02] block"
							style="border-left: 4px solid {routine.color}"
						>
							<div class="flex items-center space-x-3">
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
						</a>
					{/each}
				</div>
			{:else}
				{#if routines.length === 0}
					<div class="mt-8 text-center">
						<div class="card p-8 bg-surface-100 dark:bg-surface-800">
							<h3 class="text-xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
								<div class="flex items-center justify-center space-x-3"> 
								<span>Time to get started!</span>
								<Rocket class="text-primary-500" />
								</div>
							</h3>
							<p class="text-surface-600 dark:text-surface-300 mb-6">
								Create your first routine to begin organizing your daily habits and tasks.
							</p>
							<a href="/routines/new" class="btn preset-filled-primary-500">
								Create Your First Routine
							</a>
						</div>
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

			{/if}
		</section>
	{/if}
</div>

<!-- Day Selector Bar - Fixed above bottom toolbar -->
<div class="fixed bottom-16 mb-6 left-0 right-0 bg-surface-50 dark:bg-surface-900 p-4 z-40">
	<div class="container mx-auto max-w-6xl">
		<div class="flex justify-between items-center space-x-4">
			<!-- Completed Today Button -->
			<button 
				onclick={toggleCompletedToday}
				class="flex items-center space-x-2 px-4 py-3 
					text-white hover:text-secondary-300 dark:hover:text-secondary-600
					rounded-lg transition-colors font-semibold min-w-[140px] justify-center"
			>
				<Clock size={24} />
				<span>Completed</span>
			</button>
			
			<!-- Day Selector Button -->
			<button 
				onclick={toggleDayPopup}
				class="flex items-center space-x-2 px-4 py-3 
					{isToday(selectedDate) ? "text-primary-100 hover:text-primary-500" : "text-white hover:text-tertiary-300 dark:hover:text-tertiary-600"}
					rounded-lg transition-colors font-semibold min-w-[140px] justify-center"
			>
				<span>{getDayName(selectedDate)}</span>
				<Calendar size={24} />
			</button>
		</div>
	</div>
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
	<div 
		class="fixed bottom-0 left-0 right-0 bg-surface-100 dark:bg-surface-800 border-t border-surface-300 dark:border-surface-600 z-[70] p-4 sm:p-6"
	>
		<div class="w-full sm:container sm:mx-auto sm:max-w-6xl">
			<!-- Header -->
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
						class:bg-warning-200={isToday && !isSelected}
						class:dark:bg-warning-800={isToday && !isSelected}
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

<!-- Completed Today Popup -->
{#if completedTodayOpen}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black opacity-50 z-[60]" 
		onclick={closeCompletedToday}
		onkeydown={(e) => e.key === 'Escape' && closeCompletedToday()}
		role="button"
		tabindex="0"
	></div>
	
	<!-- Popup Panel -->
	<div 
		class="fixed bottom-0 left-0 right-0 bg-surface-100 dark:bg-surface-800 border-t border-surface-300 dark:border-surface-600 z-[70] p-4 sm:p-6 max-h-[80vh] overflow-y-auto"
	>
		<div class="w-full sm:container sm:mx-auto sm:max-w-6xl">
			<!-- Header -->
			<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4 text-center">
				Completed on {getDayName(selectedDate)}
			</h3>
			
			<!-- Content -->
			{#if recentSessions.length > 0}
				<div class="space-y-3">
					{#each recentSessions as session (session.id)}
						{@const routine = routines.find(r => r.id === session.routineId)}
						{#if routine}
							<div class="card p-3 bg-surface-200 dark:bg-surface-700">
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
				<div class="card p-6 text-center bg-surface-200 dark:bg-surface-700">
					<p class="text-surface-600 dark:text-surface-300">
						No routines completed on {formatDate(selectedDate)}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<BottomToolbar />
