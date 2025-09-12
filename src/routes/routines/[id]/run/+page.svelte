<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { dataStore } from '$lib/DataStoreService';
	import { formatTime } from '$lib/Utilities';
	import { TimerStatus, SessionStatus } from '$lib/types';
	import type { Routine, Step, Session, SessionStep, TimerState } from '$lib/types';
	import { Check, Pause, Play, SkipForward, RotateCcw } from '@lucide/svelte';
	import BottomToolbar from '$lib/components/BottomToolbar.svelte';

	const routineId = page.params.id;
	
	// Get pre-completed steps from URL parameters
	let preCompletedStepIds = $state<Set<string>>(new Set());
	
	$effect(() => {
		const completedParam = page.url.searchParams.get('completed');
		if (completedParam) {
			preCompletedStepIds = new Set(completedParam.split(',').filter(id => id.trim()));
		}
	});
	
	let routine = $state<Routine | null>(null);
	let steps = $state<Step[]>([]);
	let session = $state<Session | null>(null);
	let sessionSteps = $state<SessionStep[]>([]);
	let loading = $state(true);
	
	let timerState = $state<TimerState>({
		currentStepIndex: 0,
		remainingSeconds: 0,
		status: TimerStatus.IDLE,
		startTime: undefined,
		pausedTime: undefined
	});
	
	let interval: number | null = null;
	let stepStartTime: Date | null = null;
	
	onMount(async () => {
		await loadRoutine();
		// Automatically start the session since user clicked "Start" from view page
		if (routine && steps.length > 0) {
			await startSession();
		}
		loading = false;
	});
	
	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
	
	async function loadRoutine() {
		if (!routineId) {
			goto('/');
			return;
		}
		
		routine = await dataStore.getRoutine(routineId);
		if (!routine) {
			goto('/');
			return;
		}
		
		steps = await dataStore.getStepsForRoutine(routineId);
		if (steps.length > 0) {
			timerState.remainingSeconds = steps[0].durationSeconds;
		}
	}
	
	async function startSession() {
		if (!routine || steps.length === 0) return;
		
		// Create session
		session = {
			id: dataStore.generateId(),
			routineId: routine.id,
			startTimestamp: new Date(),
			status: SessionStatus.RUNNING,
			createdAt: new Date()
		};
		
		await dataStore.saveSession(session);
		
		// Create session steps
		sessionSteps = [];
		for (const step of steps) {
			const isPreCompleted = preCompletedStepIds.has(step.id);
			const sessionStep: SessionStep = {
				id: dataStore.generateId(),
				sessionId: session.id,
				stepId: step.id,
				plannedDurationSeconds: step.durationSeconds,
				skipped: false,
				// Mark pre-completed steps as completed
				completedAt: isPreCompleted ? new Date() : undefined,
				actualDurationSeconds: isPreCompleted ? 0 : undefined
			};
			sessionSteps.push(sessionStep);
			await dataStore.saveSessionStep(sessionStep);
		}
		
		// Start with the first non-completed step
		findNextIncompleteStep();
		startStep();
	}
	
	// Find the next incomplete step and set currentStepIndex
	function findNextIncompleteStep() {
		while (timerState.currentStepIndex < steps.length) {
			const currentStep = steps[timerState.currentStepIndex];
			const sessionStep = sessionSteps.find(ss => ss.stepId === currentStep.id);
			
			// If this step is not completed, we found our next step
			if (!sessionStep?.completedAt) {
				return;
			}
			
			// This step is completed, move to next
			timerState.currentStepIndex++;
		}
	}
	
	function startStep() {
		if (timerState.currentStepIndex >= steps.length) return;
		
		const currentStep = steps[timerState.currentStepIndex];
		timerState.remainingSeconds = currentStep.durationSeconds;
		timerState.status = TimerStatus.RUNNING;
		timerState.startTime = new Date();
		stepStartTime = new Date();
		
		startTimer();
	}
	
	function startTimer() {
		if (interval) clearInterval(interval);
		
		interval = setInterval(() => {
			if (timerState.status === TimerStatus.RUNNING) {
				timerState.remainingSeconds--;
				
				if (timerState.remainingSeconds <= 0) {
					completeStep();
				}
			}
		}, 1000);
	}
	
	function pauseTimer() {
		timerState.status = TimerStatus.PAUSED;
		timerState.pausedTime = new Date();
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
	}
	
	function resumeTimer() {
		timerState.status = TimerStatus.RUNNING;
		timerState.pausedTime = undefined;
		startTimer();
	}
	
	async function completeStep() {
		if (!session || !stepStartTime) return;
		
		const endTime = new Date();
		const actualDuration = Math.floor((endTime.getTime() - stepStartTime.getTime()) / 1000);
		
		// Update session step
		const currentStep = steps[timerState.currentStepIndex];
		const sessionStep = sessionSteps.find(ss => ss.stepId === currentStep.id);
		if (sessionStep) {
			sessionStep.actualDurationSeconds = actualDuration;
			sessionStep.completedAt = endTime;
			await dataStore.saveSessionStep(sessionStep);
		}
		
		// Move to next incomplete step or complete routine
		timerState.currentStepIndex++;
		findNextIncompleteStep();
		
		if (timerState.currentStepIndex < steps.length) {
			startStep();
		} else {
			await completeSession();
		}
	}
	
	async function skipStep() {
		if (!session) return;
		
		// Mark current step as skipped
		const currentStep = steps[timerState.currentStepIndex];
		const sessionStep = sessionSteps.find(ss => ss.stepId === currentStep.id);
		if (sessionStep) {
			sessionStep.skipped = true;
			sessionStep.completedAt = new Date();
			if (stepStartTime) {
				const actualDuration = Math.floor((new Date().getTime() - stepStartTime.getTime()) / 1000);
				sessionStep.actualDurationSeconds = actualDuration;
			}
			await dataStore.saveSessionStep(sessionStep);
		}
		
		// Move to next incomplete step or complete routine
		timerState.currentStepIndex++;
		findNextIncompleteStep();
		
		if (timerState.currentStepIndex < steps.length) {
			startStep();
		} else {
			await completeSession();
		}
	}
	
	async function completeSession() {
		if (!session) return;
		
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		
		timerState.status = TimerStatus.COMPLETED;
		session.endTimestamp = new Date();
		session.status = SessionStatus.COMPLETED;
		
		// Check if any steps were actually skipped during the session (not pre-completed)
		// A step is considered skipped only if it has skipped=true AND was not pre-completed
		const actuallySkippedSteps = sessionSteps.filter(ss => 
			ss.skipped && !preCompletedStepIds.has(ss.stepId)
		);
		
		if (actuallySkippedSteps.length > 0 && actuallySkippedSteps.length < sessionSteps.length) {
			session.status = SessionStatus.PARTIAL;
		}
		
		await dataStore.saveSession(session);
	}
	
	async function abandonSession() {
		if (!session) return;
		
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		
		session.endTimestamp = new Date();
		session.status = SessionStatus.ABANDONED;
		await dataStore.saveSession(session);
		
		goto('/');
	}
	
	function getProgress(): number {
		if (steps.length === 0) return 0;
		
		// Count all completed steps (including pre-completed ones)
		const completedStepsCount = sessionSteps.filter(ss => ss.completedAt).length;
		
		// Calculate progress for current step if it's running
		let currentStepProgress = 0;
		if (timerState.status === TimerStatus.RUNNING || timerState.status === TimerStatus.PAUSED) {
			const currentStep = steps[timerState.currentStepIndex];
			if (currentStep) {
				currentStepProgress = (currentStep.durationSeconds - timerState.remainingSeconds) / currentStep.durationSeconds;
			}
		}
		
		return ((completedStepsCount + currentStepProgress) / steps.length) * 100;
	}
	
	function getTotalElapsedTime(): number {
		if (!timerState.startTime) return 0;
		const now = timerState.pausedTime || new Date();
		return Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
	}
	
	function getCurrentStep(): Step | null {
		return steps[timerState.currentStepIndex] || null;
	}
	
	function goBackToDashboard() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Run Routine - {routine?.name || 'Loading...'}</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center bg-surface-900">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
			<p class="text-surface-300">Loading routine...</p>
		</div>
	</div>
{:else if !routine}
	<div class="min-h-screen flex items-center justify-center bg-surface-900">
		<div class="text-center">
			<p class="text-surface-300 mb-4">Routine not found</p>
			<a href="/" class="btn preset-filled-secondary-500">Return to Dashboard</a>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-surface-900 text-surface-100">
		{#if timerState.status === TimerStatus.IDLE}
			<!-- Starting Screen -->
			<div class="min-h-screen flex items-center justify-center bg-surface-900">
				<div class="text-center">
					<span class="text-4xl sm:text-6xl block mb-4">{routine.emoji}</span>
					<h1 class="text-2xl sm:text-3xl font-bold mb-4">{routine.name}</h1>
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
					<p class="text-surface-300">Starting your routine...</p>
				</div>
			</div>
		{:else if timerState.status === TimerStatus.COMPLETED}
			<!-- Completion Screen -->
			<div class="container mx-auto p-6 max-w-2xl pb-24">
				<div class="text-center py-8">
					<div class="mb-8">
						<span class="text-4xl sm:text-6xl block mb-4">🎉</span>
						<h1 class="text-2xl sm:text-3xl font-bold mb-2 px-4">Routine Complete!</h1>
						<p class="text-surface-300 px-4">Great job finishing {routine.name}</p>
					</div>
					
					<div class="card p-6 bg-surface-800 mb-8">
						<h2 class="text-xl font-semibold mb-4">Session Summary</h2>
						<div class="grid grid-cols-2 gap-4 text-center">
							<div>
								<p class="text-2xl font-bold text-success-400">{sessionSteps.filter(ss => ss.completedAt && !ss.skipped).length}</p>
								<p class="text-surface-400">Steps Completed</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-warning-400">{sessionSteps.filter(ss => ss.skipped && !preCompletedStepIds.has(ss.stepId)).length}</p>
								<p class="text-surface-400">Steps Skipped</p>
							</div>
						</div>
						{#if session}
							<div class="mt-4 pt-4 border-t border-surface-700">
								<p class="text-surface-300">
									Total time: {session.endTimestamp && session.startTimestamp 
										? formatTime(Math.floor((session.endTimestamp.getTime() - session.startTimestamp.getTime()) / 1000))
										: formatTime(getTotalElapsedTime())}
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<!-- Running Screen -->
			{@const currentStep = getCurrentStep()}
			{#if currentStep}
				<div class="min-h-screen flex flex-col">
					<!-- Header -->
					<header class="p-6 bg-surface-800">
						<div class="container mx-auto max-w-4xl">
							<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div class="flex items-center space-x-3">
									<span class="text-2xl">{routine.emoji}</span>
									<span class="font-semibold text-lg">{routine.name}</span>
								</div>
								<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
									<span class="text-surface-300 text-lg">
										Step {timerState.currentStepIndex + 1} of {steps.length}
									</span>
									<button
										onclick={abandonSession}
										class="btn preset-outlined-primary-500-error py-3 px-6 text-lg rounded-xl w-full sm:w-auto"
									>
										Stop
									</button>
								</div>
							</div>
							
							<!-- Progress Bar -->
							<div class="mt-4">
								<div class="w-full bg-surface-700 rounded-full h-2">
									<div 
										class="bg-primary-500 h-2 rounded-full transition-all duration-1000"
										style="width: {getProgress()}%"
									></div>
								</div>
							</div>
						</div>
					</header>
					
					<!-- Main Content -->
					<main class="flex-1 flex items-center justify-center p-6 pb-24">
						<div class="text-center max-w-2xl w-full">
							<!-- Current Step -->
							<div class="mb-8">
								<h1 class="text-2xl sm:text-4xl font-bold mb-4 px-4">{currentStep.name}</h1>
								{#if currentStep.description}
									<p class="text-lg sm:text-xl text-surface-300 mb-6 px-4">{currentStep.description}</p>
								{/if}
							</div>
							
							<!-- Timer -->
							<div class="mb-8">
								<div class="text-4xl sm:text-6xl font-mono font-bold mb-4 px-4
									{timerState.remainingSeconds <= 10 ? 'text-error-400 animate-pulse' : 'text-primary-400'}">
									{formatTime(timerState.remainingSeconds)}
								</div>
								<p class="text-surface-400 text-lg">
									{timerState.status === TimerStatus.PAUSED ? 'Paused' : 'Remaining'}
								</p>
							</div>
							
							<!-- Checklist -->
							{#if false } <!-- Temporarily disable checklist display, currentStep.checklist.length > 0 -->
								<div class="card p-4 bg-surface-800 mb-8">
									<h3 class="font-semibold mb-3">Checklist:</h3>
									<div class="space-y-2 text-left">
										<!-- {#each currentStep.checklist as item}
											<div class="flex items-center space-x-2">
												<span class="text-surface-400">•</span>
												<span>{item}</span>
											</div>
										{/each} -->
									</div>
								</div>
							{/if}
						</div>
					</main>
					
					<!-- Footer -->
					<footer class="p-4 bg-surface-800 pb-26">
						<div class="container mx-auto max-w-4xl text-center text-surface-400">
							<p>Total time: {formatTime(getTotalElapsedTime())}</p>
						</div>
					</footer>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<!-- Show toolbar when running -->
{#if timerState.status === TimerStatus.RUNNING || timerState.status === TimerStatus.PAUSED}
	<BottomToolbar 
		mode="run" 
		isPaused={timerState.status === TimerStatus.PAUSED}
		onPause={pauseTimer}
		onResume={resumeTimer}
		onComplete={completeStep}
		onSkip={skipStep}
	/>
{:else if timerState.status === TimerStatus.COMPLETED}
	<BottomToolbar 
		mode="completed" 
		onRunAgain={startSession}
		onBackToDashboard={goBackToDashboard}
	/>
{/if}
