import { useState } from "react";
import { Camera, Upload, Loader, AlertTriangle, Sparkles, FlaskConical } from "lucide-react";
import { myPlants } from "../../data/potager/plants";
import { analyzePlantPhoto, isVisionConfigured, visionMode } from "../../utils/plantVision";
import PlantHealthCard from "./PlantHealthCard";
import PhotoSourceButtons from "./PhotoSourceButtons";

// Demo result library — one realistic diagnostic profile per plant type.
// In production this whole object disappears: the model generates the JSON live from the photo.
const RESULT_LIBRARY = {
  "Tomate": {
    confidence: 0.92, health_status: "bon", health_score: 85, growth_stage: "floraison",
    observations: [
      "Feuillage vert vigoureux",
      "Tige principale solide et bien tuteurée",
      "Premières fleurs jaunes visibles",
      "Pas de signes visibles de maladie",
    ],
    possible_issues: ["Pot potentiellement trop petit à surveiller", "Gourmands à inspecter régulièrement"],
    recommended_actions: [
      { title: "Retirer les gourmands", priority: "moyenne", description: "Supprimer les petites pousses situées entre la tige principale et les branches latérales." },
      { title: "Apport d'engrais tomates", priority: "faible", description: "Faire un apport d'engrais légumes-fruits dans les 7 prochains jours." },
    ],
    watering_advice: "Arroser régulièrement au pied sans mouiller les feuilles. Sol toujours légèrement humide.",
    fertilizer_advice: "Engrais tomates/légumes-fruits tous les 10 à 15 jours à partir de la floraison.",
    harvest_estimate: "Premières tomates possibles dans 3 à 5 semaines.",
    next_check: "Dans 3 à 4 jours",
  },
  "Courgette": {
    confidence: 0.89, health_status: "bon", health_score: 80, growth_stage: "fructification",
    observations: ["Grandes feuilles bien développées", "Fleurs mâles et femelles visibles", "Premiers fruits en formation"],
    possible_issues: ["Léger flétrissement en pleine chaleur l'après-midi", "Présence possible d'oïdium à surveiller sur le feuillage"],
    recommended_actions: [
      { title: "Polliniser à la main", priority: "haute", description: "Le matin tôt, transférer le pollen des fleurs mâles vers les fleurs femelles avec un pinceau." },
      { title: "Surveiller l'oïdium", priority: "moyenne", description: "Inspecter le dessus des feuilles ; au premier signe de feutrage blanc, retirer les feuilles atteintes." },
    ],
    watering_advice: "Arrosage abondant et régulier au pied, surtout en période de fructification.",
    fertilizer_advice: "Engrais riche en potasse toutes les 2 semaines pour soutenir la fructification.",
    harvest_estimate: "Premières courgettes récoltables sous 5 à 8 jours.",
    next_check: "Dans 2 à 3 jours",
  },
  "Concombre": {
    confidence: 0.87, health_status: "bon", health_score: 82, growth_stage: "croissance",
    observations: ["Tiges grimpantes bien engagées sur le support", "Feuillage dense et vert", "Vrilles actives"],
    possible_issues: ["Sensibilité à l'oïdium par temps humide", "Sol en surface qui sèche vite en pot"],
    recommended_actions: [
      { title: "Pailler le pied", priority: "moyenne", description: "Ajouter un paillage léger pour conserver l'humidité du sol et limiter le stress hydrique." },
      { title: "Palisser les nouvelles tiges", priority: "faible", description: "Guider et attacher les nouvelles pousses sur le treillage au fur et à mesure." },
    ],
    watering_advice: "Arrosage régulier et profond, au pied, sans mouiller le feuillage. Le concombre est gourmand en eau.",
    fertilizer_advice: "Engrais légumes-fruits dilué toutes les 10 jours à partir de la floraison.",
    harvest_estimate: "Récolte possible dans environ 2 à 3 semaines.",
    next_check: "Dans 3 jours",
  },
  "Melon Charentais": {
    confidence: 0.84, health_status: "à surveiller", health_score: 70, growth_stage: "croissance",
    observations: ["Feuillage globalement vert avec quelques feuilles basses jaunies", "Tiges rampantes bien développées", "Pas de fruit visible pour le moment"],
    possible_issues: ["Jaunissement des feuilles basses : possible excès d'eau ou carence légère", "Pot/bac à surveiller pour le drainage"],
    recommended_actions: [
      { title: "Vérifier le drainage", priority: "haute", description: "S'assurer que l'eau s'évacue bien du contenant et espacer légèrement les arrosages." },
      { title: "Retirer les feuilles jaunies", priority: "moyenne", description: "Supprimer les feuilles basses abîmées pour limiter les risques de maladie et favoriser l'aération." },
    ],
    watering_advice: "Arrosage modéré, au pied, en laissant le sol sécher légèrement entre deux arrosages. Le melon n'aime pas l'excès d'eau.",
    fertilizer_advice: "Apport d'engrais riche en potasse à la formation des fruits.",
    harvest_estimate: "Récolte estimée dans 5 à 7 semaines selon l'évolution.",
    next_check: "Dans 2 jours",
  },
  "Poivron": {
    confidence: 0.9, health_status: "bon", health_score: 83, growth_stage: "floraison",
    observations: ["Port compact et bien ramifié", "Premières fleurs blanches apparues", "Feuillage sain, vert soutenu"],
    possible_issues: ["Pucerons à surveiller sous les jeunes feuilles", "Besoin d'un tuteurage léger à anticiper"],
    recommended_actions: [
      { title: "Installer un tuteur léger", priority: "moyenne", description: "Anticiper le poids des futurs fruits avec un tuteurage discret de la tige principale." },
      { title: "Apport d'engrais légumes-fruits", priority: "faible", description: "Premier apport d'engrais dilué pour accompagner la floraison." },
    ],
    watering_advice: "Arrosage régulier et modéré, en évitant les à-coups d'humidité qui favorisent la chute des fleurs.",
    fertilizer_advice: "Engrais légumes-fruits toutes les 2 semaines dès l'apparition des premières fleurs.",
    harvest_estimate: "Premiers poivrons attendus dans environ 6 à 8 semaines.",
    next_check: "Dans 4 jours",
  },
  "Aubergine": {
    confidence: 0.88, health_status: "à surveiller", health_score: 72, growth_stage: "croissance",
    observations: ["Plant globalement vigoureux", "Quelques petites perforations visibles sur le feuillage", "Premiers boutons floraux en formation"],
    possible_issues: ["Présence possible d'altises ou de doryphores : petits trous caractéristiques sur les feuilles", "Sol en surface asséché"],
    recommended_actions: [
      { title: "Inspecter sous les feuilles", priority: "haute", description: "Vérifier la face inférieure des feuilles pour détecter acariens, doryphores ou pucerons et agir tôt." },
      { title: "Pailler et arroser", priority: "moyenne", description: "Maintenir une humidité régulière du sol avec un paillage léger." },
    ],
    watering_advice: "Arrosage régulier au pied, le sol devant rester frais mais non détrempé.",
    fertilizer_advice: "Engrais légumes-fruits riche en potasse à partir de la floraison.",
    harvest_estimate: "Récolte estimée dans 7 à 9 semaines.",
    next_check: "Dans 2 jours",
  },
  "Vigne": {
    confidence: 0.86, health_status: "bon", health_score: 88, growth_stage: "croissance",
    observations: ["Sarments vigoureux bien engagés sur le treillage", "Feuillage vert dense et sain", "Jeunes grappes en formation"],
    possible_issues: ["Quelques sarments désordonnés à guider", "Densité de grappes à surveiller pour la qualité"],
    recommended_actions: [
      { title: "Guider et attacher les sarments", priority: "moyenne", description: "Palisser les nouvelles pousses au fur et à mesure pour structurer la vigne et favoriser l'aération." },
      { title: "Éclaircir les grappes", priority: "faible", description: "Limiter le nombre de grappes par sarment pour obtenir des fruits plus qualitatifs." },
    ],
    watering_advice: "Arrosage modéré, en laissant sécher la surface du sol entre deux arrosages une fois la vigne bien installée.",
    fertilizer_advice: "Apport de compost mûr ou d'engrais organique au printemps, éviter les excès d'azote en été.",
    harvest_estimate: "Récolte estimée en fin d'été selon le cépage et l'ensoleillement.",
    next_check: "Dans 5 jours",
  },
  // Plants outside the user's current garden — proves the AI isn't limited to "my 9 plants"
  "Salade": {
    confidence: 0.91, health_status: "bon", health_score: 87, growth_stage: "croissance",
    observations: ["Pommes bien formées et compactes", "Couleur verte uniforme", "Pas de signe de montaison"],
    possible_issues: ["Limaces possibles en cas d'humidité prolongée", "Pommes extérieures un peu sableuses : penser à rincer avant récolte"],
    recommended_actions: [
      { title: "Surveiller les limaces le soir", priority: "moyenne", description: "Inspecter en soirée et pailler proprement pour limiter les zones refuges." },
      { title: "Récolter au fur et à mesure", priority: "faible", description: "Prélever les pommes arrivées à maturité pour stimuler la production des suivantes." },
    ],
    watering_advice: "Arrosage régulier et modéré le matin, en évitant de mouiller le cœur de la pomme.",
    fertilizer_advice: "Pas d'apport nécessaire en culture courte ; un compost léger au semis suffit généralement.",
    harvest_estimate: "Récolte possible dans 1 à 2 semaines.",
    next_check: "Dans 2 jours",
  },
  "Basilic": {
    confidence: 0.93, health_status: "excellent", health_score: 92, growth_stage: "croissance",
    observations: ["Feuillage parfumé, dense et lumineux", "Port buissonnant équilibré", "Pas de signe de stress hydrique"],
    possible_issues: ["Boutons floraux naissants à surveiller", "Sensibilité au froid nocturne si en extérieur"],
    recommended_actions: [
      { title: "Pincer les sommités", priority: "moyenne", description: "Pincer régulièrement le haut des tiges pour retarder la floraison et densifier le plant." },
      { title: "Récolter régulièrement", priority: "faible", description: "Prélever les feuilles au fur et à mesure des besoins pour stimuler la repousse." },
    ],
    watering_advice: "Arrosage modéré et régulier, le substrat devant sécher légèrement en surface entre deux arrosages.",
    fertilizer_advice: "Engrais aromatiques dilué une fois par mois suffit largement.",
    harvest_estimate: "Récolte continue possible dès maintenant.",
    next_check: "Dans 1 semaine",
  },
  "Fraisier": {
    confidence: 0.85, health_status: "bon", health_score: 81, growth_stage: "floraison",
    observations: ["Plant compact avec belle rosette de feuilles", "Plusieurs fleurs blanches ouvertes", "Quelques stolons en formation"],
    possible_issues: ["Stolons à gérer pour ne pas épuiser le plant", "Botrytis (pourriture grise) à surveiller en cas d'humidité prolongée sur les fruits naissants"],
    recommended_actions: [
      { title: "Couper les stolons superflus", priority: "moyenne", description: "Retirer les stolons non destinés à la multiplication pour concentrer l'énergie sur la fructification." },
      { title: "Pailler sous les fruits", priority: "faible", description: "Glisser un paillage (paille ou copeaux) sous les futurs fruits pour éviter le contact avec le sol humide." },
    ],
    watering_advice: "Arrosage régulier au pied, en évitant de mouiller les fleurs et les fruits.",
    fertilizer_advice: "Engrais petits fruits riche en potasse dès la floraison.",
    harvest_estimate: "Premières fraises mûres dans environ 3 à 4 semaines.",
    next_check: "Dans 3 jours",
  },
  "Poirier": {
    confidence: 0.8, health_status: "bon", health_score: 84, growth_stage: "floraison",
    observations: ["Charpente bien équilibrée", "Floraison abondante et homogène", "Écorce saine, sans plaie apparente"],
    possible_issues: ["Quelques pucerons cendrés possibles en extrémité de pousse", "Tavelure à surveiller en cas de printemps humide"],
    recommended_actions: [
      { title: "Surveiller les jeunes pousses", priority: "moyenne", description: "Inspecter les extrémités de rameaux pour détecter d'éventuelles colonies de pucerons en formation." },
      { title: "Aérer la ramure", priority: "faible", description: "Supprimer les rameaux qui se croisent pour favoriser la circulation de l'air et limiter les maladies fongiques." },
    ],
    watering_advice: "Arrosage copieux à l'installation, puis modéré une fois l'arbre bien enraciné — surtout par forte chaleur.",
    fertilizer_advice: "Apport de compost mûr au pied en fin d'hiver.",
    harvest_estimate: "Récolte attendue en fin d'été selon la variété.",
    next_check: "Dans 1 semaine",
  },
};

