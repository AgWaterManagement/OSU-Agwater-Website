/**
 * @typedef {'All' | 'Western OR' | 'Eastern OR'} Region
 */

/**
 * @typedef {'Streamside vegetation' | 'Cropland erosion' | 'Livestock management' | 'Manure management' | 'Irrigation' | 'Nutrients' | 'TMDL'} ConcernCategory
 */

/**
 * @typedef {Object} ConcernQuestion
 * @property {string} id
 * @property {ConcernCategory} category
 * @property {string} text
 */

/**
 * @typedef {'All Farms – Vegetation' | 'All Farms – Waterways' | 'All Farms – Water Flow & Storage' | 'All Farms – Fields' | 'All Farms – Road & Ditch' | 'Crop – Plans' | 'Crop – Vegetation' | 'Crop – Tillage' | 'Livestock – Grazing' | 'Livestock – Off‑stream Watering' | 'Livestock – Waste'} PracticeCategory
 */

/**
 * @typedef {Object} PracticeLink
 * @property {string} label
 * @property {string} url
 */

/**
 * @typedef {Object} Practice
 * @property {string} id
 * @property {string} title
 * @property {PracticeCategory} category
 * @property {string[]} helps
 * @property {string} ecosystemBenefits
 * @property {string} costs
 * @property {string} benefits
 * @property {PracticeLink[]} links
 * @property {ConcernCategory[]} tags
 * @property {Region[]} [regions]
 * @property {string[]} [tmdls]
 * @property {string} [complianceNotes]
 */

export {};
