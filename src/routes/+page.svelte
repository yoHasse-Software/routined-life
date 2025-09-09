<script lang="ts">
	import { onMount } from 'svelte';
	
	import { dataStore } from '$lib/DataStoreService.js';
	import { ROUTINE_TEMPLATES } from '$lib/RoutineTemplates';
	import { formatDuration } from '$lib/Utilities';
	import type { Routine, Session, SessionStatus } from '$lib/types';
	
	let routines = $state<Routine[]>([]);
	let recentSessions = $state<Session[]>([]);
	let loading = $state(true);
	
	onMount(async () => {
		await loadData();
		loading = false;
	});
	
	async function loadData() {
		routines = await dataStore.getRoutines();
		const sessions = await dataStore.getSessions();
		recentSessions = sessions.slice(0, 5);
	}
	
	async function createFromTemplate(template: any) {
		const routineId = dataStore.generateId();
		const routine: Routine = {
			id: routineId,
			name: template.name,
			emoji: template.emoji,
			color: template.color,
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		
		await dataStore.saveRoutine(routine);
		
		// Create steps
		for (let i = 0; i < template.steps.length; i++) {
			const step = template.steps[i];
			await dataStore.saveStep({
				id: dataStore.generateId(),
				routineId,
				name: step.name,
				emoji: step.emoji,
				description: step.description,
				durationSeconds: step.durationSeconds,
				checklist: step.checklist,
				order: i
			});
		}
		
		await loadData();
	}
	
	async function deleteRoutine(id: string) {
		if (confirm('Are you sure you want to delete this routine?')) {
			await dataStore.deleteRoutine(id);
			await loadData();
		}
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

<div class="container mx-auto p-4 max-w-6xl">
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
		<!-- Quick Actions -->
		<section class="mb-8">
			<div class="flex flex-wrap gap-4 mb-6">
				<a 
					href="/routines/new" 
					class="btn variant-filled-primary text-lg px-6 py-3"
				>
					➕ Create New Routine
				</a>
				<a 
					href="/stats" 
					class="btn variant-outline-secondary"
				>
					📊 View Stats
				</a>
			</div>
		</section>

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
							<div 
								class="card p-4 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
								style="border-left: 4px solid {routine.color}"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<span class="text-2xl">{routine.emoji}</span>
										<div>
											<h3 class="font-semibold text-surface-900 dark:text-surface-100">
												{routine.name}
											</h3>
											{#if routine.notes}
												<p class="text-sm text-surface-600 dark:text-surface-300">
													{routine.notes}
												</p>
											{/if}
										</div>
									</div>
									<div class="flex space-x-2">
										<a 
											href="/routines/{routine.id}/run" 
											class="btn variant-filled-primary btn-sm"
										>
											▶️ Start
										</a>
										<a 
											href="/routines/{routine.id}/edit" 
											class="btn variant-outline btn-sm"
										>
											✏️ Edit
										</a>
										<button 
											onclick={() => deleteRoutine(routine.id)}
											class="btn variant-outline-error btn-sm"
										>
											🗑️
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Templates & Recent Activity -->
			<section>
				<!-- Templates -->
				<div class="mb-8">
					<h2 class="text-2xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
						Starter Templates
					</h2>
					<div class="grid gap-3">
						{#each ROUTINE_TEMPLATES as template}
							<div class="card p-4 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<span class="text-xl">{template.emoji}</span>
										<div>
											<h4 class="font-medium text-surface-900 dark:text-surface-100">
												{template.name}
											</h4>
											<p class="text-sm text-surface-600 dark:text-surface-300">
												{template.steps.length} steps
											</p>
										</div>
									</div>
									<button 
										onclick={() => createFromTemplate(template)}
										class="btn variant-outline btn-sm"
									>
										+ Add
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Recent Activity -->
				<div>
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
				</div>
			</section>
		</div>
	{/if}
</div>
