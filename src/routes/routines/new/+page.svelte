<script lang="ts">
	import { goto } from '$app/navigation';
	import { dataStore } from '$lib/DataStoreService.js';
	import { ROUTINE_TEMPLATES } from '$lib/RoutineTemplates';
	import type { Routine } from '$lib/types';
	import { Plus, Sparkles } from '@lucide/svelte';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';

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
		
		// Navigate to the routine view page
		goto(`/routines/${routineId}/edit`);
	}
</script>

<svelte:head>
	<title>Create New Routine - Routined Life</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl pb-24">
	<!-- Header -->
	<header class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
					Create New Routine
				</h1>
				<p class="text-surface-600 dark:text-surface-300">
					Choose how you'd like to create your routine
				</p>
			</div>
		</div>
	</header>

	<div class="grid gap-8">
		<!-- Create Custom Option -->
		<section>
			<a 
				href="/routines/new/custom"
				class="card p-8 bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 hover:from-primary-200 hover:to-primary-300 dark:hover:from-primary-800/40 dark:hover:to-primary-700/40 transition-all cursor-pointer block border-2 border-primary-300 dark:border-primary-600 hover:border-primary-400 dark:hover:border-primary-500 hover:scale-[1.02] transform"
			>
				<div class="flex items-center justify-center mb-4">
					<div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
						<Plus size={32} class="text-white" />
					</div>
				</div>
				<div class="text-center">
					<h2 class="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-2">
						Create Custom Routine
					</h2>
					<p class="text-surface-600 dark:text-surface-300">
						Build a routine from scratch with your own steps and timing
					</p>
				</div>
			</a>
		</section>

		<!-- Templates Section -->
		<section>
			<h2 class="text-2xl font-semibold mb-6 text-surface-900 dark:text-surface-100 flex items-center">
				<Sparkles class="mr-2" />
				Or choose from a template
			</h2>
			
			<div class="grid md:grid-cols-2 gap-4">
				{#each ROUTINE_TEMPLATES as template}
					<button 
						onclick={() => createFromTemplate(template)}
						class="card p-6 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all cursor-pointer text-left hover:scale-[1.02] transform border-2 border-transparent hover:border-surface-300 dark:hover:border-surface-600"
					>
						<div class="flex items-center space-x-4 mb-4">
							<span class="text-3xl">{template.emoji}</span>
							<div>
								<h3 class="font-semibold text-surface-900 dark:text-surface-100 text-xl">
									{template.name}
								</h3>
								<p class="text-sm text-surface-600 dark:text-surface-300">
									{template.steps.length} steps
								</p>
							</div>
						</div>
						
						<div class="space-y-2">
							<h4 class="font-medium text-surface-700 dark:text-surface-300 text-sm">Steps include:</h4>
							<ul class="text-sm text-surface-600 dark:text-surface-400 space-y-1">
								{#each template.steps.slice(0, 3) as step}
									<li class="flex items-center">
										<span class="mr-2">{step.emoji}</span>
										{step.name}
									</li>
								{/each}
								{#if template.steps.length > 3}
									<li class="text-surface-500 dark:text-surface-500">
										...and {template.steps.length - 3} more
									</li>
								{/if}
							</ul>
						</div>
					</button>
				{/each}
			</div>
		</section>
	</div>
</div>

<BottomToolbar />
