// Netlify Function : envoie un SMS à tous les participants via Twilio.
// Protégée : vérifie que l'appelant est bien connecté en tant qu'admin
// (via le token de session Supabase) avant d'envoyer quoi que ce soit.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY_FOR_AUTH_CHECK = "sb_publishable_Xu3d9A1CP1xtftiUzHCLxg_NnAJ5pWI";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ADMIN_EMAIL = "draforamagloria@gmail.com";

// Normalise un numéro vers le format international requis par Twilio (+1XXXXXXXXXX)
function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (raw && raw.startsWith("+")) return raw;
  return null; // format non reconnu, on l'ignore plutôt que de planter l'envoi
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Corps de requête invalide." }) };
  }

  const { message, accessToken, mediaUrls } = body;
  if (!message || !accessToken) {
    return { statusCode: 400, body: JSON.stringify({ error: "Message ou jeton manquant." }) };
  }
  const cleanMediaUrls = (Array.isArray(mediaUrls) ? mediaUrls : [])
    .map(u => (u || "").trim())
    .filter(u => u.length > 0)
    .slice(0, 10); // Twilio accepte jusqu'à 10 pièces jointes par message

  // 1. Vérifier que l'appelant est bien l'admin connecté
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY_FOR_AUTH_CHECK
    }
  });
  if (!verifyRes.ok) {
    return { statusCode: 401, body: JSON.stringify({ error: "Session invalide." }) };
  }
  const user = await verifyRes.json();
  if (user.email !== ADMIN_EMAIL) {
    return { statusCode: 403, body: JSON.stringify({ error: "Accès refusé." }) };
  }

  // 2. Récupérer tous les participants (via la clé service_role, qui contourne les RLS)
  const partRes = await fetch(`${SUPABASE_URL}/rest/v1/participants?select=nom,telephone`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  if (!partRes.ok) {
    return { statusCode: 500, body: JSON.stringify({ error: "Impossible de charger les participants." }) };
  }
  const participants = await partRes.json();

  // 3. Envoyer un SMS à chacun via l'API Twilio
  const results = [];
  for (const p of participants) {
    const to = normalizePhone(p.telephone);
    if (!to) {
      results.push({ nom: p.nom, ok: false, reason: "numéro invalide" });
      continue;
    }
    const firstName = (p.nom || "").split(" ")[0];
    const personalized = message.replace(/\{nom\}/g, firstName);

    try {
      const params = new URLSearchParams({ To: to, From: TWILIO_PHONE_NUMBER, Body: personalized });
      cleanMediaUrls.forEach(url => params.append("MediaUrl", url));

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: params
        }
      );
      results.push({ nom: p.nom, ok: twilioRes.ok });
    } catch (err) {
      results.push({ nom: p.nom, ok: false, reason: "erreur réseau" });
    }
  }

  const sentCount = results.filter(r => r.ok).length;
  return {
    statusCode: 200,
    body: JSON.stringify({ total: participants.length, sent: sentCount, results })
  };
};