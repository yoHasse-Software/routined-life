<script lang="ts">
	import { onMount } from 'svelte';
	import { dataStore } from '$lib/DataStoreService';
	import { formatDuration, formatDate, getWeekStart } from '$lib/Utilities';
	import type { Routine, Session, SessionStatus } from '$lib/types';

	let routines = $state<Routine[]>([]);
	let sessions = $state<Session[]>([]);
	let loading = $state(true);

	onMount(async () => {
		await loadData();
		loading = false;
	});

	async function loadData() {
		routines = await dataStore.getRoutines();
		sessions = await dataStore.getSessions();
	}

	function getWeeklyStats() {
		const now = new Date();
		const weekStart = getWeekStart(now);
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 7);

		const thisWeekSessions = sessions.filter(session => 
			session.startTimestamp >= weekStart && 
			session.startTimestamp < weekEnd
		);

		const completedSessions = thisWeekSessions.filter(s => s.status === 'completed');
		const totalTime = thisWeekSessions
			.filter(s => s.endTimestamp)
			.reduce((total, session) => {
				const duration = (session.endTimestamp!.getTime() - session.startTimestamp.getTime()) / 1000;
				return total + duration;
			}, 0);

		return {
			totalSessions: thisWeekSessions.length,
			completedSessions: completedSessions.length,
			completionRate: thisWeekSessions.length > 0 ? Math.round((completedSessions.length / thisWeekSessions.length) * 100) : 0,
			totalTime: Math.floor(totalTime)
		};
	}

	function getAllTimeStats() {
		const completedSessions = sessions.filter(s => s.status === 'completed');
		const totalTime = sessions
			.filter(s => s.endTimestamp)
			.reduce((total, session) => {
				const duration = (session.endTimestamp!.getTime() - session.startTimestamp.getTime()) / 1000;
				return total + duration;
			}, 0);

		return {
			totalSessions: sessions.length,
			completedSessions: completedSessions.length,
			completionRate: sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0,
			totalTime: Math.floor(totalTime)
		};
	}

	function getRoutineStats() {
		return routines.map(routine => {
			const routineSessions = sessions.filter(s => s.routineId === routine.id);
			const completedSessions = routineSessions.filter(s => s.status === 'completed');
			
			return {
				routine,
				totalRuns: routineSessions.length,
				completedRuns: completedSessions.length,
				completionRate: routineSessions.length > 0 ? Math.round((completedSessions.length / routineSessions.length) * 100) : 0,
				lastRun: routineSessions.length > 0 ? routineSessions[routineSessions.length - 1].startTimestamp : null
			};
		}).sort((a, b) => b.totalRuns - a.totalRuns);
	}

	function getStatusColor(status: SessionStatus): string {
		switch (status) {
			case 'completed': return 'text-success-500';
			case 'partial': return 'text-warning-500';
			case 'abandoned': return 'text-error-500';
			default: return 'text-primary-500';
		}
	}

	function getRecentSessions() {
		return sessions
			.sort((a, b) => b.startTimestamp.getTime() - a.startTimestamp.getTime())
			.slice(0, 10);
	}
</script>

