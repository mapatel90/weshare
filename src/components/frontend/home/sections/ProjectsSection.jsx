"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AOS from "aos";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet } from "@/lib/api";
import { getFullImageUrl } from "@/utils/common";
import { useRouter } from "next/navigation";

const ProjectsSection = () => {
  const [activeTab, setActiveTab] = useState("open");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const router = useRouter();
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiGet("/api/projects?limit=3&status=1", {
        showLoader: false,
      });
      if (response.success && response.data?.projects) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="projectSection">
      <div className="container">
        <div className="headerSection mb-40" data-aos="fade-up">
          <ul className="nav nav-pills mb-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "open" ? "active" : ""}`}
                onClick={() => setActiveTab("open")}
                type="button"
              >
                <span className="circle"></span>{" "}
                {lang("home.projects.openForLease")}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "resale" ? "active" : ""}`}
                onClick={() => setActiveTab("resale")}
                type="button"
              >
                <span className="circle"></span>{" "}
                {lang("home.projects.forResale")}
              </button>
            </li>
          </ul>
        </div>

        <div className="tab-content">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center">
              <p className="text-muted">
                {lang("home.projects.noProjects") || "No projects available"}
              </p>
            </div>
          ) : (
            <div className="row">
              {projects.map((project, index) => {
                const cityName = project.city?.name || "";
                const stateName = project.state?.code || "";
                const location =
                  [cityName, stateName].filter(Boolean).join(", ") ||
                  "Location Not Available";

                return (
                  <div
                    key={project.id}
                    className="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0"
                    data-aos="fade-up"
                    data-aos-duration={1000 + index * 200}
                  >
                    <div className="project-card shadow-sm overflow-hidden">
                      <div className="project-items">
                        <Image
                          src={getFullImageUrl(project?.project_image)}
                          alt={project.project_name}
                          className="img-fluid project-img"
                          width={400}
                          height={250}
                          onError={(e) => {
                            e.target.src = "/images/projects/project-img1.png";
                          }}
                        />
                      </div>

                      <div className="pt-3">
                        <h5
                          className="fw-600 mb-2 text-title"
                          style={{
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            textOverflow: "ellipsis",
                            // maxWidth: '70%',
                            height: "60px",
                          }}
                        >
                          {project.project_name}
                        </h5>
                        <div className="d-flex align-items-center text-muted small mb-3 fw-300">
                          <span className="me-1">
                            <Image
                              src="/images/icons/location.svg"
                              alt="location"
                              width={16}
                              height={16}
                            />
                          </span>
                          {location}
                          <span className="mx-2"></span>
                          <span className="me-1">
                            <Image
                              src="/images/icons/light.svg"
                              alt="capacity"
                              width={16}
                              height={16}
                            />
                          </span>
                          {project.project_size
                            ? `${project.project_size}kwp`
                            : "N/A"}
                        </div>

                        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                          <div className="w-45 caterogy-items">
                            <h6 className="mb-0 fw-600 text-title">N/A</h6>
                            <small className="text-muted">
                              {lang("home.projects.kwhGenerated")}
                            </small>
                          </div>
                          <div className="w-45 caterogy-items items-2">
                            <h6 className="mb-0 fw-600 text-title secondaryTextColor">
                              {project.investor_profit || "0"}%
                            </h6>
                            <small className="text-muted">
                              {lang("home.projects.roi")}
                            </small>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <p className="fw-300 mb-0 text-black">
                            {lang("home.projects.expectedRevenue")}
                          </p>
                          <span className="fw-600 text-secondary-color">
                            ${project.asking_price || "0"}
                          </span>
                        </div>

                        <button
                          className="btn btn-primary-custom mt-4 w-100"
                          style={{ display: "flex" }}
                          onClick={() => router.push(`/exchange-hub/${project.id}`)}
                        >
                          <Image
                            className="me-2"
                            src="/images/icons/reports-icon.svg"
                            alt="view"
                            width={20}
                            height={20}
                          />
                          {lang("home.projects.viewDetails")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {projects.length != 0 ? (
            <div
              className="d-block mt-40 text-center"
              data-aos="fade-up"
              data-aos-duration="1500"
            >
              <Link href="/exchange-hub">
                <button className="btn btn-primary-custom mt-3 transparentBtn text-primary border-1">
                  {lang("home.projects.loadMore")}
                </button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
