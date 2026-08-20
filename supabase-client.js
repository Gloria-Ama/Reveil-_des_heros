// ============================================================
// CONNEXION À LA BASE DE DONNÉES SUPABASE
// ============================================================
// Remplace les deux valeurs ci-dessous par celles de ton projet
// Supabase (Settings > API > Project URL / anon public key).
// Ces deux valeurs sont conçues pour être publiques (visibles
// dans le code du site) — ce n'est pas un secret à protéger.
// ============================================================

const SUPABASE_URL = "https://fijmqryjryrxbuabxwpg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Xu3d9A1CP1xtftiUzHCLxg_NnAJ5pWI";

const supabaseClient = (SUPABASE_URL.startsWith("http"))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Enregistre un participant. Retourne { ok: true } si succès,
// { ok: true, duplicate: true } si ce numéro existe déjà (pas bloquant),
// { ok: false } si la base de données n'est pas encore connectée ou en cas d'erreur réseau.
async function registerParticipant({ nom, telephone, courriel }) {
  if (!supabaseClient) {
    console.warn("Supabase n'est pas encore configuré (voir supabase-client.js).");
    return { ok: false };
  }
  try {
    const { error } = await supabaseClient.from("participants").insert([
      { nom, telephone, email: courriel || null, consentement: true }
    ]);
    if (error) {
      // code 23505 = violation de contrainte unique -> ce téléphone est déjà inscrit
      if (error.code === "23505") {
        return { ok: true, duplicate: true };
      }
      console.error("Erreur Supabase:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Erreur réseau Supabase:", err);
    return { ok: false };
  }
}