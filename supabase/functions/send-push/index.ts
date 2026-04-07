import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── helpers ──────────────────────────────────────────────────────────
function base64urlToUint8Array(b64: string): Uint8Array {
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const raw = atob(base64 + "=".repeat(pad));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

// ── VAPID JWT ────────────────────────────────────────────────────────
async function importVapidPrivateKey(publicKeyB64: string, privateKeyB64: string) {
  const pub = base64urlToUint8Array(publicKeyB64);
  const priv = base64urlToUint8Array(privateKeyB64);
  const x = uint8ArrayToBase64url(pub.slice(1, 33));
  const y = uint8ArrayToBase64url(pub.slice(33, 65));
  const d = uint8ArrayToBase64url(priv);
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

function derToRaw(sig: Uint8Array): Uint8Array {
  if (sig.length === 64) return sig;
  const rLen = sig[3];
  let r = sig.slice(4, 4 + rLen);
  const sLen = sig[4 + rLen + 1];
  let s = sig.slice(4 + rLen + 2, 4 + rLen + 2 + sLen);
  if (r.length > 32) r = r.slice(r.length - 32);
  if (s.length > 32) s = s.slice(s.length - 32);
  if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p; }
  if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p; }
  const raw = new Uint8Array(64);
  raw.set(r, 0);
  raw.set(s, 32);
  return raw;
}

async function createVapidJwt(endpoint: string, privateKey: CryptoKey, subject: string) {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify({ aud, exp, sub: subject })));
  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, data));
  return `${headerB64}.${payloadB64}.${uint8ArrayToBase64url(derToRaw(sig))}`;
}

// ── RFC 8291 Web Push Encryption (aes128gcm) ────────────────────────
async function encryptPayload(
  plaintext: Uint8Array,
  p256dhB64: string,
  authB64: string,
): Promise<{ ciphertext: Uint8Array; localPublicKey: Uint8Array; salt: Uint8Array }> {
  const uaPublicRaw = base64urlToUint8Array(p256dhB64);
  const authSecret = base64urlToUint8Array(authB64);

  // Import subscriber's public key
  const uaPublicKey = await crypto.subtle.importKey(
    "raw", uaPublicRaw, { name: "ECDH", namedCurve: "P-256" }, false, [],
  );

  // Generate ephemeral key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"],
  );
  const localPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: uaPublicKey },
      localKeyPair.privateKey,
      256,
    ),
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  // HKDF helper
  async function hkdf(ikm: Uint8Array, saltBytes: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, saltBytes));
    // This is actually HKDF-Extract then Expand — note: salt/ikm swapped for extract
    const prkKey = await crypto.subtle.importKey("raw", saltBytes.length ? saltBytes : new Uint8Array(32), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const prkVal = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, ikm));
    const infoKey = await crypto.subtle.importKey("raw", prkVal, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expanded = new Uint8Array(await crypto.subtle.sign("HMAC", infoKey, concat(info, new Uint8Array([1]))));
    return expanded.slice(0, length);
  }

  // IKM for auth secret
  const keyInfoAuth = concat(
    enc.encode("WebPush: info\0"),
    uaPublicRaw,
    localPublicRaw,
  );
  const ikm = await hkdf(sharedSecret, authSecret, keyInfoAuth, 32);

  // Derive CEK and nonce
  const cekInfo = concat(enc.encode("Content-Encoding: aes128gcm\0"));
  const nonceInfo = concat(enc.encode("Content-Encoding: nonce\0"));
  const cek = await hkdf(ikm, salt, cekInfo, 16);
  const nonce = await hkdf(ikm, salt, nonceInfo, 12);

  // Pad plaintext: add delimiter 0x02 then zero-pad
  const paddedPlaintext = concat(plaintext, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPlaintext),
  );

  // Build aes128gcm payload: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = new DataView(new ArrayBuffer(4));
  rs.setUint32(0, 4096);
  const header = concat(
    salt,
    new Uint8Array(rs.buffer),
    new Uint8Array([65]),
    localPublicRaw,
  );

  return {
    ciphertext: concat(header, encrypted),
    localPublicKey: localPublicRaw,
    salt,
  };
}

// ── Main handler ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { title, body, url } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body required" }), { status: 400, headers: corsHeaders });
    }

    const { data: subs, error: subsErr } = await supabaseAdmin.from("push_subscriptions").select("*");
    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const VAPID_PUBLIC = "BP_kEeP6ldU7YAibbFDcTj1pqz_WqQct5HT3Jfb5gU5NsXMcoA5R6ptHzlxHn3jS1-Z4ImTkALVm2OKfJfjOSYE";
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = "mailto:contato@formandolideres.org";

    const privateKey = await importVapidPrivateKey(VAPID_PUBLIC, VAPID_PRIVATE);

    const payloadJSON = JSON.stringify({
      title,
      body,
      url: url || "/home",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });

    const encoder = new TextEncoder();
    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subs) {
      try {
        const jwt = await createVapidJwt(sub.endpoint, privateKey, VAPID_SUBJECT);

        // Encrypt payload per RFC 8291
        const { ciphertext } = await encryptPayload(
          encoder.encode(payloadJSON),
          sub.p256dh,
          sub.auth,
        );

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            TTL: "86400",
            Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
          },
          body: ciphertext,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 410 || response.status === 404) {
          expiredEndpoints.push(sub.endpoint);
          failed++;
        } else {
          const txt = await response.text();
          console.error(`Push failed for ${sub.endpoint}: ${response.status} ${txt}`);
          failed++;
        }
      } catch (e) {
        console.error(`Push error for ${sub.endpoint}:`, e);
        failed++;
      }
    }

    if (expiredEndpoints.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ sent, failed, cleaned: expiredEndpoints.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
