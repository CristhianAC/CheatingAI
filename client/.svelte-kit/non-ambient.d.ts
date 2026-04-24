
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
		RouteId(): "/" | "/analysis" | "/exams" | "/jobs" | "/join-exam" | "/login" | "/proctoring" | "/proctoring/report" | "/proctoring/report/[sessionId]" | "/register" | "/submissions";
		RouteParams(): {
			"/proctoring/report/[sessionId]": { sessionId: string }
		};
		LayoutParams(): {
			"/": { sessionId?: string };
			"/analysis": Record<string, never>;
			"/exams": Record<string, never>;
			"/jobs": Record<string, never>;
			"/join-exam": Record<string, never>;
			"/login": Record<string, never>;
			"/proctoring": { sessionId?: string };
			"/proctoring/report": { sessionId?: string };
			"/proctoring/report/[sessionId]": { sessionId: string };
			"/register": Record<string, never>;
			"/submissions": Record<string, never>
		};
		Pathname(): "/" | "/analysis" | "/exams" | "/jobs" | "/join-exam" | "/login" | "/proctoring" | `/proctoring/report/${string}` & {} | "/register" | "/submissions";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/roble_amarillo.png" | string & {};
	}
}