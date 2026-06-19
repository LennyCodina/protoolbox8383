# Assistant Livraison IA

MVP web Next.js permettant d'importer une photo ou un PDF de bons de livraison,
d'extraire des adresses en mode MOCK, puis de générer une tournée avec un lien
Google Maps.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

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
