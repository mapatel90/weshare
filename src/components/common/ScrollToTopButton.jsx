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
          className="scrollToTopBtn"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <KeyboardArrowUp className="scrollToTopIcon" />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;
