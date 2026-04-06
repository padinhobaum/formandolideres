import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push utilities using Web Crypto API
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const raw = atob(base64 + "=".repeat(pad));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const publicKeyRaw = base64urlToUint8Array(publicKeyB64);
  const privateKeyRaw = base64urlToUint8Array(privateKeyB64);

  // Build JWK from raw keys
  const x = uint8ArrayToBase64url(publicKeyRaw.slice(1, 33));
  const y = uint8ArrayToBase64url(publicKeyRaw.slice(33, 65));
  const d = uint8ArrayToBase64url(privateKeyRaw);

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  return privateKey;
}

async function createVapidJwt(endpoint: string, privateKey: CryptoKey, subject: string) {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud, exp, sub: subject };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(payload)));

  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, data);

  // Convert DER to raw r||s
  const sigArray = new Uint8Array(sig);
  let r: Uint8Array, s: Uint8Array;
  if (sigArray.length === 64) {
    r = sigArray.slice(0, 32);
    s = sigArray.slice(32, 64);
  } else {
    // DER encoded
    const rLen = sigArray[3];
    const rStart = 4;
    r = sigArray.slice(rStart, rStart + rLen);
    const sLen = sigArray[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sigArray.slice(sStart, sStart + sLen);
    // Pad/trim to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p; }
    if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p; }
  }
  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${headerB64}.${payloadB64}.${uint8ArrayToBase64url(rawSig)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate caller is admin
    const authHeader = req.headers.get("Authorization");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      // Check admin role
      const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
      }
    } else {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    }

    const { title, body, url } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body required" }), { status: 400, headers: corsHeaders });
    }

    // Get all subscriptions
    const { data: subs, error: subsErr } = await supabaseAdmin.from("push_subscriptions").select("*");
    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const VAPID_PUBLIC = "BP_kEeP6ldU7YAibbFDcTj1pqz_WqQct5HT3Jfb5gU5NsXMcoA5R6ptHzlxHn3jS1-Z4ImTkALVm2OKfJfjOSYE";
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = "mailto:contato@formandolideres.org";

    const privateKey = await importVapidKeys(VAPID_PUBLIC, VAPID_PRIVATE);

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/home",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subs) {
      try {
        const jwt = await createVapidJwt(sub.endpoint, privateKey, VAPID_SUBJECT);

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "identity",
            TTL: "86400",
            Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
          },
          body: payload,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 410 || response.status === 404) {
          expiredEndpoints.push(sub.endpoint);
          failed++;
        } else {
          console.error(`Push failed for ${sub.endpoint}: ${response.status}`);
          failed++;
        }
      } catch (e) {
        console.error(`Push error for ${sub.endpoint}:`, e);
        failed++;
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ sent, failed, cleaned: expiredEndpoints.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
