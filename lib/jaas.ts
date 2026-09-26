import { createPrivateKey } from "node:crypto";
import { SignJWT } from "jose";

type JaaSUser = {
  id: string;
  name: string | null;
  email?: string | null;
};

export type JaaSMeetingConfig = {
  provider: "jaas";
  domain: "8x8.vc";
  roomName: string;
  jwt: string;
};

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

export function isJaaSConfigured() {
  return Boolean(
    process.env.JAAS_APP_ID &&
      process.env.JAAS_KID &&
      process.env.JAAS_PRIVATE_KEY
  );
}

export async function createJaaSMeetingConfig(args: {
  roomName: string;
  user: JaaSUser;
  isModerator: boolean;
}): Promise<JaaSMeetingConfig | null> {
  const appId = process.env.JAAS_APP_ID?.trim();
  const kid = process.env.JAAS_KID?.trim();
  const privateKeyPem = process.env.JAAS_PRIVATE_KEY;

  if (!appId || !kid || !privateKeyPem) return null;

  const now = Math.floor(Date.now() / 1000);
  const privateKey = createPrivateKey(normalizePrivateKey(privateKeyPem));

  const jwt = await new SignJWT({
    room: args.roomName,
    context: {
      room: { regex: false },
      user: {
        id: args.user.id,
        name: args.user.name ?? "Student",
        email: args.user.email ?? "",
        moderator: args.isModerator,
      },
      features: {
        livestreaming: false,
        "outbound-call": false,
        transcription: false,
        recording: false,
      },
    },
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setAudience("jitsi")
    .setIssuer("chat")
    .setSubject(appId)
    .setNotBefore(now - 10)
    .setExpirationTime(now + 2 * 60 * 60)
    .sign(privateKey);

  return {
    provider: "jaas",
    domain: "8x8.vc",
    roomName: `${appId}/${args.roomName}`,
    jwt,
  };
}
