<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { dataStore } from '$lib/DataStoreService';
	import { formatTime } from '$lib/Utilities.js';
	import type { Routine, Step } from '$lib/types';
	import { ArrowLeft, Play, SquarePen } from '@lucide/svelte';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';

	const routineId = page.params.id;
	
	let routine = $state<Routine | null>(null);
	let steps = $state<Step[]>([]);
	let loading = $state(true);
	
	// Track which steps are completed
	let completedSteps = $state<Set<string>>(new Set());
	
	onMount(async () => {
		await loadRoutine();
		loading = false;
	});
	
	async function loadRoutine() {
		if (!routineId) return;
		
		routine = await dataStore.getRoutine(routineId);
		if (routine) {
			steps = await dataStore.getStepsForRoutine(routineId);
		}
	}
	
	function getTotalDuration() {
		return steps.reduce((total, step) => total + step.durationSeconds, 0);
	}
	
	function toggleStepCompleted(stepId: string) {
		if (completedSteps.has(stepId)) {
			completedSteps.delete(stepId);
		} else {
			completedSteps.add(stepId);
		}
		completedSteps = completedSteps;
	}
</script>

<svelte:head>
	<title>{routine?.name || 'Loading...'} - Routined Life</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
			<p class="text-surface-600 dark:text-surface-300">Loading routine...</p>
		</div>
	</div>
{:else if !routine}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-4">
				Routine Not Found
			</h1>
			<a href="/" class="btn preset-filled-surface-500">
				← Back to Dashboard
			</a>
		</div>
	</div>
{:else}
	<div class="container mx-auto p-4 max-w-4xl pb-24">
		<!-- Header -->
		<header class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center space-x-4">
					<span class="text-4xl">{routine.emoji}</span>
					<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100">
						{routine.name}
					</h1>
					<a 
						href="/routines/{routine.id}/edit" 
						class="btn preset-outlined-surface-500 border-none p-2 rounded-lg"
						title="Edit routine"
					>
						<SquarePen size={20} />
					</a>
				</div>
			</div>
			
			{#if routine.notes}
				<p class="text-surface-600 dark:text-surface-300 text-lg">
					{routine.notes}
				</p>
			{/if}
			
			<div class="flex items-center space-x-6 mt-4 text-sm text-surface-500 dark:text-surface-400">
				<span>{steps.length} steps</span>
				<span>{formatTime(getTotalDuration())}</span>
			</div>
		</header>

		<!-- Steps List -->
		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-6 text-surface-900 dark:text-surface-100">
				Steps
			</h2>
			
			<div class="space-y-4">
				{#each steps as step, index (step.id)}
					{@const isCompleted = completedSteps.has(step.id)}
					<div class="card p-4 bg-surface-100 dark:bg-surface-800 transition-all {isCompleted ? 'opacity-75 bg-success-50 dark:bg-success-900/20' : ''}">
						<div class="flex items-center space-x-4">

							<span class="text-2xl">{step.emoji}</span>
							<div class="flex-1">
								<label for="step-{step.id}" class="cursor-pointer">
									<h3 class="font-semibold text-surface-900 dark:text-surface-100 {isCompleted ? 'line-through text-surface-500' : ''}">
										{step.name}
									</h3>
								</label>
								{#if step.description}
									<p class="text-sm text-surface-600 dark:text-surface-300 mt-1 {isCompleted ? 'line-through' : ''}">
										{step.description}
									</p>
								{/if}
							</div>
							<div class="text-right">
								<span class="text-lg font-medium text-surface-900 dark:text-surface-100">
									{formatTime(step.durationSeconds)}
								</span>
							</div>
                            <div class="flex items-center space-x-2 px-6">
                                <input
									type="checkbox"
									checked={isCompleted}
									onchange={() => toggleStepCompleted(step.id)}
									class="checkbox checkbox-lg"
									id="step-{step.id}"
								/>

							</div>

						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Start Button -->
		<div class="grid grid-cols-3 items-center">
			<!-- Back button in left column -->
			<div class="flex justify-end">
				<a href="/" title="Go back" class="btn preset-filled-surface-500 py-2 px-4 rounded-xl">
					<ArrowLeft />
				</a>
			</div>
			
			<!-- Start button in center column -->
			<div class="flex justify-center">
				<a 
					href="/routines/{routine.id}/run" 
					class="btn preset-filled-primary-500 text-xl py-6 px-12 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform"
				>
					<Play size={24} /> Start Routine
				</a>
			</div>
			
			<!-- Empty right column for balance -->
			<div></div>
		</div>

	</div>
{/if}

<BottomToolbar />
