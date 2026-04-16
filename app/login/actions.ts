"use server";

import { redirect } from "next/navigation";
import { signInFakeUser, signOutFakeUser } from "@/lib/fake-auth";

export async function loginAction(formData: FormData) {
	const username = String(formData.get("username") ?? "");
	const password = String(formData.get("password") ?? "");

	const result = await signInFakeUser(username, password);
	if (!result.ok) {
		redirect(`/login?error=${encodeURIComponent(result.message)}`);
	}

	redirect("/contacts");
}

export async function logoutAction() {
	await signOutFakeUser();
	redirect("/login");
}
