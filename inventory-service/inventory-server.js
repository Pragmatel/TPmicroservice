const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const express = require("express");
const app = express();
require("dotenv").config();
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

app.use(express.json());

app.use(helmet());
app.use(cors());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Inventory Service API",
            version: "1.0.0",
            description: "Documentation du Inventory Service"
        }
    },
    apis: [__filename]
});

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);
//simulation de la réservation
const events = [
    {
        id: 1,
        name: "Concert Aya",
        availableSeats: 3,
        temporaryReservations: [],
        confirmedReservations: []
    },
    {
        id: 2,
        name: "Conférence Tech",
        availableSeats: 1,
        temporaryReservations: [],
        confirmedReservations: []
    }
];
/**
 * @swagger
 * /events:
 *   get:
 *     summary: Consulter tous les événements
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: Liste des événements
 */
//consulter tous les événements
app.get("/events", (req, res) => {
    res.json(events);
});
/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Consulter un événement
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Événement trouvé
 *       404:
 *         description: Événement introuvable
 */
//consulter un événement précis
app.get("/events/:id", (req, res) => {
    const event = events.find(e => e.id === Number(req.params.id));

    if (!event) {
        return res.status(404).json({ message: "Événement introuvable" });
    }

    res.json(event);
});
/**
 * @swagger
 * /events/{id}/reserve:
 *   post:
 *     summary: Réserver temporairement une place
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Place réservée temporairement
 *       400:
 *         description: Plus aucune place disponible
 */
//réserver une place temporaire
app.post("/events/:id/reserve", (req, res) => {
    const event = events.find(e => e.id === Number(req.params.id));

    if (!event) {
        return res.status(404).json({ message: "Événement introuvable" });
    }
//Vérifie qu'il reste au moins une place disponible
    if (event.availableSeats <= 0) {
        return res.status(400).json({ message: "Aucune place disponible" });
    }

    const temporaryReservationId = Date.now();

    event.availableSeats--;

    event.temporaryReservations.push({
        id: temporaryReservationId,
        status: "pending"
    });

    res.json({
        message: "Place réservée temporairement",
        temporaryReservationId,
        event
    });
});
/**
 * @swagger
 * /events/{id}/confirm:
 *   post:
 *     summary: Confirmer définitivement une réservation
 *     tags:
 *       - Reservations
 *     responses:
 *       200:
 *         description: Réservation confirmée
 *       404:
 *         description: Réservation introuvable
 */
//confirmer une réservation temporaire
app.post("/events/:id/confirm", (req, res) => {
    const { temporaryReservationId } = req.body;

    const event = events.find(e => e.id === Number(req.params.id));

    if (!event) {
        return res.status(404).json({ message: "Événement introuvable" });
    }

    const reservation = event.temporaryReservations.find(
        r => r.id === temporaryReservationId
    );

    if (!reservation) {
        return res.status(404).json({
            message: "Réservation temporaire introuvable"
        });
    }

    event.temporaryReservations = event.temporaryReservations.filter(
        r => r.id !== temporaryReservationId
    );

    event.confirmedReservations.push({
        id: temporaryReservationId,
        status: "confirmed"
    });

    res.json({
        message: "Réservation confirmée définitivement",
        event
    });
});
/**
 * @swagger
 * /events/{id}/cancel:
 *   post:
 *     summary: Annuler une réservation temporaire
 *     tags:
 *       - Reservations
 *     responses:
 *       200:
 *         description: Réservation annulée
 *       404:
 *         description: Réservation introuvable
 */
//annuler une réservation temporaire
app.post("/events/:id/cancel", (req, res) => {
    const { temporaryReservationId } = req.body;

    const event = events.find(e => e.id === Number(req.params.id));

    if (!event) {
        return res.status(404).json({ message: "Événement introuvable" });
    }

    const reservationExists = event.temporaryReservations.some(
        r => r.id === temporaryReservationId
    );

    if (!reservationExists) {
        return res.status(404).json({
            message: "Réservation temporaire introuvable"
        });
    }

    event.temporaryReservations = event.temporaryReservations.filter(
        r => r.id !== temporaryReservationId
    );

    event.availableSeats++;

    res.json({
        message: "Réservation temporaire annulée, place libérée",
        event
    });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Inventory Service lancé sur le port ${PORT}`);
});