const PLANT_NAMES = Object.keys(RESULT_LIBRARY);

function buildResult(selectedPlant) {
  // 1) If the user picked one of their plants, use its real name + live data when available
  if (selectedPlant) {
    const baseName = Object.keys(RESULT_LIBRARY).find((name) => selectedPlant.name.toLowerCase().includes(name.toLowerCase()))
      || PLANT_NAMES[Math.floor(Math.random() * PLANT_NAMES.length)];
    const template = RESULT_LIBRARY[baseName];
    return {
      plant_detected: `${selectedPlant.name} (${selectedPlant.variety})`,
      ...template,
      health_score: selectedPlant.healthScore ?? template.health_score,
      growth_stage: selectedPlant.stage || template.growth_stage,
    };
  }
  // 2) Otherwise simulate a real detection across ANY plant type — not just the user's garden
  const detected = PLANT_NAMES[Math.floor(Math.random() * PLANT_NAMES.length)];
  return { plant_detected: detected, ...RESULT_LIBRARY[detected] };
}

const AI_READY = isVisionConfigured();
const AI_MODE = visionMode(); // "proxy" | "direct" | "none"

export default function PhotoAnalysis() {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [resultSource, setResultSource] = useState(null); // "ai" | "demo"
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    if (!file?.type.startsWith("image/")) return;
    setImageUrl(URL.createObjectURL(file));
    setImageFile(file);
    setResult(null);
    setError(null);
  }

  async function analyse() {
    if (!imageUrl || !imageFile) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);
    const selectedPlant = myPlants.find((p) => p.id === selectedPlantId) || null;

    if (AI_READY) {
      const response = await analyzePlantPhoto(imageFile, selectedPlant ? {
        name: selectedPlant.name,
        variety: selectedPlant.variety,
        stage: selectedPlant.stage,
        location: selectedPlant.location,
      } : null);

      if (response.ok) {
        setResult(response.result);
        setResultSource("ai");
        setAnalyzing(false);
        return;
      }
      // Real call failed — fall back to demo so the user still sees something useful,
      // but surface the error so they know it's not a live result.
      setError(response.message || "L'analyse IA a échoué, affichage d'un résultat de démonstration.");
    }

    // Demo mode (no key configured, or AI call failed)
    await new Promise((r) => setTimeout(r, 1800));
    setResult(buildResult(selectedPlant));
    setResultSource("demo");
    setAnalyzing(false);
  }

  function reset() {
    setImageUrl(null);
    setImageFile(null);
    setResult(null);
    setResultSource(null);
    setError(null);
    setSelectedPlantId("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2 items-start">

      {/* ── Left col : upload + controls ── */}
      <div className="grid gap-4">
        {/* Upload */}
        {!imageUrl ? (
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition ${
              dragging ? "border-garden-leaf bg-garden-moss/40" : "border-garden-sage/50 bg-garden-paper/60 hover:border-garden-leaf hover:bg-garden-moss/20"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-garden-pine/10">
              <Camera size={32} className="text-garden-pine" />
            </div>
            <div>
              <p className="text-base font-bold text-garden-pine">Ajoutez une photo de votre plante</p>
              <p className="text-sm text-garden-leaf">Prenez une photo ou importez-en une depuis votre galerie</p>
              <p className="mt-1 text-xs text-garden-sage">JPG, PNG · max 10 Mo</p>
            </div>
            <PhotoSourceButtons
              onFile={handleFile}
              onError={(msg) => setError(msg)}
            />
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden border border-garden-moss shadow-card">
            <img src={imageUrl} alt="Photo à analyser" className="w-full max-h-72 object-cover" />
            <div className="flex gap-2 p-3 bg-garden-paper">
              <button onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-garden-moss py-2 text-sm font-bold text-garden-leaf hover:bg-garden-moss/40 transition">
                <Upload size={15} /> Changer la photo
              </button>
            </div>
          </div>
        )}

        {/* Plant selector */}
        <div className="rounded-3xl border border-garden-moss bg-garden-paper/80 p-4">
          <p className="mb-2 text-sm font-bold text-garden-pine">🌱 Plante concernée</p>
          <select value={selectedPlantId} onChange={(e) => setSelectedPlantId(e.target.value)}
            className="w-full rounded-2xl border border-garden-moss bg-white px-3 py-2.5 text-sm font-semibold text-garden-pine focus:outline-none focus:ring-2 focus:ring-garden-leaf">
            <option value="">Détection automatique</option>
            {myPlants.map((p) => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name} — {p.variety}</option>
            ))}
          </select>
        </div>

        {/* Analyse button */}
        <button onClick={analyse} disabled={!imageUrl || analyzing}
          className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-black transition ${
            !imageUrl || analyzing
              ? "bg-garden-moss text-garden-leaf cursor-not-allowed"
              : "bg-garden-pine text-white hover:bg-garden-pine/90 shadow-card"
          }`}>
          {analyzing
            ? <><Loader size={18} className="animate-spin" /> Analyse en cours…</>
            : <><Camera size={18} /> Analyser la plante</>}
        </button>

        {/* Status / error */}
        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info box */}
        <div className="flex items-start gap-2 rounded-2xl bg-garden-moss/40 px-4 py-3 text-sm text-garden-pine">
          <Sparkles size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong>Comment ça marche ?</strong> Prenez ou importez une photo de votre plante : notre assistant l'analyse et retourne un diagnostic complet (état de santé, stade, actions recommandées et estimation de récolte). Il reconnaît n'importe quel type de plante, pas uniquement celles déjà suivies dans « Mes Plantes ».
          </div>
        </div>
      </div>

      {/* ── Right col : result ── */}
      <div>
        {!result && !analyzing && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-garden-moss bg-garden-paper/60 py-20 text-center">
            <span className="text-5xl">🤖</span>
            <p className="font-bold text-garden-pine">En attente d'une photo</p>
            <p className="text-sm text-garden-leaf">Importez une photo et lancez l'analyse</p>
          </div>
        )}

        {analyzing && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-garden-moss bg-garden-paper/60 py-20 text-center">
            <span className="text-5xl">🔬</span>
            <p className="font-bold text-garden-pine">Analyse en cours…</p>
            <p className="text-sm text-garden-leaf">L'IA examine votre plante en détail</p>
            <div className="flex gap-1.5 mt-2">
              {[0,1,2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-garden-leaf animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {result && <PlantHealthCard result={result} source={resultSource} />}
      </div>
    </div>
  );
}
