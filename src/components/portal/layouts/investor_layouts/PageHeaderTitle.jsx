'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight } from 'lucide-react';

const PageHeaderTitle = () => {
    const pathName = usePathname();
    const { lang } = useLanguage();

    const parts = pathName.split("/").filter(Boolean);
    const pageKey = parts[parts.length - 1] || lang("page_title.dashboard", "Dashboard");

    const pageName = lang(`menu.${pageKey}`, pageKey.replace(/-/g, " "));
    let title = lang("page_title.dashboard", "Dashboard");
    let breadcrumb = [];


    // Special case for /investor/projects/details/:id
    if (
        parts.length >= 4 &&
        parts[0] === "investor" &&
        parts[1] === "projects" &&
        parts[2] === "details"
    ) {
        title = "Project details";
        breadcrumb = [
            { name: lang("menu.projects", "Project"), href: "/investor/projects" },
            { name: lang("menu.details", "Details"), href: null }
        ];
    } else if (
        parts.length >= 4 &&
        parts[0] === "investor" &&
        parts[1] === "contracts" &&
        parts[2] === "details"
    ) {
        title = lang("page_title.contract_details", "Contract details");
        breadcrumb = [
            { name: lang("menu.contracts", "Contract"), href: "/investor/contracts" },
            { name: lang("menu.details", "Details"), href: null }
        ];
    } else if (
        parts.length >= 4 &&
        parts[0] === "investor" &&
        parts[1] === "payouts" &&
        parts[2] === "view"
    ) {
        title = lang("payouts.payout_details", "Payout Details");
        breadcrumb = [
            { name: lang("menu.payouts", "Payouts"), href: "/investor/payouts" },
            { name: lang("payouts.payout_details", "Payout Details"), href: null }
        ];
    }
    else if (
        parts.length >= 2 &&
        parts[0] === "investor" &&
        parts[1] === "myprofile"
    ) {
        title = lang("page_title.profile", "Profile");
        breadcrumb = [
            { name: title, href: "/investor/myprofile" }
        ];
    }
    else {
        const pageKey = parts[parts.length - 1] || "dashboard";
        const pageName = lang(`menu.${pageKey}`, pageKey.replace(/-/g, " "));
        title = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        breadcrumb = [
            { name: lang("page_title.dashboard", "Dashboard"), href: "/investor/dashboard" },
            { name: title, href: null }
        ];
    }

    return (
        <div className="header-wrapper">
            <div className="header-left">
                {/* Main title */}
                <h3 className="header-title">{title}</h3>

                {/* Vertical separator */}
                <span className="divider">|</span>

                {/* Breadcrumb */}
                <div className="breadcrumb-offtaker">
                    {breadcrumb.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <ChevronRight className="w-4 h-4" />}
                            {item.href ? (
                                <Link href={item.href} className="breadcrumb-link">
                                    {item.name}
                                </Link>
                            ) : (
                                <span className="breadcrumb-current text-capitalize">{item.name}</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE (Buttons placeholder) */}
            <div className="header-right"></div>
        </div>
    );
};

export default PageHeaderTitle;
