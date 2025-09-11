<script lang="ts">
	import { page } from '$app/stores';
	import { Plus, ChartColumnBig, ListChecks } from '@lucide/svelte';
	
	// Get current route to determine active state
	$: currentRoute = $page.route.id;
	$: isHome = currentRoute === '/';
	$: isStats = currentRoute === '/stats';
</script>

<!-- Fixed Bottom Toolbar -->
<div class="fixed bottom-0 left-0 right-0 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 p-4 z-50">
	<div class="container mx-auto max-w-6xl">
		<div class="flex gap-3 justify-center">
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
				class="btn preset-outlined-primary-500 text-lg py-4 px-8 rounded-xl font-semibold shadow-lg flex-1 sm:flex-initial text-center min-w-64"
			>
				<Plus class="mr-2" size={20} />
				Create New Routine
			</a>
			
			<!-- Stats Button -->
			<a 
				href="/stats" 
				class="btn {isStats ? 'preset-filled-secondary-500' : 'preset-outlined-secondary-500'} text-lg py-4 px-6 rounded-xl flex-1 sm:flex-initial text-center min-w-24"
			>
				<ChartColumnBig size={20} />
			</a>
		</div>
	</div>
</div>
