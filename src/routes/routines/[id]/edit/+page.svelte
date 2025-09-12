<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { dataStore } from '$lib/DataStoreService';
	import { ROUTINE_COLORS, ALL_DAYS } from '$lib/types';
	import { formatTime } from '$lib/Utilities.js';
	import type { Routine, Step, EditableStep } from '$lib/types';
	import StepsEditor from '$lib/components/StepsEditor.svelte';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';
	import DayScheduler from '$lib/components/DayScheduler.svelte';
	import { Trash } from '@lucide/svelte';

	const routineId = page.params.id;
	
	let routine = $state({
		name: '',
		emoji: '⭐',
		color: ROUTINE_COLORS[0] as string,
		notes: '',
		availableDays: [...ALL_DAYS] // Default to all days
	});

	let steps = $state<EditableStep[]>([]);
	
	let loading = $state(true);
	let saving = $state(false);
	let originalRoutine = $state<Routine | null>(null);
	let originalSteps = $state<Step[]>([]);
	
	onMount(async () => {
		await loadRoutine();
		loading = false;
	});
	
	async function loadRoutine() {
		if (!routineId) {
			goto('/');
			return;
		}
		
		originalRoutine = await dataStore.getRoutine(routineId);
		if (!originalRoutine) {
			goto('/');
			return;
		}
		
		// Load routine data
		routine.name = originalRoutine.name;
		routine.emoji = originalRoutine.emoji;
		routine.color = originalRoutine.color;
		routine.notes = originalRoutine.notes || '';
		routine.availableDays = originalRoutine.availableDays || [...ALL_DAYS];
		
		// Load steps
		originalSteps = await dataStore.getStepsForRoutine(routineId);
		steps = originalSteps.map(step => ({
			id: step.id,
			name: step.name,
			description: step.description || '',
			durationMinutes: Math.floor(step.durationSeconds / 60),
			checklist: [...step.checklist],
			tempChecklistItem: '',
			availableDays: step.availableDays || [...ALL_DAYS], // Default to all days
			order: step.order
		}));
		
		// Ensure at least one step
		if (steps.length === 0) {
			addStep();
		}
	}
	
	function addStep() {
		steps.push({
			name: '',
			description: '',
			durationMinutes: 5,
			checklist: [],
			tempChecklistItem: '',
			availableDays: [...ALL_DAYS], // Default to all days
			order: steps.length
		});
	}
	
	function removeStep(index: number) {
		if (steps.length > 1) {
			steps.splice(index, 1);
			// Update order
			steps.forEach((step, idx) => {
				step.order = idx;
			});
		}
	}
	
	function addChecklistItem(stepIndex: number) {
		const step = steps[stepIndex];
		if (step.tempChecklistItem.trim()) {
			step.checklist.push(step.tempChecklistItem.trim());
			step.tempChecklistItem = '';
		}
	}
	
	function removeChecklistItem(stepIndex: number, itemIndex: number) {
		steps[stepIndex].checklist.splice(itemIndex, 1);
	}
	
	function moveStep(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index > 0) {
			[steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
			// Update order
			steps[index].order = index;
			steps[index - 1].order = index - 1;
		} else if (direction === 'down' && index < steps.length - 1) {
			[steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
			// Update order
			steps[index].order = index;
			steps[index + 1].order = index + 1;
		}
	}
	
	async function updateRoutine() {
		if (!routine.name.trim()) {
			alert('Please enter a routine name');
			return;
		}
		
		if (steps.some(s => !s.name.trim())) {
			alert('Please enter names for all steps');
			return;
		}
		
		saving = true;
		
		try {
			if (!originalRoutine) return;
			
			// Update routine
			const updatedRoutine: Routine = {
				...originalRoutine,
				name: routine.name.trim(),
				emoji: routine.emoji,
				color: routine.color,
				notes: routine.notes.trim(),
				availableDays: routine.availableDays,
				updatedAt: new Date()
			};
			
			await dataStore.saveRoutine(updatedRoutine);
			
			// Delete removed steps
			for (const originalStep of originalSteps) {
				const stillExists = steps.find(s => s.id === originalStep.id);
				if (!stillExists) {
					await dataStore.deleteStep(originalStep.id);
				}
			}
			
			// Save/update steps
			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				const stepData: Step = {
					id: step.id || dataStore.generateId(),
					routineId: routineId!,
					name: step.name.trim(),
					description: step.description.trim(),
					durationSeconds: step.durationMinutes * 60,
					checklist: step.checklist,
					availableDays: step.availableDays,
					order: i
				};
				
				await dataStore.saveStep(stepData);
			}
			
			goto('/');
		} catch (error) {
			console.error('Failed to update routine:', error);
			alert('Failed to update routine. Please try again.');
		} finally {
			saving = false;
		}
	}
	
	async function deleteRoutine() {
		if (!originalRoutine) return;
		
		if (confirm(`Are you sure you want to delete "${originalRoutine.name}"? This action cannot be undone.`)) {
			saving = true;
			
			try {
				await dataStore.deleteRoutine(originalRoutine.id);
				goto('/');
			} catch (error) {
				console.error('Failed to delete routine:', error);
				alert('Failed to delete routine. Please try again.');
				saving = false;
			}
		}
	}
	
	function getTotalDuration() {
		return steps.reduce((total, step) => {
			return total + (step.durationMinutes * 60);
		}, 0);
	}

	$effect(() => {
		// Ensure at least one step
		routine.availableDays;
	});
