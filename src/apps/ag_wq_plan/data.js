/**
 * Legacy seed data for the ag_wqplan import script.
 * The planner runtime now loads concern questions and practices from the API.
 */
/**
 * @typedef {import('./types').ConcernQuestion} ConcernQuestion
 * @typedef {import('./types').Practice} Practice
 */

/**
 * @type {ConcernQuestion[]}
 */
export const concernQuestions = [
  {
    id: 'q-stream-bare-soil',
    category: 'Streamside vegetation',
    text: 'Are there areas of bare soil along streams?',
  },
  {
    id: 'q-stream-erosion',
    category: 'Streamside vegetation',
    text: 'Are streambanks slumping or eroding?',
  },
  {
    id: 'q-stream-weeds',
    category: 'Streamside vegetation',
    text: 'Is streamside vegetation mostly weeds (blackberries or reed canary grass)?',
  },
  {
    id: 'q-crop-sheet-rill',
    category: 'Cropland erosion',
    text: 'Do pastures and croplands have areas of sheet and rill erosion from cropland?',
  },
  {
    id: 'q-crop-concentrated-flow',
    category: 'Cropland erosion',
    text: 'Are there concentrated flow areas causing erosion?',
  },
  {
    id: 'q-livestock-groundcover',
    category: 'Livestock management',
    text: 'Does livestock utilization allow groundcover to establish?',
  },
  {
    id: 'q-manure-near-stream',
    category: 'Manure management',
    text: 'Is manure stored on site, bare ground or near streams?',
  },
  {
    id: 'q-irrigation-overland-flow',
    category: 'Irrigation',
    text: 'Is irrigation resulting in overland flow?',
  },
  {
    id: 'q-nutrients-how-much-fertilizer',
    category: 'Nutrients',
    text: 'How much fertilizer does my pasture need?',
  },
  {
    id: 'q-tmdl-area-concerns',
    category: 'TMDL',
    text: 'What are TMDLs in my area?',
  },
];

/**
 * @type {Practice[]}
 */
