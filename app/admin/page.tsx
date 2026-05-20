import { Suspense } from "react";
import AdminClient from "@/components/admin-client";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminClient />
    </Suspense>
  );
}
