
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
		RouteId(): "/" | "/analysis" | "/exams" | "/exams/[examId]" | "/exams/[examId]/sessions" | "/jobs" | "/join-exam" | "/login" | "/proctoring" | "/proctoring/report" | "/proctoring/report/[sessionId]" | "/profile" | "/register" | "/submissions";
		RouteParams(): {
			"/exams/[examId]": { examId: string };
			"/exams/[examId]/sessions": { examId: string };
			"/proctoring/report/[sessionId]": { sessionId: string }
		};
		LayoutParams(): {
			"/": { examId?: string; sessionId?: string };
			"/analysis": Record<string, never>;
			"/exams": { examId?: string };
			"/exams/[examId]": { examId: string };
			"/exams/[examId]/sessions": { examId: string };
			"/jobs": Record<string, never>;
			"/join-exam": Record<string, never>;
			"/login": Record<string, never>;
			"/proctoring": { sessionId?: string };
			"/proctoring/report": { sessionId?: string };
			"/proctoring/report/[sessionId]": { sessionId: string };
			"/profile": Record<string, never>;
			"/register": Record<string, never>;
			"/submissions": Record<string, never>
		};
		Pathname(): "/" | "/analysis" | "/exams" | `/exams/${string}/sessions` & {} | "/jobs" | "/join-exam" | "/login" | "/proctoring" | `/proctoring/report/${string}` & {} | "/profile" | "/register" | "/submissions";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/roble_amarillo.png" | string & {};
	}
}