# Pointage DPR

App de pointage employés — nom, géolocalisation, photo webcam, horodatage. PWA React + Vite + Tailwind, Supabase (BDD + storage + realtime) et notifications ntfy.sh.

## Démarrage

1. Installer les dépendances :
   ```
   npm install
   ```
2. Dans le projet [Supabase](https://supabase.com), exécuter `schema.sql` dans l'éditeur SQL (Database > SQL Editor). Ça crée la table `pointages`, les policies RLS (insert + select anonyme) et le bucket de stockage `pointage-photos`.
3. Copier `.env.example` vers `.env` et renseigner :
   - `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Project Settings > API)
   - `VITE_NTFY_TOPIC` : le topic [ntfy.sh](https://ntfy.sh) à utiliser (ex : `pointage-dpr-x7k2m`). S'abonner à ce topic depuis l'app mobile ntfy pour recevoir les notifications.
   - `VITE_MANAGER_PIN` : le code PIN pour déverrouiller la vue manager (protection simple côté client, pas une vraie authentification).
4. Lancer le serveur de développement :
   ```
   npm run dev
   ```

## Build de production

```
npm run build
```

Le contenu généré dans `dist/` est prêt pour Vercel. Le service worker (`public/sw.js`) et le manifest PWA (`public/manifest.json`) permettent l'installation sur mobile.

## Déploiement Vercel

1. Pousser ce repo sur GitHub.
2. Importer le repo dans [Vercel](https://vercel.com/new).
3. Renseigner les variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_NTFY_TOPIC`, `VITE_MANAGER_PIN`) dans Project Settings > Environment Variables.
4. Déployer.

## Structure

- `src/components/EmployeeView.jsx` — nom, bouton "Pointer" (géolocalisation → caméra → envoi)
- `src/components/CameraCapture.jsx` — capture photo via `getUserMedia`
- `src/components/ManagerView.jsx` — PIN gate + liste des pointages (triée, miniature photo, lien Google Maps)
- `src/lib/supabase.js` — client Supabase
- `src/lib/storage.js` — upload des photos vers le bucket `pointage-photos`
- `src/lib/ntfy.js` — notification push à chaque nouveau pointage
- `src/lib/geolocation.js` — wrapper `getCurrentPosition`
- `schema.sql` — DDL Supabase (table `pointages`, RLS, storage, realtime)
