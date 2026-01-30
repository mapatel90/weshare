import { apiPost } from "@/lib/api";

/**
 * Generate a URL-friendly slug from text
 * @param {string} text - The text to convert to slug
 * @returns {string} - The generated slug
 */
export function generateSlug(text) {
  if (!text) return "";

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Normalize any project_images payload (array or JSON string) into an array
 * @param {any} images - The project_images payload
 * @returns {Array} - Array of image objects
 */
export function normalizeProjectImages(images) {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Resolve the primary gallery image path/url for a project
 * @param {object} project - Project object
 * @returns {string} - Relative/absolute image path or empty string
 */
export function getPrimaryProjectImage(project) {
  if (!project) return "";
  const candidates = [
    project.project_images,
    project.project?.project_images,
    project.projectImages,
    project.images,
  ];

  let gallery = [];
  for (const collection of candidates) {
    const normalized = normalizeProjectImages(collection);
    if (normalized.length) {
      gallery = normalized;
      break;
    }
  }

  if (!gallery.length) return "";

  const isDefault = (img) => {
    const flag =
      img?.default ??
      img?.is_default ??
      img?.isDefault ??
      img?.isDefaultImage ??
      0;
    return Number(flag) === 1;
  };

  const defaultImage = gallery.find(isDefault);
  const chosen = defaultImage || gallery[0];

  return (
    chosen?.path ??
    chosen?.url ??
    chosen?.image ??
    chosen?.src ??
    ""
  );
}

/**
 * Check if project name already exists
 * @param {string} projectName - The project name to check
 * @param {number|null} projectId - The current project ID (for edit mode)
 * @returns {Promise<boolean>} - True if name exists, false otherwise
 */
export async function checkProjectNameExists(projectName, projectId = null) {
  if (!projectName) return false;

  try {
    const response = await apiPost(
      "/api/projects/check-name",
      {
        project_name: projectName,
        project_id: projectId,
      },
      {
        showLoader: false,
      }
    );

    return !!response?.exists;
  } catch (error) {
    console.error("Error checking project name:", error);
    return false;
  }
}
export async function check_project_solis_plant_id_exists(projectId = null, solis_plant_id) {
  if (!solis_plant_id) return false;

  try {
    const response = await apiPost(
      "/api/projects/check-plant-id",
      {
        solis_plant_id: solis_plant_id,
        project_id: projectId,
      },
      {
        showLoader: false,
      }
    );

    return !!response?.exists;
  } catch (error) {
    console.error("Error checking project name:", error);
    return false;
  }
}
