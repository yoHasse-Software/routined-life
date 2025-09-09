<script lang="ts">
	import { goto } from '$app/navigation';
	import { dataStore } from '$lib/DataStoreService';
	import { ROUTINE_COLORS } from '$lib/types';
	import { formatTime } from '$lib/Utilities.js';
	import type { Routine, Step } from '$lib/types';
	
	let routine = $state({
		name: '',
		emoji: '⭐',
		color: ROUTINE_COLORS[0] as string,
		notes: ''
	});
	
	let steps = $state<Array<{
		name: string;
		emoji: string;
		description: string;
		durationMinutes: number;
		durationSeconds: number;
		checklist: string[];
		tempChecklistItem: string;
	}>>([{
		name: '',
		emoji: '📝',
		description: '',
		durationMinutes: 5,
		durationSeconds: 0,
		checklist: [],
		tempChecklistItem: ''
	}]);
	
	let saving = $state(false);
	
	function addStep() {
		steps.push({
			name: '',
			emoji: '📝',
			description: '',
			durationMinutes: 5,
			durationSeconds: 0,
			checklist: [],
			tempChecklistItem: ''
		});
	}
	
	function removeStep(index: number) {
		if (steps.length > 1) {
			steps.splice(index, 1);
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
		} else if (direction === 'down' && index < steps.length - 1) {
			[steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
		}
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
				createdAt: new Date(),
				updatedAt: new Date()
			};
			
			await dataStore.saveRoutine(newRoutine);
			
			// Save steps
			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				const newStep: Step = {
					id: dataStore.generateId(),
					routineId,
					name: step.name.trim(),
					emoji: step.emoji,
					description: step.description.trim(),
					durationSeconds: (step.durationMinutes * 60) + step.durationSeconds,
					checklist: step.checklist,
					order: i
				};
				
				await dataStore.saveStep(newStep);
			}
			
			goto('/');
		} catch (error) {
			console.error('Failed to save routine:', error);
			alert('Failed to save routine. Please try again.');
		} finally {
			saving = false;
		}
	}
	
	function getTotalDuration() {
		return steps.reduce((total, step) => {
			return total + (step.durationMinutes * 60) + step.durationSeconds;
		}, 0);
	}
</script>

<svelte:head>
	<title>Create New Routine - Routined Life</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
	<!-- Header -->
	<header class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
					Create New Routine
				</h1>
				<p class="text-surface-600 dark:text-surface-300">
					Build a custom routine that works for you
				</p>
			</div>
			<a href="/" class="btn variant-outline">
				← Back to Dashboard
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
						<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
							Name *
						</label>
						<input
							bind:value={routine.name}
							type="text"
							placeholder="e.g., Morning Routine"
							class="input w-full"
							required
						/>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
								Emoji
							</label>
							<input
								bind:value={routine.emoji}
								type="text"
								placeholder="⭐"
								class="input w-full text-center text-2xl"
								maxlength="2"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
								Color
							</label>
							<div class="flex flex-wrap gap-2">
								{#each ROUTINE_COLORS as color}
									<button
										type="button"
										onclick={() => routine.color = color}
										class="w-8 h-8 rounded-full border-2 transition-all
											{routine.color === color ? 'border-surface-900 dark:border-surface-100 scale-110' : 'border-surface-300 dark:border-surface-600'}"
										style="background-color: {color}"
									></button>
								{/each}
							</div>
						</div>
					</div>
					
					<div>
						<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
							Notes (optional)
						</label>
						<textarea
							bind:value={routine.notes}
							placeholder="Additional notes about this routine..."
							class="textarea w-full"
							rows="3"
						></textarea>
					</div>
				</div>
			</section>

			<!-- Steps -->
			<section class="card p-6 bg-surface-100 dark:bg-surface-800">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
						Steps ({steps.length})
					</h2>
					<button onclick={addStep} class="btn variant-outline btn-sm">
						+ Add Step
					</button>
				</div>
				
				<div class="space-y-6">
					{#each steps as step, index (index)}
						<div class="border border-surface-300 dark:border-surface-600 rounded-lg p-4">
							<div class="flex items-center justify-between mb-4">
								<h3 class="font-medium text-surface-900 dark:text-surface-100">
									Step {index + 1}
								</h3>
								<div class="flex items-center space-x-2">
									<button
										onclick={() => moveStep(index, 'up')}
										class="btn variant-outline btn-sm"
										disabled={index === 0}
									>
										↑
									</button>
									<button
										onclick={() => moveStep(index, 'down')}
										class="btn variant-outline btn-sm"
										disabled={index === steps.length - 1}
									>
										↓
									</button>
									<button
										onclick={() => removeStep(index)}
										class="btn variant-outline-error btn-sm"
										disabled={steps.length === 1}
									>
										🗑️
									</button>
								</div>
							</div>
							
							<div class="grid gap-4">
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div class="md:col-span-2">
										<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
											Name *
										</label>
										<input
											bind:value={step.name}
											type="text"
											placeholder="e.g., Brush teeth"
											class="input w-full"
											required
										/>
									</div>
									
									<div>
										<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
											Emoji
										</label>
										<input
											bind:value={step.emoji}
											type="text"
											placeholder="📝"
											class="input w-full text-center"
											maxlength="2"
										/>
									</div>
								</div>
								
								<div>
									<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
										Description (optional)
									</label>
									<input
										bind:value={step.description}
										type="text"
										placeholder="Additional details..."
										class="input w-full"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
										Duration
									</label>
									<div class="flex items-center space-x-2">
										<input
											bind:value={step.durationMinutes}
											type="number"
											min="0"
											max="60"
											class="input w-20"
										/>
										<span class="text-surface-600 dark:text-surface-300">min</span>
										<input
											bind:value={step.durationSeconds}
											type="number"
											min="0"
											max="59"
											class="input w-20"
										/>
										<span class="text-surface-600 dark:text-surface-300">sec</span>
										<span class="text-sm text-surface-500 dark:text-surface-400 ml-4">
											({formatTime((step.durationMinutes * 60) + step.durationSeconds)})
										</span>
									</div>
								</div>
								
								<div>
									<label class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
										Checklist (optional)
									</label>
									<div class="space-y-2">
										{#each step.checklist as item, itemIndex}
											<div class="flex items-center space-x-2">
												<span class="text-surface-600 dark:text-surface-300">•</span>
												<span class="flex-1 text-surface-900 dark:text-surface-100">{item}</span>
												<button
													onclick={() => removeChecklistItem(index, itemIndex)}
													class="btn variant-outline-error btn-sm"
												>
													×
												</button>
											</div>
										{/each}
										<div class="flex items-center space-x-2">
											<input
												bind:value={step.tempChecklistItem}
												onkeydown={(e) => e.key === 'Enter' && addChecklistItem(index)}
												type="text"
												placeholder="Add checklist item..."
												class="input flex-1"
											/>
											<button
												onclick={() => addChecklistItem(index)}
												class="btn variant-outline btn-sm"
											>
												Add
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
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
										<span>{step.emoji}</span>
										<span class="flex-1 text-surface-900 dark:text-surface-100">
											{step.name || 'Untitled Step'}
										</span>
										<span class="text-surface-600 dark:text-surface-300">
											{formatTime((step.durationMinutes * 60) + step.durationSeconds)}
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
				
				<div class="mt-6 space-y-3">
					<button
						onclick={saveRoutine}
						class="btn variant-filled-primary btn-lg w-full"
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save Routine'}
					</button>
					<a
						href="/"
						class="btn variant-outline btn-lg w-full"
					>
						Cancel
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
