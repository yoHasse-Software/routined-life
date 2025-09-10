<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { dataStore } from '$lib/DataStoreService';
	import { formatTime } from '$lib/Utilities';
	import { TimerStatus, SessionStatus } from '$lib/types';
	import type { Routine, Step, Session, SessionStep, TimerState } from '$lib/types';
	import { Check, Pause, Play, SkipForward, RotateCcw } from '@lucide/svelte';

	const routineId = $page.params.id;
	
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
			const sessionStep: SessionStep = {
				id: dataStore.generateId(),
				sessionId: session.id,
				stepId: step.id,
				plannedDurationSeconds: step.durationSeconds,
				skipped: false
			};
			sessionSteps.push(sessionStep);
			await dataStore.saveSessionStep(sessionStep);
		}
		
		startStep();
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
		const sessionStep = sessionSteps[timerState.currentStepIndex];
		sessionStep.actualDurationSeconds = actualDuration;
		sessionStep.completedAt = endTime;
		await dataStore.saveSessionStep(sessionStep);
		
		// Move to next step or complete routine
		if (timerState.currentStepIndex < steps.length - 1) {
			timerState.currentStepIndex++;
			startStep();
		} else {
			await completeSession();
		}
	}
	
	async function skipStep() {
		if (!session) return;
		
		// Mark current step as skipped
		const sessionStep = sessionSteps[timerState.currentStepIndex];
		sessionStep.skipped = true;
		sessionStep.completedAt = new Date();
		if (stepStartTime) {
			const actualDuration = Math.floor((new Date().getTime() - stepStartTime.getTime()) / 1000);
			sessionStep.actualDurationSeconds = actualDuration;
		}
		await dataStore.saveSessionStep(sessionStep);
		
		// Move to next step or complete routine
		if (timerState.currentStepIndex < steps.length - 1) {
			timerState.currentStepIndex++;
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
		
		// Check if any steps were skipped to determine if partial
		const skippedSteps = sessionSteps.filter(ss => ss.skipped);
		if (skippedSteps.length > 0 && skippedSteps.length < sessionSteps.length) {
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
		const completedSteps = timerState.currentStepIndex;
		const currentStepProgress = timerState.status === TimerStatus.COMPLETED ? 1 : 
			(steps[timerState.currentStepIndex]?.durationSeconds - timerState.remainingSeconds) / 
			(steps[timerState.currentStepIndex]?.durationSeconds || 1);
		return ((completedSteps + currentStepProgress) / steps.length) * 100;
	}
	
	function getTotalElapsedTime(): number {
		if (!timerState.startTime) return 0;
		const now = timerState.pausedTime || new Date();
		return Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
	}
	
	function getCurrentStep(): Step | null {
		return steps[timerState.currentStepIndex] || null;
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
			<!-- Pre-start Screen -->
			<div class="container mx-auto p-6 max-w-2xl">
				<div class="text-center py-8">
					<div class="mb-8">
						<span class="text-4xl sm:text-6xl block mb-4">{routine.emoji}</span>
						<h1 class="text-2xl sm:text-3xl font-bold mb-2 px-4">{routine.name}</h1>
						{#if routine.notes}
							<p class="text-surface-300 px-4">{routine.notes}</p>
						{/if}
					</div>
					
					<div class="card p-6 bg-surface-800 mb-8">
						<h2 class="text-xl font-semibold mb-4">Routine Overview</h2>
						<div class="space-y-3">
							{#each steps as step, index}
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<span class="text-surface-400">{index + 1}.</span>
										<span class="text-lg">{step.emoji}</span>
										<span class="text-left flex-1">{step.name}</span>
									</div>
									<span class="text-surface-400 ml-2">{formatTime(step.durationSeconds)}</span>
								</div>
							{/each}
						</div>
						<div class="mt-4 pt-4 border-t border-surface-700">
							<div class="flex justify-between font-semibold">
								<span>Total Duration:</span>
								<span>{formatTime(steps.reduce((total, step) => total + step.durationSeconds, 0))}</span>
							</div>
						</div>
					</div>
					
					<div class="space-y-6">
						<button
							onclick={startSession}
							class="btn preset-filled-primary-500 w-full text-xl py-6 px-8 rounded-xl font-semibold shadow-lg"
						>
							🚀 Start Routine
						</button>
						<a
							href="/"
							class="btn preset-outlined-primary-500 w-full text-lg py-4 px-6 rounded-xl"
						>
							← Back to Dashboard
						</a>
					</div>
				</div>
			</div>
		{:else if timerState.status === TimerStatus.COMPLETED}
			<!-- Completion Screen -->
			<div class="container mx-auto p-6 max-w-2xl">
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
								<p class="text-2xl font-bold text-success-400">{sessionSteps.filter(ss => !ss.skipped).length}</p>
								<p class="text-surface-400">Steps Completed</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-warning-400">{sessionSteps.filter(ss => ss.skipped).length}</p>
								<p class="text-surface-400">Steps Skipped</p>
							</div>
						</div>
						{#if session}
							<div class="mt-4 pt-4 border-t border-surface-700">
								<p class="text-surface-300">
									Total time: {formatTime(getTotalElapsedTime())}
								</p>
							</div>
						{/if}
					</div>
					
					<div class="space-y-6">
						<button
							onclick={startSession}
							class="btn preset-filled-primary-500 w-full text-xl py-6 px-8 rounded-xl font-semibold"
						>
							<RotateCcw /> Run Again
						</button>
						<a
							href="/"
							class="btn preset-outlined-primary-500 w-full text-lg py-4 px-6 rounded-xl"
						>
							← Back to Dashboard
						</a>
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
					<main class="flex-1 flex items-center justify-center p-6">
						<div class="text-center max-w-2xl w-full">
							<!-- Current Step -->
							<div class="mb-8">
								<span class="text-6xl sm:text-8xl block mb-6">{currentStep.emoji}</span>
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
							{#if currentStep.checklist.length > 0}
								<div class="card p-4 bg-surface-800 mb-8">
									<h3 class="font-semibold mb-3">Checklist:</h3>
									<div class="space-y-2 text-left">
										{#each currentStep.checklist as item}
											<div class="flex items-center space-x-2">
												<span class="text-surface-400">•</span>
												<span>{item}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
							
							<!-- Controls -->
							<div class="flex items-center justify-center gap-4 px-4 max-w-md mx-auto">
								<!-- Pause/Resume Button - Left Side -->
								{#if timerState.status === TimerStatus.RUNNING}
									<button
										onclick={pauseTimer}
										class="btn preset-outlined-secondary-500 text-3xl py-4 px-4 rounded-xl font-semibold min-h-[4rem] min-w-[4rem] shadow-lg flex items-center justify-center"
										title="Pause"
									>
										<Pause />
									</button>
								{:else if timerState.status === TimerStatus.PAUSED}
									<button
										onclick={resumeTimer}
										class="btn preset-filled-secondary-500 text-3xl py-4 px-4 rounded-xl font-semibold min-h-[4rem] min-w-[4rem] shadow-lg flex items-center justify-center"
										title="Resume"
									>
										<Play />
									</button>
								{/if}
								
								<!-- Done Button - Center (Takes most space) -->
								<button
									onclick={completeStep}
									class="btn preset-filled-primary-500 text-xl py-6 px-8 rounded-xl font-semibold min-h-[4rem] shadow-lg flex-1 max-w-xs"
								>
									<Check />
								</button>
								
								<!-- Skip Button - Right Side -->
								<button
									onclick={skipStep}
									class="btn preset-outlined-secondary-500 text-3xl py-4 px-4 rounded-xl font-semibold min-h-[4rem] min-w-[4rem] flex items-center justify-center"
									title="Skip"
								>
									<SkipForward />
								</button>
							</div>
						</div>
					</main>
					
					<!-- Footer -->
					<footer class="p-4 bg-surface-800">
						<div class="container mx-auto max-w-4xl text-center text-surface-400">
							<p>Total time: {formatTime(getTotalElapsedTime())}</p>
						</div>
					</footer>
				</div>
			{/if}
		{/if}
	</div>
{/if}
