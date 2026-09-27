import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Ro'yxatdan o'tish" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
