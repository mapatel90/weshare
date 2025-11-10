'use client'
import React, { useState, useRef, useEffect } from 'react'
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
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const toggleDropdown = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(!isOpen)
    }

    return (
        <>
            <div className={`dropdown ${dropdownParentStyle} position-relative`} ref={dropdownRef}>
                {/* Dropdown Trigger */}
                {
                    tooltipTitle ?
                        <button type="button" className={`d-flex c-pointer border-0 bg-transparent ${isAvatar ? `avatar-text ${triggerClass}` : triggerClass}`} onClick={toggleDropdown} aria-expanded={isOpen}>
                            {triggerIcon || <FiMoreVertical />} {triggerText}
                        </button>
                        :
                        isAvatar ?
                            <button type="button" className={`avatar-text ${triggerClass} border-0 bg-transparent p-0`} onClick={toggleDropdown} aria-expanded={isOpen}>
                                {triggerIcon || <FiMoreVertical />} {triggerText}
                            </button>
                            :
                            <button type="button" className={`${triggerClass} border-0 bg-transparent p-0`} onClick={toggleDropdown} aria-expanded={isOpen}>
                                {triggerIcon || <FiMoreVertical />} {triggerText}
                            </button>
                }


                {/* Dropdown Menu */}
                <ul className={`dropdown-menu ${dropdownMenuStyle} ${dropdownPosition} ${isOpen ? 'show' : ''}`} style={{ position: 'absolute' }}>
                    {dropdownItems.map((item, index) => {
                        if (item.type === "divider") {
                            return <li className="dropdown-divider" key={index}></li>;
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
                                                    setIsOpen(false);
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
                                                    setIsOpen(false);
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
                </ul>
            </div>
        </>
    )
}

export default Dropdown