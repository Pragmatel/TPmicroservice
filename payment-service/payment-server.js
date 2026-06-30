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
            title: "Payment Service API",
            version: "1.0.0",
            description: "Documentation du Payment Service"
        }
    },
    apis: [__filename]
});

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);
/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Traiter un paiement
 *     description: Simule un paiement pouvant être accepté ou refusé selon les règles métier.
 *     tags:
 *       - Payments
 *     responses:
 *       200:
 *         description: Paiement accepté
 *       402:
 *         description: Paiement refusé
 */
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

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`Payment Service lancé sur le port ${PORT}`);
});