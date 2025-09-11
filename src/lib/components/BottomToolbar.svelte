<script lang="ts">
	import { page } from '$app/state';
	import { Plus, ChartColumnBig, ListChecks, X, Save, Trash2, ArrowLeft, Play, Pause, Check, SkipForward, RotateCcw, Home, House } from '@lucide/svelte';
	
	interface Props {
		mode?: 'default' | 'create' | 'edit' | 'view' | 'run' | 'completed';
		onSave?: () => void;
		onCancel?: () => void;
		onDelete?: () => void;
		onStart?: () => void;
		onPause?: () => void;
		onResume?: () => void;
		onComplete?: () => void;
		onSkip?: () => void;
		onRunAgain?: () => void;
		onBackToDashboard?: () => void;
		saving?: boolean;
		isPaused?: boolean;
	}
	
	let { mode = 'default', onSave, onCancel, onDelete, onStart, onPause, onResume, onComplete, onSkip, onRunAgain, onBackToDashboard, saving = false, isPaused = false }: Props = $props();
	
	// Get current route to determine active state (only for default mode)
	let currentRoute = $state(page.route.id);
	let isHome = currentRoute === '/';
	let isStats = currentRoute === '/stats';
	let isNewRoutine = currentRoute === '/routines/new';
</script>

<!-- Fixed Bottom Toolbar -->
<div class="fixed bottom-0 left-0 right-0 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 p-4 z-50">
	<div class="container mx-auto max-w-6xl">
		<div class="flex gap-3 justify-center">
			{#if mode === 'default'}
				<!-- Default Navigation Buttons -->
				<!-- Routines/Dashboard Button -->
				<a 
					href="/" 
					class="btn {isHome ? 'preset-filled-primary-500' : 'preset-outlined-primary-500'} text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
				>
					<ListChecks size={20} />
				</a>
				
				<!-- Create New Routine Button -->
				<a 
					href="/routines/new" 
					class="btn {isNewRoutine ? 'preset-filled-primary-500' : 'preset-outlined-primary-500'} text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
				>
                <Plus size={20} />
            </a>
				
				<!-- Stats Button -->
				<a 
					href="/stats" 
					class="btn {isStats ? 'preset-filled-secondary-500' : 'preset-outlined-secondary-500'} text-lg py-4 px-6 rounded-xl flex-1 sm:flex-initial text-center min-w-24"
				>
					<ChartColumnBig size={20} />
				</a>
			{:else if mode === 'create'}
				<!-- Create Mode Buttons -->
				<!-- Cancel Button -->
				<button 
					onclick={onCancel}
					class="btn preset-outlined-surface-500 text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
				>
					<X size={20} />
				</button>
				
				<!-- Save Button -->
				<button 
					onclick={onSave}
					class="btn preset-filled-primary-500 text-lg py-4 px-8 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-64"
					disabled={saving}
				>
					<Save class="mr-2" size={20} />
					{saving ? 'Saving...' : 'Save Routine'}
				</button>
				
				<!-- Empty space for balance -->
				<div class="flex-1 sm:flex-initial min-w-24"></div>
			{:else if mode === 'edit'}
				<!-- Edit Mode Buttons -->
				<!-- Cancel Button -->
				<button 
					onclick={onCancel}
					class="btn preset-outlined-surface-500 text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
				>
					<X size={20} />
				</button>
				
				<!-- Save Button -->
				<button 
					onclick={onSave}
					class="btn preset-filled-primary-500 text-lg py-4 px-8 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-64"
					disabled={saving}
				>
					<Save class="mr-2" size={20} />
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
				
				<!-- Delete Button -->
				<button 
					onclick={onDelete}
					class="btn preset-outlined-error-500 text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
				>
					<Trash2 size={20} />
				</button>
			{:else if mode === 'view'}
				<!-- View Mode Buttons -->
				<!-- Back Button -->
				<button 
					onclick={onCancel}
					class="btn preset-outlined-surface-500 text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
				>
					<ArrowLeft size={20} />
				</button>
				
				<!-- Start Routine Button -->
				<button 
					onclick={onStart}
					class="btn preset-filled-primary-500 text-lg py-4 px-8 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-64"
				>
					<Play class="mr-2" size={20} />
					
				</button>
				
				<!-- Empty space for balance -->
				<div class="flex-1 sm:flex-initial min-w-24"></div>
			{:else if mode === 'run'}
				<!-- Run Mode Buttons -->
				<!-- Pause/Resume Button -->
				{#if isPaused}
					<button 
						onclick={onResume}
						class="btn preset-filled-secondary-500 text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
						title="Resume"
					>
						<Play size={20} />
					</button>
				{:else}
					<button 
						onclick={onPause}
						class="btn preset-outlined-secondary-500 text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
						title="Pause"
					>
						<Pause size={20} />
					</button>
				{/if}
				
				<!-- Complete Step Button -->
				<button 
					onclick={onComplete}
					class="btn preset-filled-primary-500 text-lg py-4 px-8 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-64"
				>
					<Check class="mr-2" size={20} />
				</button>
				
				<!-- Skip Button -->
				<button 
					onclick={onSkip}
					class="btn preset-outlined-secondary-500 text-lg py-4 px-6 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-24"
					title="Skip"
				>
					<SkipForward size={20} />
				</button>
			{:else if mode === 'completed'}
				<!-- Completed Mode Buttons -->
				<!-- Run Again Button -->
				<button 
					onclick={onRunAgain}
					class="btn preset-filled-primary-500 text-lg py-4 px-8 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-40"
				>
					<RotateCcw class="mr-2" size={20} />
				</button>
				
				<!-- Back to Dashboard Button -->
				<button 
					onclick={onBackToDashboard}
					class="btn preset-filled-surface-500 text-lg py-4 px-8 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-40"
				>
					<House class="mr-2" size={20} />
				</button>
			{/if}
		</div>
	</div>
</div>
