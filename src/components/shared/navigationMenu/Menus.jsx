'use client'
import React, { Fragment, useEffect, useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { menuList } from "@/utils/Data/menuList";
import getIcon from "@/utils/getIcon";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import usePermissions from "@/hooks/usePermissions";

const Menus = () => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openSubDropdown, setOpenSubDropdown] = useState(null);
    const [activeParent, setActiveParent] = useState("");
    const [activeChild, setActiveChild] = useState("");
    const pathName = usePathname();
    const { lang } = useLanguage();
    const { filterMenuByPermissions } = usePermissions();
    const handleMainMenu = (e, name) => {
        if (openDropdown === name) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(name);
        }
    };

    const handleDropdownMenu = (e, name) => {
        e.stopPropagation();
        if (openSubDropdown === name) {
            setOpenSubDropdown(null);
        } else {
            setOpenSubDropdown(name);
        }
    };

    useEffect(() => {
        if (pathName !== "/") {
            const pathSegments = pathName.split("/").filter(Boolean); // Remove empty strings

            // Check if path starts with /admin
            if (pathSegments[0] === "admin") {
                const parent = pathSegments[1];
                const child = pathSegments[2];

                setActiveParent(parent);
                setActiveChild(child);
                setOpenDropdown(parent);
                setOpenSubDropdown(child);
            } else {
                // For non-admin routes
                const parent = pathSegments[0];
                const child = pathSegments[1];

                setActiveParent(parent);
                setActiveChild(child);
                setOpenDropdown(parent);
                setOpenSubDropdown(child);
            }
        } else {
            // For root path
            setActiveParent("home");
            setOpenDropdown("home");
        }
    }, [pathName]);

    return (
        <>
            {filterMenuByPermissions(menuList).map(({ dropdownMenu, id, name, path, icon }) => {
                const menuKey = name.toLowerCase().replace(/\s+/g, '');
                // hasMenuAccess check removed - filterMenuByPermissions already handles this
                const isMenuActive = activeParent === menuKey || pathName === path || pathName.startsWith(`${path}/`);

                return (
                    <li
                        key={id}
                        onClick={(e) => handleMainMenu(e, menuKey)}
                        className={`nxl-item nxl-hasmenu ${isMenuActive ? "active nxl-trigger" : ""}`}
                    >
                        <Link href={path} className="nxl-link text-capitalize">
                            <span className="nxl-micon"> {getIcon(icon)} </span>
                            <span className="nxl-mtext" style={{ paddingLeft: "2.5px" }}>
                                {lang(`menu.${name.toLowerCase()}`, name)}
                            </span>
                            {dropdownMenu ? (
                                <span className={`nxl-arrow fs-16 nxl-item ${isMenuActive ? "active" : ""}`}>
                                    <FiChevronRight />
                                </span>
                            ) : null}
                        </Link>
                        <ul className={`nxl-submenu ${openDropdown === menuKey ? "nxl-menu-visible" : "nxl-menu-hidden"}`}>
                            {dropdownMenu && dropdownMenu.map(({ id, name, path, subdropdownMenu, target }) => {
                                const submenuKey = name.toLowerCase().replace(/\s+/g, '');
                                const isSubmenuActive = activeChild === submenuKey || pathName === path || pathName.startsWith(`${path}/`);

                                return (
                                    <Fragment key={id}>
                                        {subdropdownMenu && subdropdownMenu.length ? (
                                            <li
                                                className={`nxl-item nxl-hasmenu ${isSubmenuActive ? "active" : ""}`}
                                                onClick={(e) => handleDropdownMenu(e, submenuKey)}
                                            >
                                                <Link href={path} className={`nxl-link text-capitalize`}>
                                                    <span className="nxl-mtext">{lang(`menu.${submenuKey}`, name)}</span>
                                                    <span className="nxl-arrow">
                                                        <i>
                                                            {" "}
                                                            <FiChevronRight />
                                                        </i>
                                                    </span>
                                                </Link>
                                                {subdropdownMenu && subdropdownMenu.map(({ id, name, path }) => {
                                                    const subItemKey = name.toLowerCase().replace(/\s+/g, '');
                                                    const isSubItemActive = pathName === path || pathName.startsWith(`${path}/`);

                                                    return (
                                                        <ul
                                                            key={id}
                                                            className={`nxl-submenu ${openSubDropdown === submenuKey
                                                                ? "nxl-menu-visible"
                                                                : "nxl-menu-hidden "
                                                                }`}
                                                        >
                                                            <li
                                                                className={`nxl-item ${isSubItemActive ? "active" : ""}`}
                                                            >
                                                                <Link
                                                                    className="nxl-link text-capitalize"
                                                                    href={path}
                                                                >
                                                                    {lang(`menu.${subItemKey}`, name)}
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    );
                                                })}
                                            </li>
                                        ) : (
                                            <li className={`nxl-item ${isSubmenuActive ? "active" : ""}`}>
                                                <Link className="nxl-link" href={path} target={target}>
                                                    {lang(`menu.${submenuKey}`, name)}
                                                </Link>
                                            </li>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </ul>
                    </li>
                );
            })}
        </>
    );
};

export default Menus;
