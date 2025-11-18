"use client";

import React, { useState, useEffect } from "react";
import { KeyboardArrowUp } from "@mui/icons-material";

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  // Show button when scroll > 300px
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 300) setVisible(true);
      else setVisible(false);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {visible && (
        <button
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "25px",
            right: "25px",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "#0A775F",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
          }}
        >
          <KeyboardArrowUp style={{ fontSize: "28px" }} />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;
