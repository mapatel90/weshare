"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  MapPin,
  Filter,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const statusDictionary = {
  0: "Under Installation",
  1: "Upcoming",
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatNumber = (value) => {
  if (!value && value !== 0) return "—";
  const number = Number(value);
  return Number.isNaN(number) ? value : number.toLocaleString("en-US");
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isNaN(number) ? `${value}` : `${number}%`;
};

const normalizeApiProject = (project) => {
  const formatDateForDisplay = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    // show as DD/MM/YYYY
    return d.toLocaleDateString("en-GB");
  };

  const tsOrZero = (iso) => {
    if (!iso) return 0;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? 0 : t;
  };

  const statusString =
    statusDictionary[project?.status] ?? project?.status ?? "Upcoming";
  // map display status to numeric filter codes: Upcoming => 1, Under Installation => 0
  const statusCode =
    statusString === "Upcoming"
      ? 1
      : statusString === "Under Installation"
        ? 0
        : project?.status ?? null;
  return {
    id: project?.id ? `#${project.id}` : project?.project_code ?? "—",
    project_image: project?.project_image,
    projectName: project?.project_name ?? "—",
    status: statusString,
    statusCode,
    expectedROI: formatPercent(project?.expected_roi ?? project?.roi),
    targetInvestment: formatCurrency(project?.asking_price ?? project?.asking_price),
    paybackPeriod: project?.lease_term ? String(project.lease_term) : "—",
    startDate: formatDateForDisplay(project?.createdAt),
    endDate: formatDateForDisplay(project?.project_close_date),
    startDateTs: tsOrZero(project?.createdAt),
    endDateTs: tsOrZero(project?.project_close_date),
    expectedGeneration: formatNumber(project?.project_size),
    offtakerId: project?.offtaker_id ?? null,
    product_code: project?.product_code ?? '-',
    offtaker_name: project?.offtaker?.fullName ?? '-',
    project_slug: project?.project_slug ?? '',
  };
};

const ProjectTable = () => {
  return (
    <div className="min-h-full from-slate-50 to-slate-100">
      <div className="mx-auto">
        <p>List Of Projects</p>
      </div>
    </div>
  );
};

export default ProjectTable;
