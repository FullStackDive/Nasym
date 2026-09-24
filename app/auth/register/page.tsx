import AuthClient from "@/components/auth-client";

export default function Page() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return <AuthClient mode="register" googleEnabled={googleEnabled} />;
}
