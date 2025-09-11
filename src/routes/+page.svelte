<script lang="ts">
	import { onMount } from 'svelte';
	
	import { dataStore } from '$lib/DataStoreService.js';
	import { formatDuration, formatTime } from '$lib/Utilities';
	import type { Routine, Session, SessionStatus, Step } from '$lib/types';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';

	
	let routines = $state<Routine[]>([]);
	let recentSessions = $state<Session[]>([]);
	let routineStats = $state<Map<string, {stepCount: number, totalDuration: number}>>(new Map());
	let loading = $state(true);
	
	onMount(async () => {
		await loadData();
		loading = false;
	});
	
	async function loadData() {
		routines = await dataStore.getRoutines();
		const sessions = await dataStore.getSessions();
		recentSessions = sessions.slice(0, 5);
		
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
	
	function getStatusColor(status: SessionStatus): string {
		switch (status) {
			case 'completed': return 'text-success-500';
			case 'partial': return 'text-warning-500';
			case 'abandoned': return 'text-error-500';
			default: return 'text-primary-500';
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
			<!-- My Routines -->
			<section>
				<h2 class="text-2xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
					My Routines ({routines.length})
				</h2>
				
				{#if routines.length === 0}
					<div class="card p-6 text-center bg-surface-100 dark:bg-surface-800">
						<p class="text-surface-600 dark:text-surface-300 mb-4">
							No routines yet. Get started by creating one from a template!
						</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each routines as routine (routine.id)}
							{@const stats = routineStats.get(routine.id)}
							<a 
								href="/routines/{routine.id}"
								class="card p-4 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all cursor-pointer hover:scale-[1.02] block"
								style="border-left: 4px solid {routine.color}"
							>
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
								</div>
							</a>
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
					<div class="card p-4 text-center bg-surface-100 dark:bg-surface-800">
						<p class="text-surface-600 dark:text-surface-300">
							No recent activity. Start your first routine!
						</p>
					</div>
				{:else}
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
													{session.startTimestamp.toLocaleDateString()}
												</p>
											</div>
										</div>
										<div class="text-right">
											<p class="text-sm {getStatusColor(session.status)} font-medium">
												{session.status.toUpperCase()}
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
	{/if}
</div>

<BottomToolbar />
