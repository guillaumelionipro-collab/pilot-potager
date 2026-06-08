import { useState } from "react";
import { User, CreditCard, ShieldCheck, Download, Trash2, Crown, ChevronRight, LogOut, Mail, Cloud, CloudOff, Smartphone } from "lucide-react";
import { Card, Button, Badge } from "../ui.jsx";
import { isPremium, isNativeApp } from "../../utils/billing";

function exportAllData() {
  const keys = ["zones", "cultures", "tasks", "harvests", "journal", "stocks", "seasons", "history", "seedlings", "problems"];
  const dump = {};
  keys.forEach((k) => { dump[k] = JSON.parse(localStorage.getItem(`pilot-potager:${k}`) || "[]"); });
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pilot-potager-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function Row({ icon, title, subtitle, action, danger }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-garden-cream/60 px-4 py-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${danger ? "bg-rose-100 text-rose-600" : "bg-white text-garden-pine"}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold ${danger ? "text-rose-700" : "text-garden-pine"}`}>{title}</p>
        {subtitle && <p className="text-xs text-garden-leaf truncate">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage({ user = null, authConfigured = false, onSignOut }) {
  const [premium] = useState(isPremium());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Jardinier";
  const native = isNativeApp();

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    ["zones", "cultures", "tasks", "harvests", "journal", "stocks", "seasons", "history", "seedlings", "problems"]
      .forEach((k) => localStorage.removeItem(`pilot-potager:${k}`));
    setConfirmDelete(false);
    window.location.reload();
  }

  return (
    <div className="grid gap-5 max-w-3xl">
      {/* Compte */}
      <Card>
        <h2 className="mb-3 text-lg font-black text-garden-pine flex items-center gap-2"><User size={18} /> Compte</h2>
        <div className="grid gap-2.5">
          {user ? (
            <>
              <Row icon={<User size={17} />} title={displayName} subtitle={user.email}
                action={<Badge tone="green"><span className="inline-flex items-center gap-1"><Cloud size={12} /> Synchronisé</span></Badge>} />
              <Row icon={<LogOut size={17} />} title="Se déconnecter" subtitle="Vos données restent sauvegardées dans le cloud" danger
                action={<Button variant="secondary" onClick={onSignOut}><LogOut size={15} /> Déconnexion</Button>} />
            </>
          ) : authConfigured ? (
            <Row icon={<CloudOff size={17} />} title="Mode local (sans compte)" subtitle="Connectez-vous pour activer la sauvegarde cloud et la synchro multi-appareil"
              action={<Badge tone="gray"><span className="inline-flex items-center gap-1"><CloudOff size={12} /> Local uniquement</span></Badge>} />
          ) : (
            <Row icon={<Mail size={17} />} title="Profil jardinier" subtitle="Connectez Supabase (VITE_SUPABASE_URL/ANON_KEY) pour activer les comptes" action={<ChevronRight size={16} className="text-garden-sage" />} />
          )}
          <Row icon={<ShieldCheck size={17} />} title="Confidentialité & sécurité" subtitle="Politique de confidentialité, gestion des données personnelles (RGPD)"
            action={<a href="/privacy.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-garden-pine underline decoration-garden-moss underline-offset-2">Consulter <ChevronRight size={14} /></a>} />
        </div>
      </Card>

      {/* Abonnement */}
      <Card>
        <h2 className="mb-3 text-lg font-black text-garden-pine flex items-center gap-2"><CreditCard size={18} /> Abonnement</h2>
        <Row
          icon={<Crown size={17} className={premium ? "text-garden-amber" : ""} />}
          title={premium ? "Pilot Premium actif" : "Plan gratuit"}
          subtitle={premium ? "4,99 € / mois — résiliable à tout moment" : "Passez Premium pour débloquer toutes les fonctionnalités"}
          action={<Badge tone={premium ? "green" : "gray"}>{premium ? "Premium" : "Free"}</Badge>}
        />
        {!native && !premium && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-garden-cream/60 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-garden-pine"><Smartphone size={17} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-garden-pine text-sm">Premium disponible sur l'application Android</p>
              <p className="text-xs text-garden-leaf">Téléchargez Pilot Potager sur Google Play pour débloquer l'analyse IA illimitée, la météo personnalisée et la sauvegarde cloud.</p>
            </div>
          </div>
        )}
        <p className="mt-2 text-[11px] text-garden-sage">
          L'abonnement Pilot Premium (paiement, factures, annulation) est géré exclusivement via <strong>Google Play</strong> sur l'application Android — voir la page « Pilot Premium » (achat &amp; restauration RevenueCat) et <code className="px-1 rounded bg-garden-cream">supabase/functions/revenuecat-webhook</code> pour la synchronisation côté serveur. La version web reste une vitrine gratuite pour découvrir l'application.
        </p>
      </Card>

      {/* Données */}
      <Card>
        <h2 className="mb-3 text-lg font-black text-garden-pine flex items-center gap-2"><Download size={18} /> Vos données</h2>
        <div className="grid gap-2.5">
          <Row icon={<Download size={17} />} title="Exporter mes données"
            subtitle="Téléchargez toutes vos cultures, tâches, récoltes et photos au format JSON"
            action={<Button variant="secondary" onClick={exportAllData}><Download size={15} /> Exporter</Button>} />
          <Row icon={<Trash2 size={17} />} title="Supprimer mon compte"
            subtitle="Efface définitivement toutes les données stockées sur cet appareil" danger
            action={
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 size={15} /> {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
              </Button>
            } />
        </div>
        {confirmDelete && (
          <p className="mt-2 text-xs font-bold text-rose-600">⚠️ Cliquez à nouveau pour confirmer — cette action est irréversible.</p>
        )}
      </Card>
    </div>
  );
}