export const practices = [
  {
    id: 'A1',
    title:
      'Increase vegetation in riparian areas along streams and in wetlands. Include trees and tall shrubs for shading perennial streams.',
    category: 'All Farms – Vegetation',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrients',
      'Bacteria',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Increased time/cost to plant and maintain native, site capable vegetation and remove/prevent invasive vegetation. Increase in wildlife conflicts. Decrease in farmable land.',
    benefits:
      'Retention of land along streams, increased wildlife and fish habitat, stream bank stabilization. Financial incentives available to install and maintain for 5–10 years, depending on program and amount of land dedicated to project.',
    links: [
      {
        label: 'ODA – Streamside Vegetation: Good for People, Plants and Animals',
        url: 'https://www.oregon.gov/oda/Documents/Publications/naturalresources/Streamsidevegetation.pdf',
      },
      {
        label: 'OSU Ext – Streams and Riparian Areas: Clean Water, Diverse Habitat',
        url: 'https://extension.oregonstate.edu/catalog/pub/em-9244-streams-riparian-areas-clean-water-diverse-habitat',
      },
    ],
    tags: ['Streamside vegetation', 'Cropland erosion'],
    tmdls: ['Willamette Basin Temperature TMDL', 'Willamette Basin Dissolved Oxygen TMDL'],
    complianceNotes: 'Required in certain riparian compliance zones. Consult with ODA for specific requirements in your area.',
  },
  {
    id: 'A3',
    title:
      'Establish/expand vegetated filter strip and enhance vegetated field borders to reduce soil erosion.',
    category: 'All Farms – Vegetation',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrients',
      'Bacteria',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Promote vegetation between field activity and streams, ponds, springs, and wetlands. Vegetation to include mowable grasses, sedges, rushes, depending on design and site characteristics. Strip contoured for sheet flow (not concentrated flow) to filter sediment.',
    costs:
      'Increases time/cost for maintaining vegetation (grass) and slope of filter strip (e.g., mow/maintain grasses to compete with weeds). Decreases farmable land if not currently used along streams.',
    benefits:
      'Decreases costs of maintaining drainage ditches and infrastructure due to reduced sediment delivery. Financial incentives typically available for establishment or expansion (not regular maintenance).',
    links: [
      {
        label: 'ODA – Field Borders',
        url: 'https://www.oregon.gov/oda/Documents/Publications/naturalresources/FieldBordersAgWaterQuality.pdf',
      },
      {
        label: 'NRCS 393 – Filter Strip',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Filter_Strip_393_CPS.pdf',
      },
    ],
    tags: ['Cropland erosion', 'Streamside vegetation'],
    tmdls: ['Willamette Basin Sediment TMDL'],
    complianceNotes: 'Recommended for fields adjacent to waterways to meet sediment reduction goals.',
  },
  {
    id: 'C1',
    title: 'Nutrient and Pest Management',
    category: 'Crop – Plans',
    helps: ['Nutrients', 'Pesticides', 'pH'],
    ecosystemBenefits:
      'Maximizes nutrient uptake efficiency, water infiltration, soil-water holding capacity and carbon sequestration, while minimizing soil compaction, nutrient and pollutant losses (leaching, volatilization).',
    costs: 'Increased time/costs for taking samples and analysis.',
    benefits:
      'Improved yield and crop health, decreased costs of nutrients and lime. Funding assistance for overall farm plan and implementation may be available.',
    links: [
      {
        label: 'OSU Ext – Fertilizing with Manure and Other Organic Amendments',
        url: 'https://extension.oregonstate.edu/catalog/pub/pnw-533-fertilizing-manure-other-organic-amendments',
      },
      {
        label: 'NRCS 590 – Nutrient Management',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/nutrient-management-ac-590-conservation-practice-standard',
      },
    ],
    tags: ['Nutrients'],
    tmdls: ['Willamette Basin Nutrient TMDL'],
    complianceNotes: 'Soil testing and nutrient plan required in some nutrient-impaired basins. Contact local SWCD for requirements.',
  },
  {
    id: 'C3',
    title: 'Cover and Conservation Crops',
    category: 'Crop – Vegetation',
    helps: [
      'Sediment',
      'TSS',
      'Nutrients',
      'Pollutants bound to sediment',
      'Bacteria',
    ],
    ecosystemBenefits:
      'Reduce dissolved nutrients and pollutants (e.g., nitrates). Minimize surface erosion and soil compaction, increase soil organic matter, soil water retention and infiltration, and nutrient uptake, and bind pollutants.',
    costs: 'Increased time/costs for planting and maintenance.',
    benefits:
      'Reduce weed pressure and reduce crop resistance to pesticides. Cover crops can improve long-term soil health and resilience.',
    links: [
      {
        label: 'SARE – Cover Crop Economics',
        url: 'https://www.sare.org/resources/cover-crop-economics/',
      },
      {
        label: 'NRCS 340 – Cover Crop',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/cover-crop-ac-340-conservation-practice-standard',
      },
    ],
    tags: ['Cropland erosion', 'Nutrients'],
  },
  {
    id: 'A2',
    title: 'Stream corridor, water conveyance, channel bank stability improvement.',
    category: 'All Farms – Vegetation',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Costs for permitting, installation and maintenance; Increased time/cost to plant and maintain native, site capable vegetation and remove/prevent invasive vegetation. Increase in wildlife conflicts. Decrease in farmable land.',
    benefits:
      'Retention of land along streams, increased wildlife and fish habitat, stream bank stabilization. Financial incentives and grant programs focus on fish and wildlife habitat and water quality benefits. Financial incentives available to install and maintain for 5-10 years, depending on program and amount of land dedicated to project.',
    links: [
      {
        label: 'OSU Ext – Walking the Streambank: Living on the Land Podcast',
        url: 'https://extension.oregonstate.edu/podcast/living-land/walking-stream-bank',
      },
      {
        label: 'NRCS 395 – Stream habitat improvement and Management',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-10/Stream_Habitat_Improvement_And_Management_395_PO.pdf',
      },
      {
        label: 'NRCS 580 – Streambank and Shoreline Protection',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-10/Streambank_Shoreline_Protection_580_CPS_10_2020.pdf',
      },
      {
        label: 'NRCS 612 – Tree-Shrub Establishment',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-12/612-NHCP-CPS-Tree-Shrub-Establishment-2022.pdf',
      },
    ],
    tags: ['Streamside vegetation'],
  },
  {
    id: 'A4',
    title: 'Create two-stage drainage ditch/stream channel.',
    category: 'All Farms – Waterways',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Increased time/cost to establish (could be integrated with ditch cleaning). May increase time/cost to maintain vegetation (grass) in waterway depending on management goals (e.g., mow and maintain grasses to compete with reed canary grass and other weeds). May decrease farmable land if additional width is needed for side-slopes.',
    benefits:
      'Decrease time/cost maintaining ditches depending on current practices. Financial incentives typically available for establishment (not regular maintenance). Allows for maintaining tile drain outlets. Decreases cost of ditch cleaning/maintenance due to efficient drainage design.',
    links: [
      {
        label: 'NRCS – Part 654 National Engineering Handbook Chapter 10: Two-Stage Channel Design',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/part-654-national-engineering-handbook',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'A5',
    title: 'Stream and Ditch Maintenance',
    category: 'All Farms – Waterways',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction.',
    costs:
      'May increase time/cost to maintain vegetation (grass) in waterway depending on management goals (e.g., mow and maintain grasses to compete with reed canary grass and other weeds).',
    benefits:
      'Decrease time/cost maintaining ditches depending on current practices.',
    links: [
      {
        label: 'ODA – Guidance for Stream and Ditch Maintenance',
        url: 'https://www.oregon.gov/oda/Documents/Publications/naturalresources/StreamsideAreas.pdf',
      },
      {
        label: 'NRCS 607 – Surface Drain, Field Ditch',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-10/Surface_Drain_Field_Ditch_607_CPS_9_2020.pdf',
      },
      {
        label: 'NRCS 423 – Hillside Ditch',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/423_NHCP_CPS_Hillside_Ditch_2021_0.pdf',
      },
      {
        label: 'NRCS 388 – Field Ditch',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Irrigation_Field_Ditch_388_CPS_10_2020.pdf',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'A6',
    title: 'Establish/Expand a grassed waterway.',
    category: 'All Farms – Water Flow & Storage',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce field & streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'May increase time/cost to maintain vegetation (grass) in waterway depending on management goals (e.g., mow and maintain grasses to compete with reed canary grass and other weeds). May decrease farmable land if additional width is needed for side-slopes.',
    benefits:
      'Decrease time/cost maintaining ditches depending on current practices. Decrease cost of weed control. Decrease cost of erosion control. Financial incentives typically available for establishment or expansion (not regular maintenance). Keeps ability to maintain tile drain outlets.',
    links: [
      {
        label: 'NRCS 412 – Grassed Waterway',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Grassed_Waterway_412_CPS.pdf',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'A7',
    title: 'Water Retention Systems - Retention pond, sediment basins, catch basins, sediment traps, and berms, dikes, and levees.',
    category: 'All Farms – Water Flow & Storage',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, and filter pollutants from runoff. If reducing storm flows, may reduce streambank erosion, prevent surface erosion, and increase infiltration.',
    costs:
      'Increase cost to establish and maintain - to include removing and spreading or hauling off sediment. May not decrease farmable land.',
    benefits:
      'Decreased costs of maintaining drainage ditches and infrastructure because it concentrates sediment delivery into one or fewer places. Financial incentives typically available for establishment (not regular maintenance).',
    links: [
      {
        label: 'NRCS 554 – Drainage Water Management',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/drainage-water-management-ac-554-conservation-practice-standard',
      },
      {
        label: 'NRCS 587 – Structure for water control',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/structure-for-water-control-ac-587-conservation-practice-standard',
      },
      {
        label: 'NRCS 350 – Sediment basin',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/sediment-basin-ac-350-conservation-practice-standard',
      },
    ],
    tags: ['Nutrients'],
  },
  {
    id: 'A8',
    title: 'Siphon or other cold water overflow for reservoirs. Aerators (e.g., bubblers, fountains) to add oxygen to reservoirs.',
    category: 'All Farms – Water Flow & Storage',
    helps: [
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Decrease stream temperatures. Maintains aerobic conditions - binding phosphorus/mercury on sediment, increase dissolved oxygen, decrease algae production.',
    costs:
      'Increase cost to establish and maintain.',
    benefits:
      'Decreased costs of managing/reducing algal blooms that impact water uses. Financial incentives may be available. Grant funding may be available for siphon if decreases downstream temperatures.',
    links: [
      {
        label: 'NRCS – Pond Handbook and Standards',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions',
      },
    ],
    tags: ['Irrigation'],
  },
  {
    id: 'A9',
    title: 'Collect or direct water for storage, water spreading, water-harvesting systems, or treatment.',
    category: 'All Farms – Water Flow & Storage',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
    ],
    ecosystemBenefits:
      'Design dependent - Increase nutrient plant uptake, prevent surface erosion, increase infiltration.',
    costs:
      'Increase cost to establish and maintain. Possible permit costs.',
    benefits:
      'Decreased costs of maintenance due to decreased erosion and sediment delivery. Typically not funded with incentive and grant programs. May not be permitted due to topography, wetlands, soils, etc.',
    links: [
      {
        label: 'NRCS 362 – Diversion',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/diversion-ac-362-conservation-practice-standard',
      },
    ],
    tags: ['Irrigation'],
  },
  {
    id: 'A10',
    title: 'Subsurface tile drains and irrigation tailwater return systems.',
    category: 'All Farms – Fields',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
    ],
    ecosystemBenefits:
      'Design dependent - Increase nutrient plant uptake, filter pollutants from runoff, prevent surface erosion, increase infiltration, reduce soil compaction.',
    costs:
      'Increase cost to establish and maintain.',
    benefits:
      'Increased farmable land. May provide water source longer into growing season. Increase water quality treatment. Incentives may be available, especially if conserves/reuses water. Application requires specific topographic conditions and infrastructure.',
    links: [
      {
        label: 'NRCS 606 – Subsurface Drain, Main or Lateral',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Subsurface_Drain_Main_Or_Lateral_606_CPS.pdf',
      },
      {
        label: 'NRCS 447 – Irrigation Tailwater Return',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Irrigation_Tailwater_Return_447_CPS_10_2020.pdf',
      },
    ],
    tags: ['Irrigation'],
  },
  {
    id: 'A11',
    title: 'Land Leveling for irrigation, water, crop/pasture management.',
    category: 'All Farms – Fields',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
    ],
    ecosystemBenefits:
      'Design dependent - Increase nutrient plant uptake, filter pollutants from runoff, prevent surface erosion, increase infiltration, reduce soil compaction.',
    costs:
      'Increase cost to establish.',
    benefits:
      'Increased farm and water efficiencies. Allows enhanced water quality benefits for other conservation practices. Incentives may be available if part of other practices mentioned above.',
    links: [
      {
        label: 'NRCS 464 – Irrigation Land Leveling',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Irrigation_Land_Leveling_464_CPS_10_2020.pdf',
      },
      {
        label: 'NRCS 462 – Precision Land Forming and Smoothing',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Precision_Land_Forming_And_Smoothing_462_CPS_10_2020.pdf',
      },
    ],
    tags: ['Irrigation'],
  },
  {
    id: 'A12',
    title: 'Site-Specific Erosion Prevention and Control',
    category: 'All Farms – Road & Ditch',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment',
      'Nutrients',
      'Bacteria',
    ],
    ecosystemBenefits:
      'Design and site-specific - filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction.',
    costs:
      'Increased time/costs to install when and where they are needed.',
    benefits:
      'Decreased soil loss through erosion. Decrease cost to maintain drainage infrastructure due to decreased sediment load. Incentives typically available to purchase equipment and supplies. Grant funds may be available due to increased focus on preventing erosion from all land uses. May need to hire or train workforce for efficient and knowledgeable installation.',
    links: [
      {
        label: 'USDA Agronomy Technical Note 4 & 8 - Compost filter socks and blankets',
        url: 'https://www.usda.gov',
      },
      {
        label: 'Certified Erosion and Sediment Control Lead (CESCL) training',
        url: 'https://www.cescl.org',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'A13',
    title: 'Vegetate drainage ditches, install filter strips and drain to field, modify back slope allowing vegetation.',
    category: 'All Farms – Road & Ditch',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment',
      'Nutrients',
      'Bacteria',
      'Dissolved pollutants',
    ],
    ecosystemBenefits:
      'Promote mowable vegetation in road drainage ditches, moderate back-slopes to grow vegetation, and install vegetated filter strips between road drainage and streams. Promote invasive weed control.',
    costs:
      'Increased time/costs to install (back slope modification, seeding, establishment). Increased cost to maintain (mow, spray) vegetation. May lose part of setback on slope changes.',
    benefits:
      'Decrease road grading and drainage maintenance. Decrease cost to maintain drainage infrastructure due to decreased sediment load. County road department expense. Grants may be available to implement a new road management and monitoring program. Helps meet new DEQ mercury/sediment TMDL regulations.',
    links: [
      {
        label: 'Yamhill County Road Department and SWCD example',
        url: 'https://www.yamhillcountyweb.com',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'A14',
    title: 'Farm road improvement: culverts, water bars, cross drains, surfacing, vegetating, filter drainage',
    category: 'All Farms – Road & Ditch',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment',
      'Nutrients',
      'Bacteria',
      'Dissolved pollutants',
    ],
    ecosystemBenefits:
      'Manage road infrastructure to minimize surface runoff erosion of road grade and drainage ditch, size culverts and bridges to pass 100-200-yr events, and intercept direct connection between drainage ditch and creeks with filter strips and bioswales. Design culverts for fish passage.',
    costs:
      'Increased cost to install.',
    benefits:
      'Decreased overall maintenance costs. Preventing sediment and nutrient runoff. Incentives typically available for installation and/or upgrades. Grant funds may be available if preventing water quality problems or improving fish passage.',
    links: [
      {
        label: 'USDA FS – Environmentally Sensitive Road Maintenance Practices',
        url: 'https://dirtandgravel.psu.edu/wp-content/uploads/ESM_Field_Guide.pdf',
      },
      {
        label: 'NRCS 560 – Access Road',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-08/Access_Road_560_CPS_9_2020.pdf',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'A15',
    title: 'Heavy use area protection to stabilize ground surface that is frequently used by people, animals, or vehicles',
    category: 'All Farms – Road & Ditch',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment',
      'Nutrients',
      'Bacteria',
      'Dissolved pollutants',
    ],
    ecosystemBenefits:
      'Harden and use drainage infrastructure (e.g., gravel, drain pipes, french drains, fabric) to stabilize high-traffic areas during wet season.',
    costs:
      'Increased cost to install.',
    benefits:
      'Decreased overall maintenance costs. Preventing sediment and nutrient runoff. Incentives may be available but may need to be part of additional practices.',
    links: [
      {
        label: 'NRCS 561 – Heavy use area protection',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Heavy_Use_Area_Protection_561_CPS_9_2020.pdf',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'C2',
    title: 'Irrigation Water Management',
    category: 'Crop – Vegetation',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment',
      'Nitrate-nitrogen',
      'Bacteria',
    ],
    ecosystemBenefits:
      'Reduced irrigation may increase water supply that aids in temperature control, increases nutrient plant uptake, prevents surface erosion, and increases infiltration.',
    costs:
      'May increase irrigation costs (including energy costs) to install and time/costs to maintain depending on current infrastructure.',
    benefits:
      'Increased crop production quantity and quality. Increased crop options. Funding assistance for overall farm plan and implementation may be available.',
    links: [
      {
        label: 'USDA SARE – Smart Water Use on Your Farm or Ranch',
        url: 'https://www.sare.org/wp-content/uploads/Smart-Water-Use-on-Your-Farm-or-Ranch.pdf',
      },
      {
        label: 'NRCS 449 – Irrigation Water Management',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/irrigation-water-management-ac-449-conservation-practice-standard',
      },
    ],
    tags: ['Irrigation', 'Nutrients'],
  },
  {
    id: 'C4',
    title: 'In-field Vegetative Strips',
    category: 'Crop – Vegetation',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, prevent surface erosion, increase infiltration, reduce soil compaction, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Increased time/costs for seeding and maintenance.',
    benefits:
      'Improved crop health, may increase/decrease costs of nutrients, lime, etc.',
    links: [
      {
        label: 'NRCS 393 – Filter strip',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Filter_Strip_393_CPS.pdf',
      },
      {
        label: 'NRCS 585 – Strip cropping',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Strip_Cropping_585_CPS.pdf',
      },
    ],
    tags: ['Cropland erosion', 'Nutrients'],
  },
  {
    id: 'C5',
    title: 'Conversion of Cropland to Perennial Grass-based agriculture',
    category: 'Crop – Tillage',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, prevent surface erosion, increase infiltration, reduce soil compaction, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs: 'Increased time/costs for conversion and maintenance.',
    benefits:
      'Reduced erosion, improved soil health, increased carbon sequestration.',
    links: [
      {
        label: 'OSU Ext – Hay Production Resources for small farms',
        url: 'https://extension.oregonstate.edu/collection/hay-production-resources-small-farms',
      },
      {
        label: 'NRCS 512 – Pasture and hay planting',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Pasture_and_Hay_Planting_512_NHCP_CPS_2020.pdf',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'C6',
    title: 'Residue and Tillage Management',
    category: 'Crop – Tillage',
    helps: [
      'Sediment',
      'TSS',
      'Nutrients',
      'Pollutants bound to sediment',
      'Bacteria',
    ],
    ecosystemBenefits:
      'Reduces soil erosion and soil compaction, increases soil water infiltration and holding capacity. Binds pollutants. May reduce weed pressure.',
    costs:
      'May require specialized equipment.',
    benefits:
      'Reduces soil erosion and compaction, increases soil water infiltration and holding capacity. Binds pollutants. Reduced weed pressure.',
    links: [
      {
        label: 'USDA – Northwest No-Till Farming for Climate Resilience',
        url: 'https://www.climatehubs.usda.gov/hubs/northwest/topic/northwest-no-till-farming-climate-resilience',
      },
      {
        label: 'OSU Ext – Tillage and Cultivation',
        url: 'https://agsci.oregonstate.edu/mes/sustainable-onion-production/tillage-and-cultivation',
      },
      {
        label: 'NRCS 345 – Residue and Tillage Management, Reduced Till',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Residue_And_Tillage_Management_Reduced_Till_345_PS_Sept_2016.pdf',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'C7',
    title: 'Contour farming and tillage',
    category: 'Crop – Tillage',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Reduces soil erosion and soil compaction, increases soil water infiltration. May increase nutrient uptake, filter pollutants and bacteria.',
    costs: 'May require equipment and labor.',
    benefits:
      'Reduced erosion, improved crop yields, improved water infiltration.',
    links: [
      {
        label: 'Western SARE – Contour Farming',
        url: 'https://western.sare.org/sare-category/crop-production/conservation-tillage/contour-farming/',
      },
      {
        label: 'NRCS 330 – Contour farming',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Contour_Farming_330_CPS_Oct_2017.pdf',
      },
    ],
    tags: ['Cropland erosion'],
  },
  {
    id: 'L1',
    title: 'Livestock exclusion of riparian/wetland vegetated areas, establish off-stream watering facilities',
    category: 'Livestock – Grazing',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Increased fencing and watering costs. Increased invasive weeds if vegetation not maintained. Potential increased wildlife conflicts.',
    benefits:
      'Clean livestock water. Improved livestock health. Less time/cost managing livestock in challenging conditions (soil, mud, water, slope, flooding). Funding assistance for installation and maintenance typically available.',
    links: [
      {
        label: 'NRCS 528 – Grazing Management',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2024-01/528_NHCP_CPS_Grazing_Management_2023_0.pdf',
      },
      {
        label: 'NRCS 512 – Pasture and Hay Planting',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Pasture_and_Hay_Planting_512_NHCP_CPS_2020.pdf',
      },
    ],
    tags: ['Streamside vegetation', 'Livestock management'],
    tmdls: ['Willamette Basin Temperature TMDL', 'Willamette Basin Bacteria TMDL'],
    complianceNotes: 'Often required in riparian compliance zones. Essential for meeting riparian buffer requirements and temperature/bacteria TMDLs.',
  },
  {
    id: 'L2',
    title: 'Healthy Pastures, limit/rotational graze vegetated riparian/wetland areas when vegetation is palatable and not sensitive to browse, soils not saturated.',
    category: 'Livestock – Grazing',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Increased land use and time for rotating livestock. Increased fencing and watering costs. Increased invasive weeds if vegetation not maintained. Potential increased wildlife conflicts.',
    benefits:
      'Improved production. Clean livestock water. Improved livestock health. Less time/cost managing livestock in challenging conditions. Decreased weeds. Funding assistance may be available depending on vegetation protection and offsite watering.',
    links: [
      {
        label: 'OSU Ext – Introduction to pasture and grazing management in Western Oregon',
        url: 'https://extension.oregonstate.edu/catalog/em-9302-introduction-pasture-grazing-management-western-oregon',
      },
      {
        label: 'OSU Ext – Nutrient Management for Pastures',
        url: 'https://extension.oregonstate.edu/catalog/pub/em-9224-nutrient-management-pastures-western-oregon-western-washington',
      },
    ],
    tags: ['Livestock management', 'Manure management'],
  },
  {
    id: 'L3',
    title: 'Maintain livestock access to some streams and wet areas for watering. Harden access points to saturated areas.',
    category: 'Livestock – Grazing',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Increased cost of preventing damage (fencing, hardening) to wet soils and some streams.',
    benefits:
      'Maintains most land for grazing. Decreased effectiveness depending on grazing timing/duration and remaining vegetation characteristics. May require additional mitigations if water quality and vegetation conditions are not satisfactory. Funding assistance less likely.',
    links: [
      {
        label: 'NRCS 528 – Grazing Management',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2024-01/528_NHCP_CPS_Grazing_Management_2023_0.pdf',
      },
    ],
    tags: ['Livestock management'],
  },
  {
    id: 'L4',
    title: 'Waste and nutrient management',
    category: 'Livestock – Grazing',
    helps: [
      'Bacteria',
      'Nutrients',
      'Dissolved oxygen',
      'Algae growth',
    ],
    ecosystemBenefits:
      'Promotes balance of nutrients and crop needs/uptake. Prevents harmful bacteria and excess nutrients from entering water bodies. Limits algal growth.',
    costs:
      'Increased/decreased costs of nutrient management.',
    benefits:
      'Improved vegetative growth/health. Funding assistance for overall grazing plan and implementation may be available.',
    links: [
      {
        label: 'NRCS 590 – Nutrient Management',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/nutrient-management-ac-590-conservation-practice-standard',
      },
    ],
    tags: ['Manure management', 'Nutrients'],
  },
  {
    id: 'L5',
    title: 'Establish sacrifice area for wet use to protect other wet ground. Collect livestock waste. Prevent runoff and leaching',
    category: 'Livestock – Off-stream Watering',
    helps: [
      'Bacteria',
      'Nutrients',
      'Dissolved oxygen',
      'Algae growth',
    ],
    ecosystemBenefits:
      'Promotes balance of nutrients and crop needs/uptake. Prevents harmful bacteria and excess nutrients from entering water bodies. Limits algal growth.',
    costs:
      'Increased costs for collecting/managing waste.',
    benefits:
      'Improved pasture condition. Funding assistance for overall grazing plan and implementation may be available.',
    links: [
      {
        label: 'NRCS 512 – Pasture and Hay Planting',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Pasture_and_Hay_Planting_512_NHCP_CPS_2020.pdf',
      },
    ],
    tags: ['Livestock management'],
  },
  {
    id: 'L6',
    title: 'Establish off-stream watering facilities to lure livestock from streams, springs and saturated areas',
    category: 'Livestock – Off-stream Watering',
    helps: [
      'Sediment',
      'TSS',
      'Pollutants bound to sediment (e.g., mercury, phosphorus)',
      'Nutrient uptake (nitrogen, phosphorus, etc.)',
      'Bacteria',
      'Stream temperature',
      'Dissolved oxygen',
      'Algae growth (chlorophyll a)',
    ],
    ecosystemBenefits:
      'Increase nutrient plant uptake, filter pollutants from runoff, reduce streambank erosion, prevent surface erosion, increase infiltration, reduce soil compaction, provide shade to reduce stream and riparian air temperature, increase cover and organic material for habitat, and sequester carbon to improve soil moisture holding capacity and reduce carbon gas emission.',
    costs:
      'Increased cost of maintaining watering facilities and preventing damage to wet soils, and partial decrease in time/costs managing livestock in streams.',
    benefits:
      'Maintains most land for grazing. Increased livestock water quality and maybe livestock health. Decreased effectiveness depending on grazing timing/duration and remaining vegetation characteristics. May require additional mitigations if water quality and vegetation conditions are not satisfactory. Funding assistance less likely.',
    links: [
      {
        label: 'OSU Ext – Streams and Riparian Areas: Clean Water, Diverse Habitat',
        url: 'https://extension.oregonstate.edu/catalog/pub/em-9244-streams-riparian-areas-clean-water-diverse-habitat',
      },
    ],
    tags: ['Livestock management'],
  },
  {
    id: 'L7',
    title: 'Livestock waste storage facility. Composting facility. Roofs and covers for livestock waste',
    category: 'Livestock – Waste',
    helps: [
      'Bacteria',
      'Nutrients',
      'Dissolved oxygen',
      'Algae growth',
    ],
    ecosystemBenefits:
      'Promotes balance of nutrients and crop needs/uptake. Prevents harmful bacteria and excess nutrients from entering water bodies. Limits algal growth.',
    costs:
      'Increased costs for installation and managing waste (collecting, storing, removal, spreading).',
    benefits:
      'Improved livestock health. Less time/costs managing livestock in challenging soil-mud-manure conditions. Funding assistance for installation typically available.',
    links: [
      {
        label: 'OSU Ext – Composting: An alternative for livestock manure management',
        url: 'https://extension.oregonstate.edu/sites/extd8/files/catalog/auto/EM8825.pdf',
      },
      {
        label: 'NRCS 313 – Waste Storage Facility',
        url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/waste-storage-facility-no-313-conservation-practice-standard',
      },
      {
        label: 'NRCS 317 – Composting Facility',
        url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/Composting_Facility_317_CPS_9_2020.pdf',
      },
    ],
    tags: ['Manure management'],
    tmdls: ['Willamette Basin Bacteria TMDL', 'Willamette Basin Nutrient TMDL'],
    complianceNotes: 'Required for livestock operations in certain areas. Design and operation must comply with local water quality standards. Regular maintenance and record-keeping required.',
  },
];
