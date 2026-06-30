const express = require("express");
const app = express();

app.use(express.json());
//simuler le traitement d'un paiement
app.post("/payments", (req, res) => {
    const { amount, cardNumber } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({
            accepted: false,
            reason: "Montant invalide"
        });
    }
//le paiement est refusé si le montant dépasse 100 €
    if (amount > 100) {
        return res.status(402).json({
            accepted: false,
            reason: "Paiement refusé : montant trop élevé"
        });
    }

    if (cardNumber === "0000") {
        return res.status(402).json({
            accepted: false,
            reason: "Paiement refusé : carte invalide"
        });
    }
//Génère un identifiant de transaction simulé
    res.json({
        accepted: true,
        transactionId: Date.now(),
        message: "Paiement accepté"
    });
});

app.listen(3003, () => {
    console.log("Payment Service lancé sur le port 3003");
});