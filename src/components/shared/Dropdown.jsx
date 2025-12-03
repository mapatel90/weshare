'use client'
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Checkbox from './Checkbox';
import { FiMoreVertical } from 'react-icons/fi';
import Link from 'next/link';

const Dropdown = ({
    triggerPosition,
    triggerClass = "avatar-sm",
    triggerIcon,
    triggerText,
    dropdownItems = [],
    dropdownPosition = "dropdown-menu-end",
    dropdownAutoClose,
    dropdownParentStyle,
    dataBsToggle = "modal",
    tooltipTitle,
    dropdownMenuStyle,
    iconStrokeWidth = 1.7,
    isItemIcon = true,
    isAvatar = true,
    onClick,
    active,
    id
}) => {
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState({ left: 0, top: 0, transformOrigin: "top left" });

    useEffect(() => {
        function onDocClick(e) {
            if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
                setOpen(false);
            }
        }
        function onScrollResize() {
            setOpen(false); // close on scroll/resize to avoid mis-positioning
        }
        document.addEventListener("click", onDocClick);
        window.addEventListener("scroll", onScrollResize, true);
        window.addEventListener("resize", onScrollResize);
        return () => {
            document.removeEventListener("click", onDocClick);
            window.removeEventListener("scroll", onScrollResize, true);
            window.removeEventListener("resize", onScrollResize);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const trig = triggerRef.current;
        const menu = menuRef.current;
        if (!trig || !menu) return;

        // measure trigger position
        const rect = trig.getBoundingClientRect();
        // ensure menu is rendered so we can measure its height
        requestAnimationFrame(() => {
            const menuHeight = menu.scrollHeight || 200;
            const menuWidth = menu.scrollWidth || 200;

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const dropUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

            // compute left (try to keep within viewport)
            let left = rect.left;
            if (left + menuWidth > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - menuWidth - 8);
            }

            const top = dropUp ? Math.max(8, rect.top - menuHeight) : Math.min(window.innerHeight - menuHeight - 8, rect.bottom);

            setMenuStyle({
                left,
                top,
                transformOrigin: dropUp ? "bottom left" : "top left",
            });
        });
    }, [open]);

    const toggle = (e) => {
        e.stopPropagation();
        setOpen((v) => !v);
    };

    const onItemClick = async (it) => {
        if (it.onClick) await it.onClick();
        setOpen(false);
    };

    return (
        <>
            <div className={`dropdown ${dropdownParentStyle} position-relative`} ref={triggerRef}>
                {/* Dropdown Trigger */}
                {
                    tooltipTitle ?
                        <button type="button" className={`d-flex c-pointer border-0 bg-transparent ${isAvatar ? `avatar-text ${triggerClass}` : triggerClass}`} onClick={toggle} aria-expanded={open}>
                            {triggerIcon || <FiMoreVertical />} {triggerText}
                        </button>
                        :
                        isAvatar ?
                            <button type="button" className={`avatar-text ${triggerClass} border-0 bg-transparent p-0`} onClick={toggle} aria-expanded={open}>
                                {triggerIcon || <FiMoreVertical />} {triggerText}
                            </button>
                            :
                            <button type="button" className={`${triggerClass} border-0 bg-transparent p-0`} onClick={toggle} aria-expanded={open}>
                                {triggerIcon || <FiMoreVertical />} {triggerText}
                            </button>
                }


                {/* Dropdown Menu */}
                {open && (
                    <div
                        ref={menuRef}
                        className="dropdown-menu show"
                        style={{
                            position: "fixed",
                            left: menuStyle.left,
                            top: menuStyle.top,
                            zIndex: 1200,
                            minWidth: 160,
                            boxShadow: "0 6px 12px rgba(0,0,0,0.12)",
                            background: "#fff",
                            borderRadius: 6,
                            padding: "6px 0",
                            transformOrigin: menuStyle.transformOrigin,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {dropdownItems.map((item, index) => {
                            if (item.type === "divider") {
                                return <div key={`d-${index}`} className="dropdown-divider" style={{ height: 1, margin: "6px 0", background: "#e9ecef" }} />;
                            }
                            return (
                                <li key={index} className={`${item.checkbox ? "dropdown-item" : ""}`}>
                                    {
                                        item.checkbox ?
                                            <Checkbox checked={item.checked} id={item.id} name={item.label} className={""} />
                                            :

                                            // If item has an onClick handler, render a clickable anchor and call it (prevent default navigation)
                                            (item.onClick ? (
                                                <a href="#" className={`${active === item.label ? "active" : ""} dropdown-item`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setOpen(false);
                                                        item.onClick();
                                                        onClick && onClick(item.label, id);
                                                    }}
                                                    data-bs-toggle={item.modalTarget ? dataBsToggle : undefined} data-bs-target={item.modalTarget}
                                                >
                                                    {
                                                        isItemIcon ?
                                                            item.icon && React.cloneElement(item.icon, { className: "me-3", size: 16, strokeWidth: iconStrokeWidth })
                                                            :
                                                            <span className={`wd-7 ht-7 rounded-circle me-3 ${item.color}`}></span>
                                                    }
                                                    <span>{item.label}</span>
                                                </a>
                                            ) : (
                                                <Link href={item.link || "#"} className={`${active === item.label ? "active" : ""} dropdown-item`}
                                                    data-bs-toggle={item.link || dataBsToggle} data-bs-target={item.modalTarget}
                                                    onClick={(e) => {
                                                        setOpen(false);
                                                        onClick && onClick(item.label, id);
                                                    }}
                                                >
                                                    {
                                                        isItemIcon ?
                                                            item.icon && React.cloneElement(item.icon, { className: "me-3", size: 16, strokeWidth: iconStrokeWidth })
                                                            :
                                                            <span className={`wd-7 ht-7 rounded-circle me-3 ${item.color}`}></span>
                                                    }
                                                    <span>{item.label}</span>
                                                </Link>
                                            ))
                                    }
                                </li>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

Dropdown.propTypes = {
    dropdownItems: PropTypes.array,
    triggerClass: PropTypes.string,
    triggerIcon: PropTypes.node,
    triggerLabel: PropTypes.node,
};

export default Dropdown