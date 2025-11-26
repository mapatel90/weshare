import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Load only on client side
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    document.title = "Weshare | API";
    fetch("/openapi.json")
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>API Documentation</h2>
      {spec ? <SwaggerUI spec={spec} /> : "Loading..."}
    </div>
  );
}