<svelte:head>
	<title>Statistics - Routined Life</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl">
	<!-- Header -->
	<header class="mb-8">
		<div class="flex items-center justify-between">
			<h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400">
				📊 Statistics
			</h1>
			<a href="/" class="btn variant-outline">
				← Back to Dashboard
			</a>
		</div>
	</header>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
				<p class="text-surface-600 dark:text-surface-300">Loading statistics...</p>
			</div>
		</div>
	{:else}
		{@const weeklyStats = getWeeklyStats()}
		{@const allTimeStats = getAllTimeStats()}
		{@const routineStats = getRoutineStats()}
		{@const recentSessions = getRecentSessions()}

		<div class="grid lg:grid-cols-2 gap-8">
			<!-- Weekly Overview -->
			<section>
				<h2 class="text-2xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
					This Week
				</h2>
				<div class="grid grid-cols-2 gap-4 mb-6">
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
							{weeklyStats.totalSessions}
						</p>
						<p class="text-surface-600 dark:text-surface-300">Total Sessions</p>
					</div>
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-success-600 dark:text-success-400">
							{weeklyStats.completedSessions}
						</p>
						<p class="text-surface-600 dark:text-surface-300">Completed</p>
					</div>
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-secondary-600 dark:text-secondary-400">
							{weeklyStats.completionRate}%
						</p>
						<p class="text-surface-600 dark:text-surface-300">Success Rate</p>
					</div>
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-tertiary-600 dark:text-tertiary-400">
							{formatDuration(weeklyStats.totalTime)}
						</p>
						<p class="text-surface-600 dark:text-surface-300">Time Invested</p>
					</div>
				</div>
			</section>

			<!-- All Time Overview -->
			<section>
				<h2 class="text-2xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
					All Time
				</h2>
				<div class="grid grid-cols-2 gap-4 mb-6">
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
							{allTimeStats.totalSessions}
						</p>
						<p class="text-surface-600 dark:text-surface-300">Total Sessions</p>
					</div>
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-success-600 dark:text-success-400">
							{allTimeStats.completedSessions}
						</p>
						<p class="text-surface-600 dark:text-surface-300">Completed</p>
					</div>
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-secondary-600 dark:text-secondary-400">
							{allTimeStats.completionRate}%
						</p>
						<p class="text-surface-600 dark:text-surface-300">Success Rate</p>
					</div>
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
						<p class="text-3xl font-bold text-tertiary-600 dark:text-tertiary-400">
							{formatDuration(allTimeStats.totalTime)}
						</p>
						<p class="text-surface-600 dark:text-surface-300">Time Invested</p>
					</div>
				</div>
			</section>
		</div>

		<div class="grid lg:grid-cols-2 gap-8 mt-8">
			<!-- Routine Performance -->
			<section>
				<h2 class="text-2xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
					Routine Performance
				</h2>
				{#if routineStats.length === 0}
					<div class="card p-6 text-center bg-surface-100 dark:bg-surface-800">
						<p class="text-surface-600 dark:text-surface-300">
							No routine data available yet.
						</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each routineStats as stat}
							<div class="card p-4 bg-surface-100 dark:bg-surface-800">
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<span class="text-2xl">{stat.routine.emoji}</span>
										<div>
											<h3 class="font-semibold text-surface-900 dark:text-surface-100">
												{stat.routine.name}
											</h3>
											<p class="text-sm text-surface-600 dark:text-surface-300">
												{stat.totalRuns} runs • {stat.completionRate}% success rate
											</p>
										</div>
									</div>
									<div class="text-right">
										<p class="text-lg font-bold text-primary-600 dark:text-primary-400">
											{stat.completedRuns}/{stat.totalRuns}
										</p>
										{#if stat.lastRun}
											<p class="text-xs text-surface-600 dark:text-surface-300">
												Last: {formatDate(stat.lastRun)}
											</p>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Recent Activity -->
			<section>
				<h2 class="text-2xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
					Recent Activity
				</h2>
				{#if recentSessions.length === 0}
					<div class="card p-6 text-center bg-surface-100 dark:bg-surface-800">
						<p class="text-surface-600 dark:text-surface-300">
							No activity yet. Start your first routine!
						</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each recentSessions as session}
							{@const routine = routines.find(r => r.id === session.routineId)}
							{#if routine}
								<div class="card p-3 bg-surface-100 dark:bg-surface-800">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-3">
											<span class="text-lg">{routine.emoji}</span>
											<div>
												<p class="font-medium text-surface-900 dark:text-surface-100">
													{routine.name}
												</p>
												<p class="text-sm text-surface-600 dark:text-surface-300">
													{formatDate(session.startTimestamp)}
												</p>
											</div>
										</div>
										<div class="text-right">
											<p class="text-sm {getStatusColor(session.status)} font-medium capitalize">
												{session.status}
											</p>
											{#if session.endTimestamp}
												<p class="text-xs text-surface-600 dark:text-surface-300">
													{formatDuration(Math.floor((session.endTimestamp.getTime() - session.startTimestamp.getTime()) / 1000))}
												</p>
											{/if}
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</section>
		</div>

		{#if sessions.length === 0}
			<div class="mt-8 text-center">
				<div class="card p-8 bg-surface-100 dark:bg-surface-800">
					<h3 class="text-xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
						Start Building Your Routine Habits! 🚀
					</h3>
					<p class="text-surface-600 dark:text-surface-300 mb-6">
						Complete your first routine to see detailed statistics and track your progress.
					</p>
					<a href="/" class="btn variant-filled-primary">
						Create Your First Routine
					</a>
				</div>
			</div>
		{/if}
	{/if}
</div>
