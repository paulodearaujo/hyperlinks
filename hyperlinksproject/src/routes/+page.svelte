<script context="module">
  export const prerender = true;
</script>

<script lang="ts">
import data from '$lib/data/localization.json';
import '$styles/global.css';
import type { Link, Opportunity } from './types';


// Helper function for URL normalization
function normalizeUrl(url: string): string {
	let normalized = new URL(url);
	normalized.hostname = normalized.hostname.replace('www.', '');
	normalized.protocol = 'https:';
	normalized.pathname = normalized.pathname.replace(/\/$/, ''); // Remove trailing slash
	return normalized.toString();
}

// Error handling and URL validation
function validateUrl(input: string): void {
	if (!/^https?:\/\/\S+$/.test(input)) {
		throw new Error(`Invalid URL: ${input}`);
	}
}

let targetUrl: string = '';
let existingLinks: Link[] = [];
let anchorPotentials: string = '';
let hyperlinkOpportunities: Opportunity[] = [];
let errorMessage: string = '';  // For UI feedback

// Clears results and error messages
function clearResults(): void {
	existingLinks = [];
	hyperlinkOpportunities = [];
	errorMessage = '';
}

// Identify hyperlinks that match the target URL
function identifyExistingHyperlinks(): void {
	try {
		validateUrl(targetUrl);
		const normalizedTargetUrl = normalizeUrl(targetUrl); // Now used below

		existingLinks = data['1 - All'].flatMap(row => {
			const parser = new DOMParser();
			const doc = parser.parseFromString(row['Content 1'], 'text/html');
			const links = Array.from(doc.querySelectorAll('a[href]')) as HTMLAnchorElement[];
			return links.filter(link => normalizeUrl(link.href) === normalizedTargetUrl)
				.map(link => ({
					urlFrom: row.Address,
					anchor: link.textContent || '',
					completeUrl: link.href  // Store complete URL
				}));
		});
		if (!existingLinks.length) errorMessage = 'No links found matching the URL.';
	} catch (error) {
		console.error(error);
		errorMessage = error.message;
	}
}

// Discover opportunities based on potential anchors
function discoverHyperlinkOpportunities(): void {
	try {
		validateUrl(targetUrl);
		const normalizedTargetUrl = normalizeUrl(targetUrl); // Now used to avoid declaring without reading
		const anchors = anchorPotentials.split(',').map(a => a.trim().toLowerCase());
		const usedUrls = new Set<string>();

		hyperlinkOpportunities = data['1 - All'].reduce<Opportunity[]>
		((acc, row) => {
			if (usedUrls.has(normalizeUrl(row.Address))) return acc;
			const parser = new DOMParser();
			const doc = parser.parseFromString(row['Content 1'], 'text/html');
			doc.querySelectorAll('a, h1, h2, h3').forEach(el => el.remove()); // Removing headings and links for cleaner text analysis
			const text = doc.body.textContent || '';

			anchors.forEach(anchor => {
				const regex = new RegExp(`\\b${anchor}\\b`, 'gi');
				if (regex.test(text.toLowerCase())) {
					const match = regex.exec(text.toLowerCase());
					if (match) {
						const contextStart = Math.max(0, match.index - 30);
						const contextEnd = Math.min(text.length, match.index + 30);
						acc.push({
							urlFrom: row.Address,
							anchorContext: text.substring(contextStart, contextEnd).replace(/\n/g, ' ').trim(),
							completeUrl: row.Address // Assuming the full URL is in the Address field
						});
						usedUrls.add(normalizeUrl(row.Address));
					}
				}
			});
			return acc;
		}, []);

		if (!hyperlinkOpportunities.length) errorMessage = 'No hyperlink opportunities found.';
	} catch (error) {
		console.error(error);
		errorMessage = error.message;
	}
}
</script>


<main class="p-4">
  <header>
    <h1 class="text-2xl font-bold text-center mb-4">InfinitePay Blog Hyperlink Analyzer Tool</h1>
  </header>
  <section class="mb-8">
    <h2 class="text-xl font-semibold">Identify Existing Hyperlinks</h2>
    <div class="flex gap-2 my-2">
      <input bind:value={targetUrl} class="flex-1 p-2 border border-gray-300 rounded" placeholder="Enter target URL" type="text">
      <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" on:click={identifyExistingHyperlinks}>Identify Hyperlinks</button>
      <button class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" on:click={clearResults}>Clear Results</button>
    </div>
		{#if errorMessage}
      <p class="text-red-500">{errorMessage}</p>
    {/if}
		{#if existingLinks.length > 0}
    <table class="w-full text-left border-collapse">
      <tr class="bg-gray-100">
        <th class="p-2 border-b">From URL</th>
        <th class="p-2 border-b">Anchor</th>
      </tr>
			{#each existingLinks as link}
      <tr>
        <td class="p-2 border-b"><a href={link.urlFrom} target="_blank" class="text-blue-500 hover:text-blue-600">{link.urlFrom}</a></td>
        <td class="p-2 border-b">{link.anchor}</td>
      </tr>
      {/each}
    </table>
    {/if}
  </section>
  <section>
    <h2 class="text-xl font-semibold">Discover Hyperlink Opportunities</h2>
    <div class="flex flex-col gap-2 my-2">
        <input bind:value={targetUrl} class="p-2 border border-gray-300 rounded" placeholder="Enter target URL for opportunities" type="text">
        <textarea bind:value={anchorPotentials} class="p-2 border border-gray-300 rounded" placeholder="Enter potential anchors, separated by commas" rows="3"></textarea>
        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" on:click={discoverHyperlinkOpportunities}>Discover Opportunities</button>
        <button class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" on:click={clearResults}>Clear Results</button>
    </div>
		{#if errorMessage}
      <p class="text-red-500">{errorMessage}</p>
    {/if}
		{#if hyperlinkOpportunities.length > 0}
    <table class="w-full text-left border-collapse">
      <tr class="bg-gray-100">
        <th class="p-2 border-b">From URL</th>
        <th class="p-2 border-b">Context</th>
      </tr>
			{#each hyperlinkOpportunities as opportunity}
      <tr>
        <td class="p-2 border-b"><a href={opportunity.urlFrom} target="_blank" class="text-blue-500 hover:text-blue-600">{opportunity.urlFrom}</a></td>
        <td class="p-2 border-b">{opportunity.anchorContext}</td>
      </tr>
      {/each}
    </table>
    {/if}
  </section>
</main>