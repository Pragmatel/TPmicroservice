const express = require("express");
const app = express();

app.use(express.json());
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
//consulter tous les événements
app.get("/events", (req, res) => {
    res.json(events);
});
//consulter un événement précis
app.get("/events/:id", (req, res) => {
    const event = events.find(e => e.id === Number(req.params.id));

    if (!event) {
        return res.status(404).json({ message: "Événement introuvable" });
    }

    res.json(event);
});
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

app.listen(3002, () => {
    console.log("Inventory Service lancé sur le port 3002");
});