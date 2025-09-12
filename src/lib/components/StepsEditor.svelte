<script lang="ts">
	import { formatTime } from '$lib/Utilities';
	import { ALL_DAYS } from '$lib/types';
	import type { EditableStep } from '$lib/types';
    import { ChevronDown, ChevronUp, Plus, SquareCheck, Trash } from '@lucide/svelte';
    import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import DayScheduler from './DayScheduler.svelte';
	import { onMount } from 'svelte';
    import { on } from 'svelte/events';
	
	interface Props {
		steps: EditableStep[];
		onAddStep: () => void;
		onRemoveStep: (index: number) => void;
		onMoveStep: (index: number, direction: 'up' | 'down') => void;
		onAddChecklistItem: (stepIndex: number) => void;
		onRemoveChecklistItem: (stepIndex: number, itemIndex: number) => void;
		routineAvailableDays?: number[]; // Available days from the parent routine
	}
	
	let { 
		steps = $bindable(),
		onAddStep,
		onRemoveStep,
		onMoveStep,
		onAddChecklistItem,
		onRemoveChecklistItem,
		routineAvailableDays = ALL_DAYS
	}: Props = $props();

    let checklistValue = $state(['none']);
	
	// References to carousel elements for each step
	let carouselRefs: (HTMLElement | undefined)[] = $state([]);

    function checkListChanged(e: any) {
        checklistValue = e.value;
    }
	
	// Initialize carousel positions when component mounts or steps change
	onMount(() => {
		// Small delay to ensure DOM is fully rendered
		setTimeout(() => {
			steps.forEach((step, index) => {
				const carousel = carouselRefs[index];
				if (carousel && step.durationMinutes) {
					scrollToSelectedMinute(carousel, step.durationMinutes);
				}
			});
		}, 100);

	});
	
	// Update carousel positions when steps change
	$effect(() => {
		steps.forEach((step, index) => {
			const carousel = carouselRefs[index];
			if (carousel && step.durationMinutes) {
				// Use requestAnimationFrame to ensure DOM updates are complete
				requestAnimationFrame(() => {
					scrollToSelectedMinute(carousel, step.durationMinutes);
				});
			}
		});
	});
	
	
	// Handle mouse drag scrolling
	let isDragging = $state(false);
	let startX = $state(0);
	let scrollLeft = $state(0);
	let currentContainer: HTMLElement | null = $state(null);
	let currentStepIndex = $state(0);
	
	function handleMouseDown(event: MouseEvent, stepIndex: number) {
		const container = event.currentTarget as HTMLElement;
		isDragging = true;
		startX = event.pageX - container.offsetLeft;
		scrollLeft = container.scrollLeft;
		currentContainer = container;
		currentStepIndex = stepIndex;
		container.style.cursor = 'grabbing';
		
		// Add global event listeners
		document.addEventListener('mousemove', handleGlobalMouseMove);
		document.addEventListener('mouseup', handleGlobalMouseUp);
		
		event.preventDefault();
	}
	
	function handleGlobalMouseMove(event: MouseEvent) {
		if (!isDragging || !currentContainer) return;
		event.preventDefault();
		
		const x = event.pageX - currentContainer.offsetLeft;
		const walk = (x - startX) * 2; // Scroll speed multiplier
		currentContainer.scrollLeft = scrollLeft - walk;
	}
	
	function handleGlobalMouseUp(event: MouseEvent) {
		if (!isDragging || !currentContainer) return;
		
		isDragging = false;
		currentContainer.style.cursor = 'grab';
		
		// Update selection immediately after drag ends
		updateSelectedMinute(currentContainer, currentStepIndex);
		
		// Remove global event listeners
		document.removeEventListener('mousemove', handleGlobalMouseMove);
		document.removeEventListener('mouseup', handleGlobalMouseUp);
		
		currentContainer = null;
	}
	
	function handleMouseLeave(event: MouseEvent) {
		// Don't stop dragging on mouse leave - let global handlers take over
		const container = event.currentTarget as HTMLElement;
		if (!isDragging) {
			container.style.cursor = 'grab';
		}
	}
	
	// Calculate which minute is currently centered and auto-select it
	function updateSelectedMinute(container: HTMLElement, stepIndex: number) {
		const containerWidth = container.offsetWidth;
		const scrollLeft = container.scrollLeft;
		const centerPosition = scrollLeft + containerWidth / 2;
		
		// Each button is 48px wide (w-12 = 3rem = 48px)
		const buttonWidth = 48;
		const paddingWidth = 152; // Padding on left to center first item
		
		// Calculate which button is in the center
		// The buttons represent minutes 1, 2, 3, ... 60 (we skip 0)
		// So buttonIndex 0 = minute 1, buttonIndex 1 = minute 2, etc.
		const buttonIndex = Math.round((centerPosition - paddingWidth) / buttonWidth);
		const selectedMinute = Math.max(1, Math.min(60, buttonIndex));
		
		// Force update the step's duration
		steps[stepIndex].durationMinutes = selectedMinute;
	}
	
	// Scroll carousel to show the currently selected minute
	function scrollToSelectedMinute(container: HTMLElement, minute: number) {
		const buttonWidth = 48; // w-12 = 3rem = 48px
		const paddingWidth = 152; // Padding on left to center first item
		const containerWidth = container.offsetWidth;
		
		// Calculate the position where this minute should be centered
		// minute 1 is at buttonIndex 0, minute 2 is at buttonIndex 1, etc.
		const buttonIndex = minute - 1;
		const buttonCenter = paddingWidth + (buttonIndex * buttonWidth) + (buttonWidth / 2);
		const scrollPosition = buttonCenter - (containerWidth / 2);
		
		container.scrollLeft = Math.max(0, scrollPosition);
	}


