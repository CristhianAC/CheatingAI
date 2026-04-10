
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/analysis" | "/jobs" | "/proctoring" | "/proctoring/report" | "/proctoring/report/[sessionId]" | "/submissions";
		RouteParams(): {
			"/proctoring/report/[sessionId]": { sessionId: string }
		};
		LayoutParams(): {
			"/": { sessionId?: string };
			"/analysis": Record<string, never>;
			"/jobs": Record<string, never>;
			"/proctoring": { sessionId?: string };
			"/proctoring/report": { sessionId?: string };
			"/proctoring/report/[sessionId]": { sessionId: string };
			"/submissions": Record<string, never>
		};
		Pathname(): "/" | "/analysis" | "/jobs" | "/proctoring" | `/proctoring/report/${string}` & {} | "/submissions";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/roble_amarillo.png" | string & {};
	}
}