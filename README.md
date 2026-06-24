# Assistant Livraison IA

MVP web Next.js permettant d'importer une photo ou un PDF de bons de livraison,
d'extraire des adresses en mode MOCK, puis de générer une tournée avec un lien
Google Maps.

## Lancer le projet

```bash
npm install
npm run auth:hash
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Authentification

Toutes les pages et API sont protegees par une session serveur de 7 jours.
Les mots de passe sont hashes avec `scrypt` et ne sont jamais envoyes au
navigateur.

Generer une entree utilisateur :

```bash
npm run auth:hash
```

Puis configurer `.env.local` :

```bash
AUTH_USERS_JSON=[{"username":"paul","passwordHash":"scrypt$..."}]
SESSION_SECRET=une-valeur-aleatoire-de-32-caracteres-minimum
SESSION_VERSION=1
OCR_SPACE_API_KEY=votre_cle_ocr_space
```

Pour plusieurs utilisateurs, placer plusieurs objets dans le tableau JSON.
Pour deconnecter toutes les sessions existantes, incrementer
`SESSION_VERSION`.

Sur Vercel, ajouter les memes variables dans **Settings > Environment
Variables**, puis effectuer un nouveau deploiement. Ne jamais prefixer ces
variables avec `NEXT_PUBLIC_`.

## Pages

- `/` : page d'accueil.
- `/demo` : import document, saisie manuelle, analyse et tournée.
- `/api/extract` : API serverless d'extraction en mode MOCK.

## Mode OCR.space

Le MVP retourne des adresses fictives si aucune cle OCR n'est configuree.

Pour activer OCR.space, creer `.env.local` :

```bash
OCR_SPACE_API_KEY=votre_cle_ocr_space
```

Puis relancer :

```bash
npm run dev
```

La formule gratuite OCR.space limite les fichiers a 1 Mo. Les photos sont
compressees automatiquement dans le navigateur. Les PDF de plus de 1 Mo sont
refuses dans ce MVP.

## Optimisation de tournee

Le flow serveur est :

1. Extraction des adresses depuis OCR.space ou mode MOCK.
2. Geocodage des adresses via `https://data.geopf.fr/geocodage/search`.
3. Tri nearest-neighbor sur les coordonnees GPS disponibles.
4. Generation d'un lien Google Maps avec les coordonnees optimisées.

Si une adresse n'est pas geocodee, elle reste dans la tournee avec un tri de
secours.

L'adresse de depart, par exemple entrepot ou agence, est sauvegardee dans le
navigateur avec `localStorage`. Elle sert de point de depart pour optimiser la
tournee et ouvrir Google Maps.
