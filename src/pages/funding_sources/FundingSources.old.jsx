import React, { useState, useMemo } from "react";
import { Input, Space, Tag, Row, Col, Typography } from "antd";

const { Title } = Typography;
const { Search } = Input;

// Add custom styles for yellow link and underline on hover
const linkStyle = {
	/*color: "#FFD600", // Material yellow 700*/
	textDecoration: "none",
	transition: "text-decoration 0.2s",
};
const linkHoverStyle = {
	textDecoration: "underline",
};

const fundingSources = [
	{
		"title": "Environmental Quality Incentives Program(EQIP) Fact Sheet",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Environmental Quality Incentives Program(EQIP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2022-10/EQIP-fact-sheet.pdf?utm_source"
	},
	{
		"title": "Environmental Quality Incentives Program(EQIP) Conservation Incentive Contracts(CIC) Fact Sheet",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Environmental Quality Incentives Program(EQIP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-10/EQIP-CIC%20Fact%20Sheet.pdf"
	},
	{
		"title": "Environmental Quality Incentives Program(EQIP) Oregon",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Environmental Quality Incentives Program(EQIP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/programs-initiatives/eqip-environmental-quality-incentives/oregon/environmental-quality-incentives"
	},
	{
		"title": "Oregon EQIP Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Environmental Quality Incentives Program(EQIP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-eqip.pdf"
	},
	{
		"title": "Oregon EQIP - CIC Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Environmental Quality Incentives Program(EQIP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-eqip-cic.pdf"
	},
	{
		"title": "Oregon EQIP - CIC Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Environmental Quality Incentives Program(EQIP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-eqip-cic.pdf"
	},
	{
		"title": "Edge-of-field water quality impacts of EQIP-funded conservation practices on irrigated fields in Colorado",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "EQIP and water quality",
		"source": "Journal of Soil and Water Conservation",
		"link": "https://www.tandfonline.com/doi/epdf/10.1080/00224561.2025.2467589?needAccess=true"
	},
	{
		"title": "Agricultural Conservation Easement Program(ACEP) Fact Sheet",
		"tags": "policy, agriculture, economics, water quality, soil management, riparian management",
		"classification": "Agricultural Conservation Easement Program(ACEP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2022-09/NRCS%20ACEP%20Fact%20Sheet.pdf"
	},
	{
		"title": "Ranking Criteria for NRCS Programs - Fiscal Year 2024 Inflation Reduction Act(IRA) - Agricultural Conservation Easement Program(ACEP)",
		"tags": "policy, agriculture, economics, water quality, soil management, riparian management",
		"classification": "Agricultural Conservation Easement Program(ACEP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-11/fy-2024-ira-acep-ranking-criteria.pdf"
	},
	{
		"title": "Oregon ACEP - ALE Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management, riparian management",
		"classification": "Agricultural Conservation Easement Program(ACEP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-acep-ale.pdf"
	},
	{
		"title": "Conservation Stewardship Program Fact Sheet",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Conservation Stewardship Program(CSP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2025-05/nrcs-csp-right-for-me-factsheet-012025.pdf"
	},
	{
		"title": "Oregon CSP - GCI Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Conservation Stewardship Program(CSP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-csp-gci.pdf"
	},
	{
		"title": "Oregon CStwP Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Conservation Stewardship Program(CSP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-cstwp.pdf"
	},
	{
		"title": "Regional Conservation Partnership Program(RCPP) Fact Sheet",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Regional Conservation Partnership Program(RCPP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-06/MO%20RCPP%20Fact%20Sheet.pdf"
	},
	{
		"title": "Oregon RCPP - CSP Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Regional Conservation Partnership Program(RCPP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-rcpp-csp.pdf"
	},
	{
		"title": "Oregon RCPP - EQIP Payment Rates Fiscal Year 2024",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Regional Conservation Partnership Program(RCPP)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-12/fy24-oregon-rcpp-eqip.pdf"
	},
	{
		"title": "Conservation Reserve Program(CRP) Fact Sheet",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Conservation Reserve Program(CRP)",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/conservation-reserve-program-crp"
	},
	{
		"title": "Cover Practice Definitions and Incentives in the Conservation Reserve Program",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Conservation Reserve Program(CRP)",
		"source": "USDA ERS",
		"link": "https://ers.usda.gov/sites/default/files/_laserfiche/publications/103352/EIB-233_Summary.pdf?v=28957"
	},
	{
		"title": "Conservation Technical Assistance Program(CTA)",
		"tags": "policy, agriculture, water quality, soil management",
		"classification": "Conservation Technical Assistance Program(CTA)",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2023-05/Montana-CTA-Fact-Sheet.pdf"
	},
	{
		"title": "NRCS Application Ranking Dates",
		"tags": "policy, agriculture, economics",
		"classification": "NRCS Application Ranking Dates",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/ranking-dates"
	},
	{
		"title": "NRCS Technical Assistance and Financial Assistance Resources",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "NRCS Technical and Financial Assistance Resources",
		"source": "NRCS",
		"link": "https://www.oregon.gov/deq/wq/Documents/dwp13FundAndersonMoore.pdf"
	},
	{
		"title": "Working Lands Conservation Programs Manual",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Conservation Programs",
		"source": "NRCS",
		"link": "https://directives.nrcs.usda.gov/sites/default/files2/1734120636/Part%20530_Entire%20Part_Nov%202024.pdf"
	},
	{
		"title": "A Guide to USDA Resources for Historically Underserved Farmers and Ranchers",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Historically Underserved Farmers and Ranchers",
		"source": "USDA",
		"link": "https://www.farmers.gov/sites/default/files/2022-07/farmersgov-historically-underserved-factsheet-07-20-2022.pdf"
	},
	{
		"title": "Crop Insurance Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "Center for Rural Affairs",
		"link": "https://www.cfra.org/sites/default/files/publications/crop-insurance-101.pdf"
	},
	{
		"title": "Crop Insurance for Specialty and Organic Grains",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "UW - Madison",
		"link": "https://cias.wisc.edu/news/new-crop-insurance-fact-sheet-for-speciality-and-organic-grains/"
	},
	{
		"title": "Natural Disasters and Crop Insurance Fact Sheet",
		"tags": "policy, agriculture, economics, climate, drought",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-02/Natural-Disasters-and-Crop-Insurance-Fact-Sheet.pdf"
	},
	{
		"title": "A Risk Management Agency State Profile Oregon Crop Insurance",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2025-03/Oregon-State-Profile-2024.pdf"
	},
	{
		"title": "Cover Crops and Federal Crop Insurance Fact Sheet",
		"tags": "policy, agriculture, economics, soil management",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-02/Cover-Crops-and-Crop-Insurance-Fact-Sheet.pdf"
	},
	{
		"title": "Whole-farm Revenue Protection(WFRP) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-02/Whole-Farm-Revenue-Protection-Fact-Sheet.pdf"
	},
	{
		"title": "Pasture-Rangeland-Forage(PRF) Insurance Fact Sheet",
		"tags": "policy, agriculture, economics, drought",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-02/Pasture-Rangeland-Forage-Pilot-Insurance-Program-Fact-Sheet.pdf"
	},
	{
		"title": "Crop Insurance Common Coverage Types",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.cfra.org/sites/default/files/publications/crop-insurance-101-2023.pdf"
	},
	{
		"title": "Livestock Risk Protection(LRP) Feeder Cattle Fact Sheet",
		"tags": "policy, agriculture, economics",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-02/LRP-Feeder-Cattle-Fact-Sheet.pdf"
	},
	{
		"title": "Livestock Gross Margin(LGM) for Cattle Fact Sheet",
		"tags": "policy, agriculture, economics",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-02/Livestock-Gross-Margin-Insurance-Cattle-Fact-Sheet.pdf"
	},
	{
		"title": "Dairy Revenue Protection(DRP) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-02/Dairy-Revenue-Protection-Fact-Sheet.pdf"
	},
	{
		"title": "Beginning Farmer and Rancher Benefits for Crop Insurance",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.rma.usda.gov/sites/default/files/2024-08/Beginning-Farmer-and-Rancher-Fact-Sheet.pdf"
	},
	{
		"title": "Multiple Peril Crop Insurance(MPCI) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://www.uwagec.org/riskmgt/ProductionRisk/MultiPerilcropinsurance.pdf"
	},
	{
		"title": "Enhanced Coverage Option(ECO) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://old.rma.usda.gov/en/Fact-Sheets/National-Fact-Sheets/Enhanced-Coverage-Option"
	},
	{
		"title": "Supplemental Coverage Option(SCO) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "USDA RMA",
		"link": "https://old.rma.usda.gov/-/media/RMA/Fact-Sheets/National-Fact-Sheets/Supplemental-Coverage-Option.ashx?la=en"
	},
	{
		"title": "How important is crop insurance to Oregon",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Crop Insurance",
		"source": "OSU Extension",
		"link": "https://extension.oregonstate.edu/business-economics/rural-development/how-important-crop-insurance-oregon?utm_source"
	},
	{
		"title": "Impacts of Crop Insurance on Water Withdrawals for Irrigation",
		"tags": "policy, agriculture, economics, climate, irrigation",
		"classification": "Crop Insurance and water",
		"source": "Advances in Water Resources",
		"link": "https://mkonar.cee.illinois.edu/25_Deryugina_ADWR_2017.pdf?utm_source"
	},
	{
		"title": "Crop Insurance Participation and Cover Crop Use Evidence From Agricultural Resource Management Survey Data",
		"tags": "policy, agriculture, economics, soil management",
		"classification": "Crop Insurance and cover crops",
		"source": "Journal of Agricultural and Applied Economics",
		"link": "https://www.cambridge.org/core/journals/journal-of-agricultural-and-applied-economics/article/crop-insurance-participation-and-cover-crop-use-evidence-from-agricultural-resource-management-survey-data/9E1FE521D4F40608E406546A0CEA07D0?utm_source"
	},
	{
		"title": "Farm Loans Overview",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/sites/default/files/documents/farm_loans_overview-factsheet-1.pdf"
	},
	{
		"title": "Farm Loan Information Chart 2024",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/sites/default/files/2024-10/Farm%20Loan%20Information%20Chart%202024.pdf"
	},
	{
		"title": "Loans for Your Farm or Ranch",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "Farmers.gov",
		"link": "https://www.farmers.gov/sites/default/files/2021-10/usda-farmloans-factsheet-10-20-2021.pdf"
	},
	{
		"title": "Microloans 2024",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/microloans-2024pdf"
	},
	{
		"title": "Emergency Loan Program 2024",
		"tags": "policy, agriculture, economics, drought, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/emergency-loan-program-2024pdf"
	},
	{
		"title": "Loans for Beginning Farmers and Ranchers 2024",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/loans-beginning-farmers-2024pdf"
	},
	{
		"title": "Federal Financial Assistance for Drought Emergencies",
		"tags": "policy, agriculture, economics, drought",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.oregon.gov/owrd/programs/climate/droughtwatch/Documents/Fed_Drought_Finance.pdf"
	},
	{
		"title": "New Farmers Get Started Fact Sheet",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "Farmers.gov",
		"link": "https://www.farmers.gov/sites/default/files/documents/farmersgov-getstarted-factsheet.pdf"
	},
	{
		"title": "USDA FSA Sample Microloan Application",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "OSU Small Farms Program",
		"link": "https://smallfarms.oregonstate.edu/smallfarms/sample-business-plans"
	},
	{
		"title": "Your Guide to FSA Farm Loans",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/Internet/FSA_File/fsa_br_01_web_booklet.pdf"
	},
	{
		"title": "Livestock Forage Disaster Program(LFP) Fact Sheet",
		"tags": "policy, agriculture, economics, drought",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/livestock-forage-disaster-program-lfp"
	},
	{
		"title": "Emergency Assistance for Livestock, Honeybees and Farm-Raised Fish Program(ELAP) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/emergency-assistance-livestock-honeybees-farm-raised-fish-program-4"
	},
	{
		"title": "Current FSA Loan Interest Rates July 2025",
		"tags": "policy, agriculture, economics",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/rates/current-fsa-loan-interest-rates"
	},
	{
		"title": "Tree Assistance Program Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/tree-assistance-program-tap"
	},
	{
		"title": "Emergency Conservation Program(ECP) Fact Sheet",
		"tags": "policy, agriculture, economics, drought, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/emergency-conservation-program-ecp"
	},
	{
		"title": "Emergency Forest Restoration Program(EFRP) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/emergency-forest-restoration-program-efrp"
	},
	{
		"title": "Emergency Watershed Protection Program(EWPP) Fact Sheet",
		"tags": "policy, agriculture, economics, water quality, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2022-08/NRCS_EWPP_Fact%20Sheet-2021.pdf"
	},
	{
		"title": "Emergency Conservation Reserve Program(CRP) Haying and Grazing",
		"tags": "policy, agriculture, economics, drought",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/emergency-conservation-reserve-program-crp-haying-grazing"
	},
	{
		"title": "Livestock Indemnity Program(LIP) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/livestock-indemnity-program-lip"
	},
	{
		"title": "Noninsured Crop Disaster Assistance Program(NAP) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/noninsured-crop-disaster-assistance-program-nap"
	},
	{
		"title": "Emergency Relief Program 2022(Track 1) Delivery Snapshot Oregon",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/emergency-relief-program-2022-track-1-delivery-snapshot-oregon"
	},
	{
		"title": "Emergency Commodity Assistance Program(ECAP) Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.fsa.usda.gov/tools/informational/fact-sheets/emergency-commodity-assistance-program-ecap"
	},
	{
		"title": "Climate - Smart Agriculture and Farm Loan Programs Fact Sheet",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Farm Loans",
		"source": "FSA",
		"link": "https://www.farmers.gov/sites/default/files/documents/fsa-climate-smart-farm-loans.pdf"
	},
	{
		"title": "Beginning Farmer and Rancher Development Program(BFRDP) Fact Sheet",
		"tags": "policy, agriculture",
		"classification": "Education",
		"source": "NIFA",
		"link": "https://www.nifa.usda.gov/grants/programs/beginning-farmer-rancher-development-program-bfrdp/fact-sheet"
	},
	{
		"title": "NRCS Climate Change Adaptation Plan",
		"tags": "policy, agriculture, climate",
		"classification": "Climate Adaptation",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2022-09/1_FPAC_NRCS_ClimateAdaptationPlan_2022.pdf?utm_source"
	},
	{
		"title": "FSA Climate Change Adaptation Plan",
		"tags": "policy, agriculture, climate",
		"classification": "Climate Adaptation",
		"source": "FSA",
		"link": "https://www.usda.gov/sites/default/files/documents/2_FPAC_FSA_ClimateAdaptationPlan_2022.pdf?utm_source"
	},
	{
		"title": "Breaking New Ground: Farmer Perspectives on Organic Transition",
		"tags": "agriculture, policy",
		"classification": "Report - Farmer survey",
		"source": "Oregon Tilth and OSU",
		"link": "https://tilth.org/education/resources/breakingground/"
	},
	{
		"title": "Midwest Farmer Perspectices on Farm Financial Programs",
		"tags": "policy, agriculture, economics, climate",
		"classification": "Brief - Farmer survey",
		"source": "UW - Madison",
		"link": "https://rissman.russell.wisc.edu/wp-content/uploads/sites/281/2024/12/Midwest-Farmer-Perspectives-on-Farm-Financial-Programs-11.pdf"
	},
	{
		"title": "Midwest Farmer Perspectives on Conservation",
		"tags": "agriculture, soil management, water quality",
		"classification": "Brief - Farmer survey",
		"source": "UW - Madison",
		"link": "https://rissman.russell.wisc.edu/wp-content/uploads/sites/281/2024/12/Midwest-Farmer-Perspectives-on-Conservation-14.pdf"
	},
	{
		"title": "Economic Outcomes of Soil Health and Conservation Practices on U.S. Cropland",
		"tags": "policy, agriculture, economics, water quality, soil management",
		"classification": "Conservation Practices",
		"source": "USDA ERS",
		"link": "https://ers.usda.gov/sites/default/files/_laserfiche/publications/112841/ERR-353_summary.pdf?v=13146"
	},
	{
		"title": "Oregon Practice Scenarios Fiscal Year 2024",
		"tags": "policy, agriculture, water quality, soil management",
		"classification": "Conservation Practices",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/sites/default/files/2024-01/fy24-oregon-scenarios.pdf"
	},
	{
		"title": "Cover Crop Trends, Programs, and Practices in the United States",
		"tags": "policy, agriculture, water quality, soil management",
		"classification": "Conservation Practices",
		"source": "USDA ERS",
		"link": "https://ers.usda.gov/sites/default/files/_laserfiche/publications/100551/EIB-222_Summary.pdf?v=60193"
	},
	{
		"title": "Irrigation Water Management (Ac.)(449) Conservation Practice Standard",
		"tags": "policy, agriculture, water quality, soil management, irrigation",
		"classification": "Conservation Practices",
		"source": "NRCS",
		"link": "https://www.nrcs.usda.gov/resources/guides-and-instructions/irrigation-water-management-ac-449-conservation-practice-standard"
	},
	{
		"title": "Index of Conservation Practice Standards Oregon",
		"tags": "policy, agriculture, water quality, soil management",
		"classification": "Conservation Practices",
		"source": "NRCS",
		"link": "https://efotg.sc.egov.usda.gov/api/CPSFile/27621/Oregon_IDX_October_2020"
	},
	{
		"title": "Adoption of agricultural conservation practices in the United States Evidence from 35 years of quantitative literature",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - factors",
		"source": "Journal of Soil and Water Conservation",
		"link": "https://www.tandfonline.com/doi/epdf/10.2489/jswc.74.5.520?needAccess=true"
	},
	{
		"title": "Adoption of Agricultural Conservation Practices Insights from Research and Practice",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - factors",
		"source": "Purdue Extension",
		"link": "https://www.extension.purdue.edu/extmedia/fnr/fnr-488-w.pdf?utm_source"
	},
	{
		"title": "Spatially Mediated Peer Effects in the Adoption of Conservation Agriculture Practices",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - peer effects",
		"source": "Journal of Agricultural and Applied Economics",
		"link": "https://www.cambridge.org/core/journals/journal-of-agricultural-and-applied-economics/article/spatially-mediated-peer-effects-in-the-adoption-of-conservation-agriculture-practices/55A5004D6094FA380E343159B36AD820?utm_source"
	},
	{
		"title": "Crop advisers as conservation intermediaries Perceptions and policy implications for relying on nontraditional partners to increase U.S. farmers’ adoption of soil and water conservation practices",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - crop advisors",
		"source": "Land Use Policy",
		"link": "https://pdf.sciencedirectassets.com/271740/1-s2.0-S0264837718X00106/1-s2.0-S0264837718310238/main.pdf?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEPf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCICHWegLpCvPm%2FPJ9Zyf0dTf4tdmu%2FzPt6T6hfabwkE2fAiEAnrP7%2FEpQ0NMGMf3o%2FNKsIs7p86R9yYBOJAcilxFHef0qswUIHxAFGgwwNTkwMDM1NDY4NjUiDFqPoIDTHOsJ13vrYiqQBV4Ru9hWkfgJJZRv9q7AV3Lqn3fuoriLCgeRA5fUllgsIH6yh7VWmHXG3EDQd4A9otuMQ2ZFwU63szY%2FuiyjDlNG9Gj79Ecwd1ibM5634oexXdY0GTmHzLz8o6yvq8jJBP7nAQqoB3XodzOwHZahV8q5kiFOuFFBDAmaqyrXw4JNk2DiRuHsWTvNz7ScLEHGAyq%2BqjkMKSa0YC%2FLCPMj2jRZevPHsqIP4MCZUfZQnzMpzu4iYCKTuhzinG2AtIueSbRxogBHIDfU8KxCl32%2BYxaPlkkkP7katRJj%2Fc2j5dgzMve5lwaHO6cp0VD%2FvFtHEie1E6ZhZuXjrSsqmq4px8bFUl4Dp9vNLojOx4IsYdiwaL6Dgm2hzyLJ5u7zMlYJCOqEMSKN5sUgmwD%2BodhFEuRISDuEyQc7qSsDO7vxt892mPcpJQyv4nwI6IWw2C2GTZ%2FivOAYU6HW73sHxIDpdlk3VMxpKPW2fqpITvMoSveaXKwoDrWDRL3XQgGCfLmrWAN0Dem4Q8nq1o3ySWoPIObv8iUC%2BF7ckc6Voug6FPe5UoXfBC306I8FtAvtilKY7tj3kJyr3l6FA%2B0dVnnwDFrMZuDM8O5p3S6%2FLk91Owt0dLb72aabKgs231hp3UOsfenQ2YStKEVky%2BUc4Gbuw7LpSBxhZ%2BJRhIurj1jiYb67l0wmiF5eYxCG0yb7hcRxN8I4c1YsBjXQ0lijFN0dyAIOtAJocsX4D6ObeI8pdgEDjhXitzUz97HK9p3WFK2ZHBflvDAzo0RaqTyOQYs2eqFQE5mw8sqjWiJf%2F66%2Fq1zCchEgoM6Z5%2BUCBaACRY4CsjmktPup%2FU9uVHuAcpDWc5pHFSqHkHt%2FP0ERjB6RNkeCMOy9hcQGOrEBAQ0zol6vF5pT7eXVfT%2B8gDmJJfaQ3%2FnTcBsk%2BZ6MttSaXZ%2BYYOCD8fYqp6c0Dp7k4rVcabiRIIzRZMWZIJn1WmT2irliJJ%2BTY02jjvyQT1Avi6hmFyN%2Bets6JIabnbBD48%2F463nTVnS8EAbqiqGVQH4NBjATFJOP9g184rySQY348dtCAwS14KPAD9dgzmxwPzLVNaHJoX8Oq18HCFHV07ZD6hQ0NoHj0d6%2FEky%2BloXQ&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250723T233447Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAQ3PHCVTY64WJCB3X%2F20250723%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=b14ba94323a27cf767d903141d8965c42a1da3c65ff675f1a18df0a623abca99&hash=9d47e7cf67d15676a26138818748e9785143af41039b0a756f3ffa92a283595d&host=68042c943591013ac2b2430a89b270f6af2c76d8dfd086a07176afe7c76c2c61&pii=S0264837718310238&tid=spdf-45f42e50-e1f1-4d67-ab78-08e564c1692f&sid=a26d56294e6db54ec0589de19c60ce723749gxrqa&type=client&tsoh=d3d3LXNjaWVuY2VkaXJlY3QtY29tLmV6cHJveHkubGlicmFyeS53aXNjLmVkdQ%3D%3D&rh=d3d3LXNjaWVuY2VkaXJlY3QtY29tLmV6cHJveHkubGlicmFyeS53aXNjLmVkdQ%3D%3D&ua=131d5b525205030356&rr=963efd8f7f5fc0a8&cc=us"
	},
	{
		"title": "Motivating conservation action in the Upper Midwest Source attention, information seeking and sharing, and farmers' land management decisions",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices-information and trust",
		"source": "Conservation Science and Practice",
		"link": "https://conbio.onlinelibrary.wiley.com/doi/10.1111/csp2.13287"
	},
	{
		"title": "Pepin County farmer nitrogen - use survey",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - trust and social norms",
		"source": "UW - Madison",
		"link": "https://agwater.extension.wisc.edu/files/2022/12/final-report_pepin-nitrogen-use-survey_2021-03-25.pdf"
	},
	{
		"title": "The role of peer influence and norms in organic farming adoption Accounting for farmers’ heterogeneity",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - peernetworks and social norms",
		"source": "Journal of Environmental Management",
		"link": "https://pdf.sciencedirectassets.com/272592/1-s2.0-S0301479722X00169/1-s2.0-S0301479722014827/main.pdf?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEPj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIAqT5%2FrTZIILipM8s2jMYLR2wSIVilXIf2ilRelmOG2wAiAdT4VB1DJCotJTOGIwd%2FeolNq77tZdw3pyJZ%2Bg9yZGKCqzBQggEAUaDDA1OTAwMzU0Njg2NSIMKna48jsvSpp95IgVKpAFWaJUqVdYRdoKNo3e6nSJUtsMOEJZp2w3er7AatbYXbs8%2BAz%2FnXK41q7nyIBzhiNSZ3d52u350ZOCZEmp0%2FTVnOGUnFhgt8UmmDBh2a6bz8W2cnHd8db%2F%2BloLRJSgd6zNyeIPEjdc1f8aET%2BxvjRIPShLoo2c8%2B5KrDejXvoRyyJjenaIOIiqcEvzz68WCy4BYsdJIpPm0BbPNsF%2BwdEc74NWXcL3nTDebdV%2FDrfFyHZrHdoxMiDqMFZSGh%2FT%2BFwHUeZ1%2B%2F5P6ErlCpv91iHMQb2z08PI%2FiRjhkIEUqAaCCJt7p%2BTmrR5XG1SuvAw4mKjU67k40xCgYbXldTdH9k49L8ge1ZKHGPNpgglcbW7QP32rJHvb8tYNpDxGPe5pekvFaSEYGeAPOyZSVZ9W0m5oU4M4g%2FS3m%2FrTlf2kkhtzzqDDSeAxirFc8j2j856uZXdvCQ29FPgiHcgGqK6kTekLIYA0pkNgwFSuIxzPcQlGWORBUKhC8jjLyyadQ9F8ZfXcxP6kS%2BZxNkyGhzFZoW3qXNHT4F13W8%2B4cgei4ioKIdyqF7cXl9z9pEnAEqknfZ86HklehcRT2UShljhxSvnwXTFg5HXLYoucpvr%2FdQjHBWLEavV3XjF1Iu1rAJpCqewSlLXxyMSrC69kzO4p3YVCepd76CUKAiGXSxqxbimIfhO1UQVxMTjWKsbuHP98Q%2F8UaZj06kRoUTwL0ycBUgF9JLuJd4UEAJ6Pvo1BDItxSBgWVQ%2B1nx%2FoOjtm4uZ%2BEi0XlKSG%2Bl8fIK2siKlhipjTv6weeGbxQp9esZrzzqrGQD0Sj5cc%2BdQhWy2qgRxZD8nYqK%2FRU6Q0UIZRfhteOP8p2DgD8wee7Ectcnw%2FL3Uj7owu9mFxAY6sgEEvg8mK8snY0LgtilZ7VpmwCAhx8ppNdzuJNfIG0RaSjVAEniEHy%2F7h8dK3mugK%2FMa5V85BAFZyQoRz4gFXWSUgFAlzi2cIZ5MHupPxXrzRAZKAyKcinJiyQjVuRR%2FjUiaonT2svF3Z19dL1wTdqQcmrx7XKNq%2BRJ%2BYj5rBBQecAEWTJQ2vhuZAOkh9tCoM1cyMFKrTHL%2F9TM%2B%2F%2BWeE3aBFdML3IdPO5NTFSkyludslmnm&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250724T003225Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAQ3PHCVTY372OIPIH%2F20250724%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=d35fd4e01b223c82b9e8b83e1fc98645fb9dff20cbc347e811dbd13f4ef132bf&hash=06f67bb486aceecb0ceb71bc7e20dd3cb5b991700c7281a2a381f1b852366370&host=68042c943591013ac2b2430a89b270f6af2c76d8dfd086a07176afe7c76c2c61&pii=S0301479722014827&tid=spdf-bdf8b1bf-5721-4359-bcff-9cfa2303a9c2&sid=a26d56294e6db54ec0589de19c60ce723749gxrqa&type=client&tsoh=d3d3LXNjaWVuY2VkaXJlY3QtY29tLmV6cHJveHkubGlicmFyeS53aXNjLmVkdQ%3D%3D&rh=d3d3LXNjaWVuY2VkaXJlY3QtY29tLmV6cHJveHkubGlicmFyeS53aXNjLmVkdQ%3D%3D&ua=131d5b525206505608&rr=963f51feec0d3c96&cc=us"
	},
	{
		"title": "Understanding Predictors of Nutrient Management Practice Diversity in Midwestern Agriculture",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - social networks",
		"source": "Journal of Extension",
		"link": "https://open.clemson.edu/cgi/viewcontent.cgi?article=1916&context=joe"
	},
	{
		"title": "The adoption of conservation practices in the Corn Belt the role of one formal farmer network, Practical Farmers of Iowa",
		"tags": "agriculture, water quality, soil management",
		"classification": "Conservation Practices - social networks",
		"source": "Agriculture and Human Values",
		"link": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10155147/pdf/10460_2023_Article_10451.pdf"
	},
	{
		"title": "Understand how to influence farmers' decision-making behaviour a social science literature review",
		"tags": "agriculture",
		"classification": "Farmer decision making and behavior change",
		"source": "Agriculture and Horticulture Development Board (AHDB)",
		"link": "https://projectblue.blob.core.windows.net/media/Default/Imported%20Publication%20Docs/FarmersDecisionMaking_2018_09_18.pdf"
	},
	{
		"title": "Understanding Farmer Perspectives on Climate Change Adaptation and Mitigation The Roles of Trust in Sources of Climate Information, Climate Change Beliefs, and Perceived Risk",
		"tags": "agriculture, climate",
		"classification": "Trust and climate adaptations",
		"source": "Environment and Behavior",
		"link": "https://journals.sagepub.com/doi/epub/10.1177/0013916513503832"
	},
	{
		"title": "Exploring the influence of social and informational networks on small farmers’ responses to climate change in Oregon",
		"tags": "agriculture, climate",
		"classification": "Networks and climate adaptations",
		"source": "Agriculture and Human Values",
		"link": "https://www.researchgate.net/publication/361858613_Exploring_the_influence_of_social_and_informational_networks_on_small_farmers%27_responses_to_climate_change_in_Oregon"
	},
	{
		"title": "Innovation, Cooperation, and the Perceived Benefits and Costs of Sustainable Agriculture Practices",
		"tags": "agriculture, economics",
		"classification": "Conservation Practices",
		"source": "Ecology and Society",
		"link": "https://www.ecologyandsociety.org/vol16/iss4/art23/"
	},
	{
		"title": "Understanding Corn Belt farmer perspectives on climate change to inform engagement strategies for adaptation and mitigation",
		"tags": "agriculture, climate",
		"classification": "Climate adaptations and engagement",
		"source": "Journal of Soil and Water Conservation",
		"link": "https://www.tandfonline.com/doi/epdf/10.2489/jswc.69.6.505?needAccess=true"
	}
];

function getAllUniqueTags(data) {
	const tagSet = new Set();
	data.forEach((item) => {
		if (item.tags) {
			item.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean)
				.forEach((tag) => tagSet.add(tag));
		}
	});
	return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

const ResourceTable = () => {
	const [searchText, setSearchText] = useState("");
	const [hoveredRow, setHoveredRow] = useState(null);

	const uniqueTags = useMemo(() => getAllUniqueTags(fundingSources), []);

	const filteredData = useMemo(() => {
		const lower = searchText.toLowerCase();
		return fundingSources
			.map((item, idx) => ({ ...item, key: idx }))
			.filter(
				(row) =>
					row.title.toLowerCase().includes(lower) ||
					row.tags.toLowerCase().includes(lower) ||
					row.classification.toLowerCase().includes(lower) ||
					row.source.toLowerCase().includes(lower)
			);
	}, [searchText]);

	return (
		<div className="p-6 overflow-x-auto">
			<style>
				{`
					.funding-link {
						color: #FFD600 !important;
						text-decoration: none;
						transition: text-decoration 0.2s;
					}
					.funding-link:hover {
						text-decoration: underline;
					}
					.funding-row {
						background: #222;
						border-radius: 8px;
						margin-bottom: 12px;
						margin-left: 0px;
						margin-right: 0px;
						box-shadow: 0 1px 4px rgba(0,0,0,0.04);
						padding: 8px 8px;
						transition: box-shadow 0.2s;
					}
					.funding-row:hover {
						box-shadow: 0 4px 16px rgba(0,0,0,0.10);
					}
				`}
			</style>
			<Title level={3}>Programs and Funding Information for Agricultural Water Management</Title>
			<Space direction="vertical" style={{ width: "100%" }} size="middle">
				<Search
					placeholder="Search title, tags, classification, or source"
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					allowClear
					enterButton 
					style={{ maxWidth: 400 }}
				/>

				<div style={{ marginBottom: 12 }}>
					{uniqueTags.map((tag) => (
						<Tag
							key={tag}
							style={{ cursor: "pointer", marginBottom: 4 }}
							onClick={() => setSearchText(tag)}
						>
							{tag}
						</Tag>
					))}
				</div>
				<div>
					{filteredData.map((record) => (
						<Row
							key={record.key}
							className="funding-row"
							align="top"

							onMouseEnter={() => setHoveredRow(record.key)}
							onMouseLeave={() => setHoveredRow(null)}
						>
							<Col xs={24} md={12} lg={12}>
								<a
									href={record.link}
									target="_blank"
									rel="noopener noreferrer"
									className="funding-link"
									style={
										hoveredRow === record.key
											? { ...linkStyle, ...linkHoverStyle }
											: linkStyle
									}
								>
									{record.title}
								</a>
								<br/>
								{record.tags &&
									record.tags
										.split(",")
										.map((tag) => tag.trim())
										.filter(Boolean)
										.map((tag, idx) => (
											<Tag
												key={tag + idx}
												style={{ marginLeft: 4, cursor: "pointer" }}
												onClick={() => setSearchText(tag)}
											>
												{tag}
											</Tag>
										))}
							</Col>
							<Col xs={12} md={6} lg={6}>
								<div style={{ fontWeight: 500, color: "#555" }}>Classification</div>
								<div>{record.classification}</div>
							</Col>
							<Col xs={12} md={6} lg={6}>
								<div style={{ fontWeight: 500, color: "#555" }}>Source</div>
								<div>{record.source}</div>
							</Col>
						</Row>
					))}
				</div>
			</Space>
		</div>
	);
};

export default ResourceTable;
