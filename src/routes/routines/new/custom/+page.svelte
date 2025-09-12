<script lang="ts">
	import { goto } from '$app/navigation';
	import { dataStore } from '$lib/DataStoreService';
	import { ROUTINE_COLORS, ALL_DAYS } from '$lib/types';
	import { formatTime } from '$lib/Utilities.js';
	import type { Routine, Step, EditableStep } from '$lib/types';
	import StepsEditor from '$lib/components/StepsEditor.svelte';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';
	import DayScheduler from '$lib/components/DayScheduler.svelte';
	
	let routine = $state({
		name: '',
		emoji: '⭐',
		color: ROUTINE_COLORS[0] as string,
		notes: '',
		availableDays: [...ALL_DAYS] // Default to all days
	});
	
	let steps = $state<EditableStep[]>([{
		name: '',
		description: '',
		durationMinutes: 5,
		checklist: [],
		tempChecklistItem: '',
		availableDays: [...ALL_DAYS], // Default to all days
		order: 0
	}]);
	
	let saving = $state(false);
	
	function addStep() {
		const newOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order)) + 1 : 0;
		steps.push({
			name: '',
			description: '',
			durationMinutes: 5,
			checklist: [],
			tempChecklistItem: '',
			availableDays: [...ALL_DAYS], // Default to all days
			order: newOrder
		});
	}
	
	function removeStep(index: number) {
		if (steps.length > 1) {
			steps.splice(index, 1);
		}
	}
	
	function moveStep(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index > 0) {
			[steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
		} else if (direction === 'down' && index < steps.length - 1) {
			[steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
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
	
	async function saveRoutine() {
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
			const routineId = dataStore.generateId();
			const newRoutine: Routine = {
				id: routineId,
				name: routine.name.trim(),
				emoji: routine.emoji,
				color: routine.color,
				notes: routine.notes.trim(),
				availableDays: routine.availableDays,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			
			await dataStore.saveRoutine(newRoutine);
			
			// Save steps
			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				const stepData: Step = {
					id: dataStore.generateId(),
					routineId,
					name: step.name.trim(),
					description: step.description.trim(),
					durationSeconds: step.durationMinutes * 60,
					checklist: step.checklist,
					availableDays: step.availableDays,
					order: i
				};
				
				await dataStore.saveStep(stepData);
			}
			
			goto(`/routines/${routineId}`);
		} catch (error) {
			console.error('Failed to save routine:', error);
			alert('Failed to save routine. Please try again.');
		} finally {
			saving = false;
		}
	}
	
	function getTotalDuration() {
		return steps.reduce((total, step) => {
			return total + (step.durationMinutes * 60);
		}, 0);
	}
</script>

<svelte:head>
	<title>Create Custom Routine - Routined Life</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl pb-24">
	<!-- Header -->
	<header class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
					Create Custom Routine
				</h1>
				<p class="text-surface-600 dark:text-surface-300">
					Build a custom routine that works for you
				</p>
			</div>
			<a href="/routines/new" class="btn preset-outlined-primary-500 py-3 px-6 rounded-xl text-lg">
				← Back to Options
			</a>
		</div>
	</header>

	<div class="grid lg:grid-cols-3 gap-8">
		<!-- Main Form -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Routine Details -->
			<section class="card p-6 bg-surface-100 dark:bg-surface-800">
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
							<fieldset>
								<legend class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
									Color
								</legend>
								<div class="flex flex-wrap gap-2">
									{#each ROUTINE_COLORS as color}
										<button
											type="button"
											aria-label="Select color {color}"
											onclick={() => routine.color = color}
											class="w-8 h-8 rounded-full border-2 transition-all
												{routine.color === color ? 'border-surface-900 dark:border-surface-100 scale-110' : 'border-surface-300 dark:border-surface-600'}"
											style="background-color: {color}"
										></button>
									{/each}
								</div>
							</fieldset>
						</div>
					</div>
					
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
					
					<!-- Day Scheduling -->
					<div>
						<DayScheduler 
							bind:selectedDays={routine.availableDays} 
							label="When should this routine be available?"
							showPresets={true}
						/>
					</div>
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
											{formatTime(step.durationMinutes * 60)}
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

<BottomToolbar 
	mode="create" 
	{saving}
	onSave={saveRoutine}
	onCancel={() => goto('/routines/new')}
/>
