module.exports = {
	ci: {
		collect: {
			startServerCommand: "pnpm preview",
			startServerReadyPattern: "Local:",
			startServerReadyTimeout: 20000,
			url: [
				"http://localhost:4173/",
				"http://localhost:4173/calculator",
			],
			numberOfRuns: 3,
			settings: {
				preset: "desktop",
				throttling: {
					rttMs: 40,
					throughputKbps: 10240,
					cpuSlowdownMultiplier: 1,
				},
			},
		},
		assert: {
			preset: "lighthouse:recommended",
			assertions: {
				"categories:performance": ["error", { minScore: 0.9 }],
				"categories:accessibility": ["error", { minScore: 0.95 }],
				"categories:best-practices": ["error", { minScore: 0.9 }],
				"categories:seo": ["error", { minScore: 0.9 }],
				// Performance budgets
				"first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
				"largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
				"cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
				"total-blocking-time": ["warn", { maxNumericValue: 300 }],
				"speed-index": ["warn", { maxNumericValue: 3000 }],
				// Accessibility
				"color-contrast": "error",
				"html-has-lang": "error",
				"meta-viewport": "error",
				// Best practices
				"uses-https": "error",
				"no-vulnerable-libraries": "error",
				// PWA
				"viewport": "error",
				// SEO
				"document-title": "error",
				"meta-description": "warn",
			},
		},
		upload: {
			target: "temporary-public-storage",
		},
	},
};
