<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Routined Life</title>
</svelte:head>

<div class="min-h-screen bg-surface-50 dark:bg-surface-900">
	{@render children?.()}
</div>
