import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const NewsSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const cards = [
    {
      title:
        "The Future Shines at Greenfield Academy with New Solar Initiative",
      delay: 0,
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60",
      alt: "Greenfield Academy",
    },
    {
      title: "Harnessing Solar Power: A Greener Tomorrow",
      delay: 150,
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60",
      alt: "",
    },
    {
      title: "Empowering Communities with Clean Energy",
      delay: 300,
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60",
      alt: "",
    },
    {
      title: "Solar Innovations Changing the World",
      delay: 450,
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60",
      alt: "",
    },
    {
      title: "Sustainable Living Starts with WeShare",
      delay: 600,
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60",
      alt: "",
    },
    {
      title: "Powering the Future, One Panel at a Time",
      delay: 750,
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60",
      alt: "",
    },
  ];

  return (
    <section className="news-section py-5">
      <div className="container">
        <div className="row g-4">
          {cards.map((c, i) => (
            <div
              key={i}
              className="col-md-6 col-lg-4 news-card"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay={c.delay}
            >
              <div className="card h-100 border-0 shadow-0">
                <img src={c.img} className="card-img-top" alt={c.alt} />
                <div className="card-body news-info">
                  <span className="date d-block mb-3">
                    <i className="fa-regular fa-calendar"></i> Sep 29, 2024
                  </span>
                  <h5 className="card-title news-title mb-3">{c.title}</h5>
                  <a
                    href="#"
                    className="btn btn-outline-dark readMore px-4 py-2 fw-semibold"
                  >
                    Read More <i className="fa-solid fa-arrow-right ms-2"></i>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <a
            href="#"
            className="btn load-more-btn btn-primary-custom d-inline-flex justify-content-center align-items-center"
          >
            Load More <i className="fa-solid fa-arrow-right ms-2"></i>
          </a>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
