const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const bookings = [];

const IDENTITY_URL = "http://localhost:3001";
const INVENTORY_URL = "http://localhost:3002";
const PAYMENT_URL = "http://localhost:3003";
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
//consulter toutes les réservations
app.get("/bookings", (req, res) => {
    res.json(bookings);
});
//consulter une réservation précise
app.get("/bookings/:id", (req, res) => {
    const booking = bookings.find(b => b.id === Number(req.params.id));

    if (!booking) {
        return res.status(404).json({ message: "Réservation introuvable" });
    }

    res.json(booking);
});

app.listen(3004, () => {
    console.log("Booking Service lancé sur le port 3004");
});