<script lang="ts">
	import { formatTime } from '$lib/Utilities';
	import type { EditableStep } from '$lib/types';
    import { ChevronDown, ChevronUp, Plus, SquareCheck, Trash } from '@lucide/svelte';
    import { Accordion } from '@skeletonlabs/skeleton-svelte';
	
	interface Props {
		steps: EditableStep[];
		onAddStep: () => void;
		onRemoveStep: (index: number) => void;
		onMoveStep: (index: number, direction: 'up' | 'down') => void;
		onAddChecklistItem: (stepIndex: number) => void;
		onRemoveChecklistItem: (stepIndex: number, itemIndex: number) => void;
	}
	
	let { 
		steps = $bindable(),
		onAddStep,
		onRemoveStep,
		onMoveStep,
		onAddChecklistItem,
		onRemoveChecklistItem
	}: Props = $props();

    let checklistValue = $state(['none']);

    function checkListChanged(e: any) {
        checklistValue = e.value;
    }
</script>

<!-- Steps -->
<section class="card p-6 bg-surface-100 dark:bg-surface-800">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
			Steps ({steps.length})
		</h2>
	</div>
	
	<div class="space-y-6">
		{#each steps as step, index (index)}
			<div class="border border-surface-300 dark:border-surface-600 rounded-lg p-4">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-medium text-surface-900 dark:text-surface-100">
						Step {index + 1}
					</h3>
					<div class="flex items-center space-x-3">
						<button
							onclick={() => onMoveStep(index, 'up')}
							class="btn preset-filled-surface-500 py-2 px-4 rounded-lg text-lg"
							disabled={index === 0}
						>
							<ChevronUp />
						</button>
						<button
							onclick={() => onMoveStep(index, 'down')}
							class="btn preset-filled-surface-500 py-2 px-4 rounded-lg text-lg"
							disabled={index === steps.length - 1}
						>
							<ChevronDown />
						</button>
						<button
							onclick={() => onRemoveStep(index)}
							class="btn preset-filled-error-500 py-2 px-4 rounded-lg text-lg"
							disabled={steps.length === 1}
						>
							<Trash />
						</button>
					</div>
				</div>
				
				<div class="grid gap-4">
					<div>
						<label for="step-name-{index}" class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
							Name *
						</label>
						<input
							id="step-name-{index}"
							bind:value={step.name}
							type="text"
							placeholder="e.g., 🦷 Brush teeth"
							class="input w-full"
							required
						/>
					</div>
					{#if false} <!-- Description field is currently disabled -->
					<div>
						<label for="step-description-{index}" class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
							Description (optional)
						</label>
						<input
							id="step-description-{index}"
							bind:value={step.description}
							type="text"
							placeholder="Additional details..."
							class="input w-full"
						/>
					</div>
                    {/if}
					
					<div>
						<label for="step-duration-{index}" class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
							Duration (minutes)
						</label>
						<div class="flex items-center space-x-2">
							<select
								id="step-duration-{index}"
								bind:value={step.durationMinutes}
								class="select w-32"
							>
								{#each Array.from({length: 61}, (_, i) => i) as minute}
									<option value={minute}>{minute} min</option>
								{/each}
							</select>
							<span class="text-sm text-surface-500 dark:text-surface-400 ml-4">
								({formatTime(step.durationMinutes * 60)})
							</span>
						</div>
					</div>

                    <Accordion value={checklistValue} onValueChange={checkListChanged} collapsible>
                        <Accordion.Item value="step-checklist-{index + 1}">
                            {#snippet control()}Checklist (optional){/snippet}
                            {#snippet panel()}
                            <div class="space-y-2">
							{#each step.checklist as item, itemIndex}
								<div class="flex items-center space-x-2">
									<span class="text-surface-600 dark:text-surface-300">
                                        <SquareCheck color="#7926cb" />
                                    </span>
									<span class="flex-1 text-surface-900 dark:text-surface-100">{item}</span>
									<button
										onclick={() => onRemoveChecklistItem(index, itemIndex)}
										class="btn preset-filled-surface-500 btn-sm"
									>
										<Trash />
									</button>
								</div>
							{/each}
							<div class="flex items-center space-x-2">
								<input
									id="step-checklist-{index}"
									bind:value={step.tempChecklistItem}
									onkeydown={(e) => e.key === 'Enter' && onAddChecklistItem(index)}
									type="text"
									placeholder="Add checklist item..."
									class="input flex-1"
								/>
								<button
									onclick={() => onAddChecklistItem(index)}
									class="btn preset-filled-secondary-500 btn-sm"
								>
									Add
								</button>
							</div>
						</div>
                            {/snippet}

                        </Accordion.Item>
                    </Accordion>
				</div>
			</div>
		{/each}
	</div>
    <div class="flex justify-center mt-6">

        <button onclick={onAddStep} class="btn preset-filled-secondary-500 py-3 px-6 rounded-xl text-lg">
			<Plus /> Add Step
		</button>
    </div>
</section>
