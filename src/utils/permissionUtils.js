export const PERMISSION_KEYS = ["view", "create", "edit", "delete"];

/**
 * Extract modules with their specific permission actions
 * @param {Array} menuList - Menu list
 * @param {Array} modules - Result array
 * @returns {Array} - [{ module: "dashboards", actions: ["view"] }, { module: "users", actions: ["view", "create", "edit", "delete"] }]
 */
export const extractModulesWithActions = (menuList, modules = []) => {
  for (const menu of menuList) {
    // Jo dropdown nathi (leaf level) and permission che
    if (!Array.isArray(menu.dropdownMenu) && menu.permission) {
      modules.push({
        module: menu.permission,
        // Jo permissions array defined nathi to default PERMISSION_KEYS use karo
        actions: menu.permission_action || PERMISSION_KEYS,
      });
    }

    // Dropdown ma recursive check
    if (Array.isArray(menu.dropdownMenu)) {
      extractModulesWithActions(menu.dropdownMenu, modules);
    }

    // Subdropdown ma recursive check
    if (Array.isArray(menu.subdropdownMenu)) {
      extractModulesWithActions(menu.subdropdownMenu, modules);
    }
  }
  return modules;
};

/**
 * Old function - for backward compatibility
 * Extract all module names only (without actions)
 */
export const extractModules = (menuList, modules = []) => {
  for (const menu of menuList) {
    if (menu.permission) {
      modules.push(menu.permission);
    }

    if (Array.isArray(menu.dropdownMenu)) {
      extractModules(menu.dropdownMenu, modules);
    }

    if (Array.isArray(menu.subdropdownMenu)) {
      extractModules(menu.subdropdownMenu, modules);
    }
  }
  return modules;
};

/**
 * Check kare che ke user ne given module nu view permission che ke nahi
 * @param {Object} userPermissions - User na permissions object { module: { view: true, edit: false, ... } }
 * @param {String} module - Module name (e.g., "projects", "project_type")
 */
export const hasModuleAccess = (userPermissions, module) => {
  if (!userPermissions || !userPermissions[module]) return false;
  return userPermissions[module]?.view === true;
};

/**
 * Check kare che ke dropdown menu ma thi koi ek item nu view permission che ke nahi
 * @param {Array} dropdownMenu - Dropdown menu items
 * @param {Object} userPermissions - User na permissions
 */
export const hasAnyChildPermission = (dropdownMenu, userPermissions) => {
  if (!Array.isArray(dropdownMenu) || !userPermissions) return false;

  for (const item of dropdownMenu) {
    // Check direct permission
    if (item.permission && hasModuleAccess(userPermissions, item.permission)) {
      return true;
    }

    // Check subdropdown recursively
    if (Array.isArray(item.subdropdownMenu)) {
      if (hasAnyChildPermission(item.subdropdownMenu, userPermissions)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Menu list filter kare che user permissions pramane
 * Parent menu tyare j show thay jyare koi ek child accessible hoy
 * 
 * Example:
 * - Projects menu show thase jo user ne "projects" OR "project_type" ma view permission hoy
 * - Inverter menu show thase jo user ne "inverter_type" OR "inverter_company" OR "inverter_list" ma view permission hoy
 * 
 * @param {Array} menuList - Full menu list
 * @param {Object} userPermissions - User na permissions { projects: { view: true }, project_type: { view: false } }
 * @returns {Array} - Filtered menu list
 */
export const filterMenuByPermissions = (menuList, userPermissions) => {
  if (!userPermissions) return [];

  return menuList
    .map((menu) => {
      // Jo dropdown menu nathi (single item like dashboards, users, etc.)
      if (!Array.isArray(menu.dropdownMenu)) {
        // Direct permission check
        if (hasModuleAccess(userPermissions, menu.permission)) {
          return menu;
        }
        return null;
      }

      // Jo dropdown menu che (like projects, inverter, settings, etc.)
      // Check karo ke koi child accessible che ke nahi
      if (hasAnyChildPermission(menu.dropdownMenu, userPermissions)) {
        // Filter dropdown items pan - ফક্ત accessible children j rakhvana
        const filteredDropdown = menu.dropdownMenu
          .map((dropItem) => {
            // Check subdropdown
            if (Array.isArray(dropItem.subdropdownMenu)) {
              if (hasAnyChildPermission(dropItem.subdropdownMenu, userPermissions)) {
                const filteredSubdropdown = dropItem.subdropdownMenu.filter(
                  (subItem) => hasModuleAccess(userPermissions, subItem.permission)
                );
                return { ...dropItem, subdropdownMenu: filteredSubdropdown };
              }
              return null;
            }

            // Direct permission check for dropdown item
            if (hasModuleAccess(userPermissions, dropItem.permission)) {
              return dropItem;
            }
            return null;
          })
          .filter(Boolean);

        // Return parent with filtered children
        return { ...menu, dropdownMenu: filteredDropdown };
      }

      // Koi child accessible nathi - parent hide
      return null;
    })
    .filter(Boolean);
};
