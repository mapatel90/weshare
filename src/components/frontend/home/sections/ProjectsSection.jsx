"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AOS from "aos";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet } from "@/lib/api";
import ProjectCard from "@/components/frontend/exchange-hub/ProjectCard";
import { PROJECT_STATUS } from "@/constants/project_status";

const ProjectsSection = () => {
  const [activeTab, setActiveTab] = useState("open");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Fetch projects when tab changes
  useEffect(() => {
    fetchProjects(activeTab);
  }, [activeTab]);

  const fetchProjects = async (tab) => {
    try {
      setLoading(true);
      // Open for Lease = UPCOMING, For Resale = RUNNING
      const statusId = tab === "open" ? PROJECT_STATUS.UPCOMING : PROJECT_STATUS.RUNNING;
      const response = await apiGet(`/api/projects?limit=3&project_status_id=${statusId}`, { showLoader: false });
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
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
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    activeTab={activeTab === "open" ? "lease" : "resale"}
                    isHome={true}
                  />
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
              <Link href="/frontend/exchange-hub">
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
