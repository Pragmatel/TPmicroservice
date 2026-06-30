# TP - Réservation distribuée et transactions métier

## Présentation

Ce projet a été réalisé dans le cadre du TP de microservices.

L'objectif est de mettre en place une architecture distribuée permettant de gérer la réservation d'une place pour un événement tout en garantissant la cohérence des données entre plusieurs services indépendants.

Chaque microservice possède sa propre responsabilité et communique avec les autres via des requêtes HTTP.

---

# Architecture

Le projet est composé de quatre microservices :

- Identity Service
- Inventory Service
- Payment Service
- Booking Service

Le Booking Service joue le rôle d'orchestrateur et centralise le processus métier.

```
Client
   │
   ▼
Booking Service
   │
   ├────────► Identity Service
   │
   ├────────► Inventory Service
   │
   └────────► Payment Service
```

---

# Technologies utilisées

- Node.js
- Express.js
- Axios
- Swagger UI
- Swagger JSDoc

---

# Structure du projet

```
reservation-distribuee/

│
├── identity-service/
│      identity-server.js
│      package.json
│
├── inventory-service/
│      inventory-server.js
│      package.json
│
├── payment-service/
│      payment-server.js
│      package.json
│
├── booking-service/
│      booking-server.js
│      package.json
│
├── package.json
├── README.md
└── .gitignore
```

---

# Ports utilisés

| Service | Port |
|----------|------|
| Identity | 3001 |
| Inventory | 3002 |
| Payment | 3003 |
| Booking | 3004 |

---

# Installation

Se placer à la racine du projet

```
npm install
```

Puis installer les dépendances de chaque service :

```
cd identity-service
npm install

cd ../inventory-service
npm install

cd ../payment-service
npm install

cd ../booking-service
npm install
```

---

# Lancement

Depuis la racine :

```
npm start
```

Le script lance automatiquement les quatre microservices.

---

# Services disponibles

## Identity Service

```
GET /
```

Retourne l'état du service.

```
GET /users/:id
```

Retourne un utilisateur.

```
GET /users/:id/exists
```

Retourne simplement si l'utilisateur existe.

---

## Inventory Service

```
GET /
```

Etat du service.

```
GET /events
```

Liste des événements.

```
GET /events/:id
```

Retourne un événement.

```
POST /events/:id/reserve
```

Réserve temporairement une place.

```
POST /events/:id/confirm
```

Confirme une réservation.

```
POST /events/:id/cancel
```

Annule une réservation temporaire.

---

## Payment Service

```
GET /
```

Etat du service.

```
POST /payments
```

Traite un paiement.

Le paiement est refusé :

- si le montant dépasse 100 €
- si le numéro de carte est "0000"

---

## Booking Service

```
GET /
```

Etat du service.

```
POST /bookings
```

Crée une réservation complète.

```
GET /bookings
```

Liste toutes les réservations.

```
GET /bookings/:id
```

Retourne une réservation.

---

# Fonctionnement métier

Lorsqu'une réservation est créée :

1. vérification de l'utilisateur
2. réservation temporaire d'une place
3. traitement du paiement
4. confirmation de la réservation

Si le paiement échoue :

- la réservation temporaire est supprimée
- la place est libérée
- le statut devient **payment_failed**

Le système reste ainsi cohérent.

---

# Statuts

Une réservation peut prendre plusieurs états :

- pending
- confirmed
- payment_failed
- canceled

---

# Documentation Swagger

Chaque microservice possède sa propre documentation.

```
http://localhost:3001/api-docs

http://localhost:3002/api-docs

http://localhost:3003/api-docs

http://localhost:3004/api-docs
```

---

## Lancement avec Docker

Le projet peut être lancé avec Docker Compose.

```bash
docker compose up --build

# Auteur

Etienne Barberi
Bachelor Informatique