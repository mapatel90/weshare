import express from 'express';
import { solisRequest } from '../utils/solisApi.js';

const router = express.Router();

router.post('/plant', async (req, res) => {
    try {
        const result = await solisRequest("/v1/api/userStationList");

        res.json({
            message: "Users Station List Fetched",
            solisData: result
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch Users Station List", details: err });
    }
});

router.post('/stationdetail', async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Station ID is required" });
        }

        // Pass body to solisRequest
        const result = await solisRequest("/v1/api/stationDetail", { id });

        res.json({
            message: "Station Detail Fetched",
            solisData: result
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch Station Detail", details: err });
    }
});

router.post('/station/realtime-data', async (req, res) => {
    try {
        const { id, money, time, timeZone, nmiCode } = req.body;
        // Fix: check raw body before destructuring
        if (!req.body) {
            return res.status(400).json({ error: "Empty body received" });
        }

        if (!id && !nmiCode) {
            return res.status(400).json({ error: "id or nmiCode required" });
        }
        if (!money) {
            return res.status(400).json({ error: "money is required" });
        }
        if (!time) {
            return res.status(400).json({ error: "time is required" });
        }
        if (!timeZone) {
            return res.status(400).json({ error: "timeZone is required" });
        }

        const payload = {
            id: id || null,
            money,
            time,
            timeZone,
            nmiCode: nmiCode || null
        };
        console.log("payload", payload);

        const result = await solisRequest("/v1/api/stationDay", payload);

        res.json({
            message: "Station Day Data Fetched",
            solisData: result
        });

    } catch (err) {
        console.error("StationData Error:", err);
        res.status(500).json({
            error: "Failed to fetch station day data",
            details: err.message
        });
    }
});

router.post('/station/month-data', async (req, res) => {
    try {
        const { id, money, month, timeZone, nmiCode } = req.body;
        // Fix: check raw body before destructuring
        if (!req.body) {
            return res.status(400).json({ error: "Empty body received" });
        }

        if (!id && !nmiCode) {
            return res.status(400).json({ error: "id or nmiCode required" });
        }
        if (!money) {
            return res.status(400).json({ error: "money is required" });
        }
        if (!month) {
            return res.status(400).json({ error: "month is required" });
        }
        if (!timeZone) {
            return res.status(400).json({ error: "timeZone is required" });
        }

        const payload = {
            id: id || null,
            money,
            month,
            timeZone,
            nmiCode: nmiCode || null
        };
        console.log("payload", payload);

        const result = await solisRequest("/v1/api/stationMonth", payload);

        res.json({
            message: "Station Month Data Fetched",
            solisData: result
        });

    } catch (err) {
        console.error("StationMonth Error:", err);
        res.status(500).json({
            error: "Failed to fetch station month data",
            details: err.message
        });
    }
});

// Inverter List Endpoint
router.post("/inverter/list", async (req, res) => {
    try {
        const { pageNo, pageSize, stationId, nmiCode, snList } = req.body;

        // VALIDATION
        if (!pageNo) {
            return res.status(400).json({ error: "pageNo is required" });
        }
        if (!pageSize) {
            return res.status(400).json({ error: "pageSize is required" });
        }

        const payload = {
            pageNo,
            pageSize,
            stationId: stationId || null,
            nmiCode: nmiCode || null,
            snList: snList || null
        };

        console.log("InverterList Payload:", payload);

        const result = await solisRequest("/v1/api/inverterList", payload);

        res.json({
            message: "Inverter List Fetched Successfully",
            solisData: result
        });

    } catch (err) {
        console.error("InverterList Error:", err);
        res.status(500).json({
            error: "Failed to fetch inverter list",
            details: err.message
        });
    }
});

router.post("/inverter/detail", async (req, res) => {
    try {
        const { id, sn } = req.body;

        // Validation
        if (!id && !sn) {
            return res.status(400).json({
                error: "Either inverter 'id' or 'sn' is required"
            });
        }

        // Prepare correct payload
        const payload = {
            id: id || null,
            sn: sn || null
        };

        console.log("InverterDetail Payload:", payload);

        // Call SolisCloud API
        const result = await solisRequest("/v1/api/inverterDetail", payload);

        res.json({
            message: "Inverter detail fetched successfully",
            solisData: result
        });

    } catch (err) {
        console.error("InverterDetail Error:", err);
        res.status(500).json({
            error: "Failed to fetch inverter detail",
            details: err.message
        });
    }
});

router.post("/inverter/real-time/data", async (req, res) => {
    try {
        const { id, sn, money, time, timeZone } = req.body;

        // Validation
        if (!id && !sn) {
            return res.status(400).json({
                error: "Either inverter 'id' or 'sn' is required"
            });
        }
        if (!time) {
            return res.status(400).json({ error: "time (yyyy-MM-dd) is required" });
        }
        if (!timeZone) {
            return res.status(400).json({ error: "timeZone is required" });
        }

        // Prepare payload
        const payload = {
            id: id || null,
            sn: sn || null,
            money,
            time,
            timeZone
        };

        console.log("InverterDay Payload:", payload);

        // Call SolisCloud API
        const result = await solisRequest("/v1/api/inverterDay", payload);

        res.json({
            message: "Inverter day data fetched",
            solisData: result
        });

    } catch (err) {
        console.error("InverterDay Error:", err);
        res.status(500).json({
            error: "Failed to fetch inverter day data",
            details: err.message
        });
    }
});

router.post("/epm/list", async (req, res) => {
    try {
        const { pageNo, pageSize, stationId, nmiCode } = req.body;

        // Validation
        if (!pageNo) {
            return res.status(400).json({ error: "pageNo is required" });
        }
        if (!pageSize) {
            return res.status(400).json({ error: "pageSize is required" });
        }

        // Payload
        const payload = {
            pageNo,
            pageSize,
            stationId: stationId || null,
            nmiCode: nmiCode || null
        };

        console.log("EPM List Payload:", payload);

        // SolisCloud API call
        const result = await solisRequest("/v1/api/epmList", payload);

        res.json({
            message: "EPM list fetched successfully",
            solisData: result
        });

    } catch (err) {
        console.error("EPM List Error:", err);
        res.status(500).json({
            error: "Failed to fetch EPM list",
            details: err.message
        });
    }
});




export default router;
