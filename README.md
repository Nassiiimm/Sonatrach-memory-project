# Sonatrach · Plateforme de gestion des hébergements (v4 premium noir)

Application full JS (React + Node/Express + MongoDB), design **dark premium** inspiré des consoles internes des grandes majors pétrolières.

## Workflow métier

1. **Employé**
   - Crée une demande (destination/motif, ville/pays, dates, centre de coût, requêtes particulières).
   - Peut joindre des documents (ordre de mission, convocation…).
   - Statut initial : `EN_ATTENTE_MANAGER`.

2. **Manager (supérieur régional)**
   - Valide ou refuse la demande.
   - Ne réserve rien : il décide uniquement de libérer ou non l’employé.
   - Si refus → `REFUSEE`.
   - Si accepté → `EN_ATTENTE_RELEX`.

3. **Service Relex**
   - Liste des demandes `EN_ATTENTE_RELEX`.
   - Choisit l’hôtel, la formule (séjour simple, formule repas, demi-pension, pension complète) et adapte éventuellement les dates.
   - Calcule automatiquement le nombre de nuitées.
   - Passe en `EN_ATTENTE_FINANCE`.

4. **Service Finance**
   - Liste des demandes `EN_ATTENTE_FINANCE`.
   - Saisit le prix / nuit, la devise (DZD/EUR/USD) et éventuellement le numéro de BC.
   - Calcule automatiquement le total = nuitées × prix/nuit.
   - Statut final : `CLOTUREE`.

5. **Admin**
   - Gère les utilisateurs (EMPLOYE, MANAGER, RELEX, FINANCE, ADMIN).
   - Paramètre les hôtels (ville/pays, codes internes, fournisseur, grilles tarifaires).
   - Consulte les 200 derniers événements d’audit.
   - Exporte la base des réservations en CSV : `/api/admin/export`.

---

## Docker (recommandé)

1. Copier le fichier d’environnement :

```bash
cp backend/.env.example backend/.env
```

2. Lancer la stack :

```bash
docker compose up --build
```

3. Créer l’admin + jeux de rôles de test :

```bash
# Admin seul
docker compose run --rm backend npm run seed:admin

# Admin + Manager + Relex + Finance + Employé
docker compose run --rm backend npm run seed:demo
```

4. Accès :

- Frontend : http://localhost:8080  
- API : http://localhost:4000  

Identifiants disponibles après `seed:demo` :

- `admin@sonatrach.dz` / `changeme123` (ADMIN)
- `manager@sonatrach.dz` / `changeme123` (MANAGER)
- `relex@sonatrach.dz` / `changeme123` (RELEX)
- `finance@sonatrach.dz` / `changeme123` (FINANCE)
- `employe@sonatrach.dz` / `changeme123` (EMPLOYE)

---

## Développement sans Docker

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le proxy Vite redirige `/api` vers `http://localhost:4000`.