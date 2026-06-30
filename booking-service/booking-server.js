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
            title: "Booking Service API",
            version: "1.0.0",
            description: "Documentation du Booking Service"
        }
    },
    apis: [__filename]
});

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

const bookings = [];

const IDENTITY_URL = process.env.IDENTITY_URL || "http://localhost:3001";
const INVENTORY_URL = process.env.INVENTORY_URL || "http://localhost:3002";
const PAYMENT_URL = process.env.PAYMENT_URL || "http://localhost:3003";

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Créer une réservation
 *     description: Vérifie l'utilisateur, réserve une place, traite le paiement puis confirme ou annule la réservation.
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Réservation confirmée
 *       400:
 *         description: Utilisateur inexistant ou plus de place
 *       402:
 *         description: Paiement refusé
 *       500:
 *         description: Erreur interne
 */
//créer une réservation complète
app.post("/bookings", async (req, res) => {
    const { userId, eventId, amount, cardNumber } = req.body;

    const booking = {
        id: Date.now(),
        userId,
        eventId,
        amount,
        status: "pending",
        temporaryReservationId: null,
        transactionId: null,
        reason: null
    };
//La réservation est enregistrée
    bookings.push(booking);
//vérifier que l'utilisateur existe via Identity Service
    try {
        const userResponse = await axios.get(`${IDENTITY_URL}/users/${userId}/exists`);

        if (!userResponse.data.exists) {
            booking.status = "canceled";
            booking.reason = "Utilisateur inexistant";

            return res.status(400).json(booking);
        }
//réserver temporairement une place
        const inventoryResponse = await axios.post(
            `${INVENTORY_URL}/events/${eventId}/reserve`
        );
//stocker l'identifiant de réservation
        booking.temporaryReservationId =
            inventoryResponse.data.temporaryReservationId;
//demander le paiement au payment service
        try {
            const paymentResponse = await axios.post(`${PAYMENT_URL}/payments`, {
                amount,
                cardNumber
            });

            if (paymentResponse.data.accepted) {
                await axios.post(`${INVENTORY_URL}/events/${eventId}/confirm`, {
                    temporaryReservationId: booking.temporaryReservationId
                });

                booking.status = "confirmed";
                booking.transactionId = paymentResponse.data.transactionId;

                return res.json(booking);
            }
//Si le paiement est refusé, annuler la réservation
        } catch (paymentError) {
            await axios.post(`${INVENTORY_URL}/events/${eventId}/cancel`, {
                temporaryReservationId: booking.temporaryReservationId
            });

            booking.status = "payment_failed";
            booking.reason =
                paymentError.response?.data?.reason || "Paiement refusé";

            return res.status(402).json(booking);
        }
//gestion des erreurs
    } catch (err) {
        if (booking.temporaryReservationId) {
            try {
                await axios.post(`${INVENTORY_URL}/events/${eventId}/cancel`, {
                    temporaryReservationId: booking.temporaryReservationId
                });
            } catch (cancelError) {
                console.error("Erreur lors de l'annulation :", cancelError.message);
            }
        }

        booking.status = "canceled";
        booking.reason =
            err.response?.data?.message || "Erreur pendant la réservation";

        return res.status(500).json(booking);
    }
});

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Consulter toutes les réservations
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Liste des réservations
 */
//consulter toutes les réservations
app.get("/bookings", (req, res) => {
    res.json(bookings);
});

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Consulter une réservation
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Réservation trouvée
 *       404:
 *         description: Réservation introuvable
 */
//consulter une réservation précise
app.get("/bookings/:id", (req, res) => {
    const booking = bookings.find(b => b.id === Number(req.params.id));

    if (!booking) {
        return res.status(404).json({ message: "Réservation introuvable" });
    }

    res.json(booking);
});

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
    console.log(`Booking Service lancé sur le port ${PORT}`);
});