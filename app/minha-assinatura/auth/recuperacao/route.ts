import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL("/minha-assinatura/entrar?erro=recuperacao", origin)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/minha-assinatura/entrar?erro=recuperacao", origin)
    );
  }

  return NextResponse.redirect(
    new URL("/minha-assinatura/redefinir-senha", origin)
  );
}