import "server-only";
import { cookies } from "next/headers";
import { AuthForm } from "./auth-form";
import { codespacesFormOrigin, formOriginCookie } from "@/modules/auth/form-origin";
import type { ComponentProps } from "react";

export async function ProtectedAuthForm(props: Omit<ComponentProps<typeof AuthForm>, "formOriginNonce">) {
  let nonce: string | undefined;
  let valid = true;
  try {
    if (codespacesFormOrigin()) {
      nonce = (await cookies()).get(formOriginCookie)?.value;
      valid = Boolean(nonce && /^[a-f0-9]{64}$/.test(nonce));
    }
  } catch { valid = false; }
  return <AuthForm {...props} disabled={props.disabled || !valid} formOriginNonce={nonce} />;
}