</script>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;  /* IE and Edge */
		scrollbar-width: none;  /* Firefox */
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;  /* Chrome, Safari and Opera */
	}
</style>

<!-- Steps -->
<section class="p-6 bg-surface-100 dark:bg-surface-800">
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
						<span class="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
							Duration (minutes)
						</span>
						<div class="flex flex-col items-center justify-center">
							<!-- Fixed-width container to prevent overflow -->
							<div class="relative w-80 max-w-full h-16 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-300 dark:border-surface-600 overflow-hidden">
								<!-- Selection indicator (fixed center line) -->
								<div class="absolute top-0 bottom-0 left-1/2 w-12 bg-primary-500/10 border-x-2 border-primary-500/30 pointer-events-none z-10 transform -translate-x-1/2"></div>
								
								<!-- Horizontal scrollable wheel -->
								<div 
									bind:this={carouselRefs[index]}
									class="h-full overflow-x-auto scrollbar-hide flex items-center"
									style="scroll-snap-type: x mandatory; touch-action: pan-x; cursor: grab; user-select: none; scroll-behavior: smooth;"
									role="slider"
									tabindex="0"
									aria-label="Select duration in minutes"
									aria-valuenow={step.durationMinutes}
									aria-valuemin="1"
									aria-valuemax="60"

									onmousedown={(e) => handleMouseDown(e, index)}
									onmouseleave={handleMouseLeave}
								>
									<!-- Padding left to center first item -->
									<div style="min-width: 152px; flex-shrink: 0;"></div>
									
									{#each Array.from({length: 61}, (_, i) => i) as minute}
                                    {#if minute !== 0}
										<button
											type="button"
											onclick={() => step.durationMinutes = minute}
                                            
											class="flex-shrink-0 w-12 h-full flex items-center justify-center text-lg font-medium cursor-pointer hover:bg-primary-500/5
												{step.durationMinutes === minute 
													? 'text-primary-600 dark:text-primary-400 font-bold' 
													: 'text-surface-600 dark:text-surface-400'}"
											style="scroll-snap-align: center; cursor: inherit;"
										>
											{minute}
										</button>
                                    {/if}
									{/each}
									
									<!-- Padding right to center last item -->
									<div style="min-width: 152px; flex-shrink: 0;"></div>
								</div>
								
								<!-- Fade gradients at left and right -->
								<div class="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-surface-50 dark:from-surface-800 to-transparent pointer-events-none"></div>
								<div class="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-surface-50 dark:from-surface-800 to-transparent pointer-events-none"></div>
							</div>
							
							<div class="mt-3 text-center">
								<div class="text-sm text-surface-500 dark:text-surface-400">
									{step.durationMinutes} minutes
								</div>
							</div>
						</div>
					</div>
					
					<!-- Day Scheduling for Step -->
					<div>
						{#if !step.availableDays}
							{step.availableDays = [...routineAvailableDays]}
						{/if}
						<DayScheduler 
							bind:selectedDays={step.availableDays} 
							availableDays={routineAvailableDays}
							label="When should this step be active?"
							showPresets={true}
						/>
					</div>
					
                    {#if false}
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
                    {/if}
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
