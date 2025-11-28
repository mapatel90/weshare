import express from 'express';
import { solisRequest } from '../utils/solisApi.js';

const router = express.Router();

router.post('/plant', async (req, res) => {
    try {
        const result = await solisRequest("/v1/api/userStationList");

        res.json({
            message: "SolisCloud API Working ✔",
            solisData: result
        });

    } catch (err) {
        res.status(500).json({ error: "SolisCloud API failed", details: err });
    }
});


export default router;
