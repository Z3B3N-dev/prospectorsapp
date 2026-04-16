import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabaseClient } from "./server";

export async function updateSession(request: NextRequest) {
	const supabase = await createServerSupabaseClient();
	const supabaseResponse = NextResponse.next({ request });

	// IMPORTANT: do not add code between createServerClient and getUser()
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (
		!user &&
		!request.nextUrl.pathname.startsWith("/login") &&
		!request.nextUrl.pathname.startsWith("/auth")
	) {
		// Uncomment to redirect unauthenticated users to /login:
		// const url = request.nextUrl.clone()
		// url.pathname = '/login'
		// return NextResponse.redirect(url)
	}

	return supabaseResponse;
}
