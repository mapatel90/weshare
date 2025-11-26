import express from 'express';
import { solisRequest } from '../utils/solisApi.js';

const router = express.Router();

router.post('/demo', async (req, res) => {
    try {
        // const { inverterSn } = req.body;

        const result = await solisRequest("/v1/api/userStationList");
        // const result = await solisRequest("/v1/api/inverterDetail", {
        //     sn: inverterSn
        // });

        res.json({
            message: "SolisCloud API Working ✔",
            solisData: result
        });
    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "SolisCloud API failed" });
    }
});

export default router;
