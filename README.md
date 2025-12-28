# Sonatrach - Plateforme de gestion des hebergements

Application full-stack (React + Node/Express + MongoDB) pour la gestion des reservations hotelieres de la Division Production de Sonatrach.

## Workflow metier

### Module Reservations

```
EMPLOYE → MANAGER regional → RELEX (siege) → RESERVEE
              ↓
           REFUSEE
```

1. **Employe**
   - Cree une demande d'hebergement (destination, dates, motif)
   - Peut joindre des documents (ordre de mission, convocation)
   - Statut initial : `EN_ATTENTE_MANAGER`

2. **Manager regional**
   - Voit uniquement les demandes de **sa region**
   - Valide ou refuse la demande
   - Si refuse → `REFUSEE`
   - Si accepte → `EN_ATTENTE_RELEX`

3. **Relex (siege)**
   - Voit toutes les demandes validees par les managers
   - Choisit l'hotel, la formule, le type de chambre
   - Confirme la reservation → `RESERVEE`

### Module Finance (separe)

Le service Finance gere les **factures des hotels** independamment du workflow de reservation :
- Saisie des factures recues des hotels
- Validation et suivi des paiements
- Export CSV des factures

## Roles et permissions

| Role | Scope | Acces |
|------|-------|-------|
| EMPLOYE | Sa region | Creer des demandes |
| MANAGER | Sa region uniquement | Valider/Refuser les demandes |
| RELEX | Toutes regions | Reserver les hotels |
| FINANCE | Toutes regions | Gerer les factures |
| ADMIN | Global | Administration complete |

## Structure du projet

```
Sonatrach-memory-project/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Request.js
│   │   │   ├── Hotel.js
│   │   │   ├── Facture.js
│   │   │   ├── Audit.js
│   │   │   └── Region.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── requests.js
│   │   │   ├── hotels.js
│   │   │   ├── factures.js
│   │   │   ├── admin.js
│   │   │   └── audit.js
│   │   ├── middleware/auth.js
│   │   └── constants/status.js
│   └── scripts/
│       ├── seed-admin.js
│       ├── seed-demo.js
│       ├── seed-hotels.js
│       └── seed-regions.js
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Requests.jsx
│       │   ├── Approvals.jsx
│       │   ├── Relex.jsx
│       │   ├── Finance.jsx
│       │   └── Admin.jsx
│       ├── components/
│       │   ├── Nav.jsx
│       │   ├── Table.jsx
│       │   └── KPI.jsx
│       └── context/Auth.jsx
└── docker-compose.yml
```

## Installation

### Avec Docker (recommande)

1. Copier le fichier d'environnement :
```bash
cp backend/.env.example backend/.env
```

2. **Important** : Modifier le `JWT_SECRET` dans `backend/.env`

3. Lancer la stack :
```bash
docker compose up --build
```

4. Creer les comptes de demo :
```bash
docker compose run --rm backend npm run seed:demo
```

5. Acces :
   - Frontend : http://localhost:8080
   - API : http://localhost:4000

### Comptes de demonstration

| Role | Email | Mot de passe | Region |
|------|-------|--------------|--------|
| Admin | admin@sonatrach.dz | Demo@2024 | ALG |
| Manager | manager.hmd@sonatrach.dz | Demo@2024 | HMD |
| Manager | manager.hrm@sonatrach.dz | Demo@2024 | HRM |
| Relex | relex@sonatrach.dz | Demo@2024 | ALG |
| Finance | finance@sonatrach.dz | Demo@2024 | ALG |
| Employe | ahmed.benali@sonatrach.dz | Demo@2024 | HMD |
| Employe | fatima.khaled@sonatrach.dz | Demo@2024 | HRM |

### Sans Docker

**Backend :**
```bash
cd backend
cp .env.example .env
# Modifier JWT_SECRET dans .env
npm install
npm run dev
```

**Frontend :**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion (rate limited: 5 tentatives / 15 min)

### Utilisateurs
- `GET /api/users` - Liste (ADMIN)
- `POST /api/users` - Creer (ADMIN)
- `PATCH /api/users/:id` - Modifier (ADMIN)
- `PATCH /api/users/:id/toggle` - Activer/Desactiver (ADMIN)

### Demandes
- `GET /api/requests` - Liste (filtree par role/region)
- `POST /api/requests` - Creer (EMPLOYE)
- `PATCH /api/requests/:id/manager` - Valider/Refuser (MANAGER)
- `PATCH /api/requests/:id/relex` - Reserver (RELEX)
- `GET /api/requests/:id/bc` - Telecharger BC PDF (FINANCE, ADMIN)

### Hotels
- `GET /api/hotels` - Liste
- `POST /api/hotels` - Creer (ADMIN)

### Factures
- `GET /api/factures` - Liste (FINANCE, ADMIN)
- `GET /api/factures/stats` - Statistiques (FINANCE, ADMIN)
- `POST /api/factures` - Creer (FINANCE, ADMIN)
- `PATCH /api/factures/:id` - Modifier statut (FINANCE, ADMIN)
- `DELETE /api/factures/:id` - Supprimer (ADMIN)

### Administration
- `GET /api/admin/export` - Export CSV (ADMIN, FINANCE)
- `GET /api/audit` - Journal d'audit (ADMIN)

## Regions

| Code | Nom |
|------|-----|
| ALG | Siege Alger |
| HMD | Hassi Messaoud |
| HRM | Hassi R'Mel |
| OHT | Ohanet |
| INS | In Salah |
| ARZ | Arzew |
| SKD | Skikda |
| BJA | Bejaia |

## Securite

- JWT avec expiration 8h
- Rate limiting sur login (5 tentatives / 15 min)
- Mot de passe minimum 8 caracteres
- Hashage bcrypt (salt rounds: 10)
- CORS configure
- Validation Joi sur toutes les entrees
- Audit trail complet

## Technologies

- **Backend** : Node.js, Express, MongoDB, Mongoose
- **Frontend** : React 18, Vite, React Router 6, Axios
- **Auth** : JWT, bcryptjs
- **PDF** : PDFKit
- **Validation** : Joi
- **Containerisation** : Docker, Docker Compose
