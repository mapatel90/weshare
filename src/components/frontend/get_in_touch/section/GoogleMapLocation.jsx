"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export default function GoogleMapLocation() {
  const [mapData, setMapData] = useState(null);

  const fetchMap = async () => {
    try {
      const response = await apiGet("/api/settings/");
      if (response?.data) {
        setMapData(response.data);
      }
    } catch (error) {
      console.error("Error fetching map settings:", error);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  return (
    <iframe
      src={mapData?.site_map_url}
      allowFullScreen={true}
      loading="lazy">
    </iframe>
  );
}