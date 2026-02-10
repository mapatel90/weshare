export const PERMISSION_KEYS = ["view", "create", "edit", "delete"];

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