</script>

<svelte:head>
	<title>Edit Routine - {originalRoutine?.name || 'Loading...'}</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center bg-surface-900">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
			<p class="text-surface-300">Loading routine...</p>
		</div>
	</div>
{:else if !originalRoutine}
	<div class="min-h-screen flex items-center justify-center bg-surface-900">
		<div class="text-center">
			<p class="text-surface-300 mb-4">Routine not found</p>
			<a href="/" class="btn preset-filled-secondary-500">Return to Dashboard</a>
		</div>
	</div>
{:else}
	<div class="container mx-auto p-4 max-w-4xl pb-24">
		<!-- Header -->
		<header class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
						Edit Routine
					</h1>
					<p class="text-surface-600 dark:text-surface-300">
						Update your routine to better fit your needs
					</p>
				</div>

			</div>
		</header>

		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Main Form -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Routine Details -->
				<section class="p-6 bg-surface-100 dark:bg-surface-800">
					<h2 class="text-xl font-semibold mb-4 text-surface-900 dark:text-surface-100">
						Routine Details
					</h2>
					
					<div class="space-y-4">
						<div>
							<label for="routine-name" class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
								Name *
							</label>
							<input
								id="routine-name"
								bind:value={routine.name}
								type="text"
								placeholder="e.g., Morning Routine"
								class="input w-full"
								required
							/>
						</div>
						
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="routine-emoji" class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
									Emoji
								</label>
								<input
									id="routine-emoji"
									bind:value={routine.emoji}
									type="text"
									placeholder="⭐"
									class="input w-full text-center text-2xl"
									maxlength="2"
								/>
							</div>
							
							<div>
								<div class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
									Color
								</div>
								<div class="flex flex-wrap gap-2" role="group" aria-label="Select routine color">
									{#each ROUTINE_COLORS as color}
										<button
											type="button"
											onclick={() => routine.color = color}
											class="w-8 h-8 rounded-full border-2 transition-all
												{routine.color === color ? 'border-surface-900 dark:border-surface-100 scale-110' : 'border-surface-300 dark:border-surface-600'}"
											style="background-color: {color}"
											aria-label="Select color {color}"
										></button>
									{/each}
								</div>
							</div>
						</div>
						
						<!-- Day Scheduling -->
						<div>
							<DayScheduler 
								bind:selectedDays={routine.availableDays} 
								label="When should this routine be available?"
								showPresets={true}
							/>
						</div>
						
                        {#if false} <!-- Notes are currently not editable -->
						<div>
							<label for="routine-notes" class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
								Notes (optional)
							</label>
							<textarea
								id="routine-notes"
								bind:value={routine.notes}
								placeholder="Additional notes about this routine..."
								class="textarea w-full"
								rows="3"
							></textarea>
						</div>
                        {/if}
					</div>
				</section>

				<!-- Steps -->
				<StepsEditor 
					bind:steps={steps}
					routineAvailableDays={routine.availableDays}
					onAddStep={addStep}
					onRemoveStep={removeStep}
					onMoveStep={moveStep}
					onAddChecklistItem={addChecklistItem}
					onRemoveChecklistItem={removeChecklistItem}
				/>
			</div>

			<!-- Preview Sidebar -->
			<div class="lg:col-span-1">
				<div class="sticky top-4">
					<div class="card p-6 bg-surface-100 dark:bg-surface-800">
						<h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-100">
							Preview
						</h3>
						
						<div class="space-y-4">
							<div 
								class="p-4 rounded-lg border-l-4"
								style="border-left-color: {routine.color}; background-color: {routine.color}20"
							>
								<div class="flex items-center space-x-2 mb-2">
									<span class="text-xl">{routine.emoji}</span>
									<h4 class="font-semibold text-surface-900 dark:text-surface-100">
										{routine.name || 'Untitled Routine'}
									</h4>
								</div>
								{#if routine.notes}
									<p class="text-sm text-surface-600 dark:text-surface-300">
										{routine.notes}
									</p>
								{/if}
							</div>
							
							<div>
								<h5 class="font-medium mb-2 text-surface-900 dark:text-surface-100">
									Steps ({steps.length})
								</h5>
								<div class="space-y-2">
									{#each steps as step, index}
										<div class="flex items-center space-x-2 text-sm">
											<span class="text-surface-500 dark:text-surface-400">{index + 1}.</span>
											<span class="flex-1 text-surface-900 dark:text-surface-100">
												{step.name || 'Untitled Step'}
											</span>
											<span class="text-surface-600 dark:text-surface-300">
												{formatTime((step.durationMinutes * 60))}
											</span>
										</div>
									{/each}
								</div>
							</div>
							
							<div class="pt-4 border-t border-surface-300 dark:border-surface-600">
								<div class="flex justify-between text-sm">
									<span class="text-surface-600 dark:text-surface-300">Total Duration:</span>
									<span class="font-medium text-surface-900 dark:text-surface-100">
										{formatTime(getTotalDuration())}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<BottomToolbar 
	mode="edit" 
	{saving}
	onSave={updateRoutine}
	onCancel={() => goto(`/routines/${routineId}`)}
	onDelete={deleteRoutine}
/>
