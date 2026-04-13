import { Card, Button, Typography, Form, Select, AutoComplete, Input, Rate } from 'antd';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

//const { Step } = Steps;
const { Title } = Typography;

// Cookie helpers
function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

const NeedsAssessment = () => {
    const [showSurvey, setShowSurvey] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showOther, setShowOther] = useState(false);

    const  userID = useRef(null);

    const [form] = Form.useForm();

    const units = [
        {
            label: 'County Extension Offices',
            options: [
                { label: 'Baker County Extension', value: 'Baker County Extension' },
                { label: 'Benton County Extension', value: 'Benton County Extension' },
                { label: 'Clackamas County Extension - North Willamette Research and Extension Center', value: 'Clackamas County Extension - North Willamette Research and Extension Center' },
                { label: 'Clatsop County Extension', value: 'Clatsop County Extension' },
                { label: 'Columbia County Extension', value: 'Columbia County Extension' },
                { label: 'Confederated Tribes of Warm Springs Extension', value: 'Confederated Tribes of Warm Springs Extension' },
                { label: 'Coos County Extension', value: 'Coos County Extension' },
                { label: 'Crook County Extension', value: 'Crook County Extension' },
                { label: 'Curry County Extension', value: 'Curry County Extension' },
                { label: 'Deschutes County Extension', value: 'Deschutes County Extension' },
                { label: 'Douglas County Extension', value: 'Douglas County Extension' },
                { label: 'Gilliam County Extension', value: 'Gilliam County Extension' },
                { label: 'Grant County Extension', value: 'Grant County Extension' },
                { label: 'Harney County Extension', value: 'Harney County Extension' },
                { label: 'Hood River County Extension', value: 'Hood River County Extension' },
                { label: 'Jackson County Extension', value: 'Jackson County Extension' },
                { label: 'Jackson County - Southern Oregon Research and Extension Center', value: 'Jackson County - Southern Oregon Research and Extension Center' },
                { label: 'Jefferson County Extension - Central Oregon Agricultural Research and Extension Center', value: 'Jefferson County Extension - Central Oregon Agricultural Research and Extension Center' },
                { label: 'Jefferson County', value: 'Jefferson County' },
                { label: 'Josephine County Extension', value: 'Josephine County Extension' },
                { label: 'Klamath County Extension', value: 'Klamath County Extension' },
                { label: 'Lake County Extension', value: 'Lake County Extension' },
                { label: 'Lane County Extension', value: 'Lane County Extension' },
                { label: 'Lane County Extension Florence satellite office', value: 'Lane County Extension Florence satellite office' },
                { label: 'Lane County Extension Oakridge satellite office', value: 'Lane County Extension Oakridge satellite office' },
                { label: 'Lincoln County Extension', value: 'Lincoln County Extension' },
                { label: 'Linn County Extension', value: 'Linn County Extension' },
                { label: 'Malheur County Extension', value: 'Malheur County Extension' },
                { label: 'Malheur County Extension satellite office', value: 'Malheur County Extension satellite office' },
                { label: 'Marion County Extension', value: 'Marion County Extension' },
                { label: 'Morrow County Extension', value: 'Morrow County Extension' },
                { label: 'Multnomah County', value: 'Multnomah County' },
                { label: 'Polk County Extension', value: 'Polk County Extension' },
                { label: 'Sherman County Extension', value: 'Sherman County Extension' },
                { label: 'Tillamook County Extension', value: 'Tillamook County Extension' },
                { label: 'Umatilla County - Hermiston Agriculture Research and Extension Center', value: 'Umatilla County - Hermiston Agriculture Research and Extension Center' },
                { label: 'Umatilla County Extension', value: 'Umatilla County Extension' },
                { label: 'Umatilla County Extension Hermiston satellite office', value: 'Umatilla County Extension Hermiston satellite office' },
                { label: 'Umatilla County Extension Milton - Freewater satellite office', value: 'Umatilla County Extension Milton - Freewater satellite office' },
                { label: 'Union County Extension', value: 'Union County Extension' },
                { label: 'Wallowa County Extension', value: 'Wallowa County Extension' },
                { label: 'Wasco County Extension', value: 'Wasco County Extension' },
                { label: 'Washington County Extension', value: 'Washington County Extension' },
                { label: 'Wheeler County Extension', value: 'Wheeler County Extension' },
                { label: 'Yamhill County Extension', value: 'Yamhill County Extension' }
            ]
        },
        {
            label: 'Research and Experiment Stations',
            options: [
                { label: 'Astoria | Seafood Research & Education Center', value: 'Astoria | Seafood Research & Education Center' },
                { label: 'Burns | Eastern Oregon Agricultural Research Center (Burns)', value: 'Burns | Eastern Oregon Agricultural Research Center (Burns)' },
                { label: 'Aurora | North Willamette Research & Extension Center', value: 'Aurora | North Willamette Research & Extension Center' },
                { label: 'Central Point | Southern Oregon Research & Extension Center', value: 'Central Point | Southern Oregon Research & Extension Center' },
                { label: 'Corvallis Farm Unit', value: 'Corvallis Farm Unit' },
                { label: 'Hermiston | Hermiston Agricultural Research & Extension Center', value: 'Hermiston | Hermiston Agricultural Research & Extension Center' },
                { label: 'Hood River | Mid-Columbia Agricultural Research & Extension Center', value: 'Hood River | Mid-Columbia Agricultural Research & Extension Center' },
                { label: 'Klamath Falls | Klamath Basin Research & Extension Center', value: 'Klamath Falls | Klamath Basin Research & Extension Center' },
                { label: 'Madras | Central Oregon Agricultural Research & Extension Center', value: 'Madras | Central Oregon Agricultural Research & Extension Center' },
                { label: 'Malheur | Malheur Experiment Station', value: 'Malheur | Malheur Experiment Station' },
                { label: 'Newport | Coastal Oregon Marine Experiment Station', value: 'Newport | Coastal Oregon Marine Experiment Station' },
                { label: 'Pendleton | Columbia Basin Agricultural Research Center', value: 'Pendleton | Columbia Basin Agricultural Research Center' },
                { label: 'Portland | Food Innovation Center', value: 'Portland | Food Innovation Center' },
                { label: 'Union | Eastern Oregon Agricultural Research Center (Union)', value: 'Union | Eastern Oregon Agricultural Research Center (Union)' }
            ]
        },
        {
            label: 'Campuses and Statewide Programs', options: [
                { label: 'Corvallis campus / statewide Extension programs', value: 'Corvallis campus / statewide Extension programs' },
                { label: 'OSU Cascades (Bend)', value: 'OSU Cascades (Bend)' },
                { label: 'Washington State University', value: 'Washington State University' },
                { label: 'UC-Davis', value: 'UC-Davis' },
                { label: 'University of Idaho', value: 'University of Idaho' }
            ]
        },
        {
            label: 'Other', options: [
                { label: 'Other (please indicate below)', value: 'other' },
                { label: "Don't know", value: "Don't know" },
                { label: 'Prefer not to answer', value: 'Prefer not to answer' }
            ]
        }
    ];

    const orgs = [
        { label: 'Oregon Department of Forestry (ODF)', value: 'Oregon Department of Forestry (ODF)' },
        { label: 'Oregon Water Resources Department (OWRD)', value: 'Oregon Water Resources Department (OWRD)' },
        { label: 'Oregon Department of Environmental Quality (DEQ)', value: 'Oregon Department of Environmental Quality (DEQ)' },
        { label: 'Oregon Department of Fish & Wildlife (ODFW)', value: 'Oregon Department of Fish & Wildlife (ODFW)' },
        { label: 'Oregon Department of Land Conservation & Development (DLCD)', value: 'Oregon Department of Land Conservation & Development (DLCD)' },
        { label: 'Oregon Department of Energy (ODOE)', value: 'Oregon Department of Energy (ODOE)' },
        { label: 'Oregon Department of Human Services (ODHS)', value: 'Oregon Department of Human Services (ODHS)' },
        { label: 'Oregon Department of Justice (DOJ)', value: 'Oregon Department of Justice (DOJ)' },
        { label: 'Watershed Councils', value: 'Watershed Councils' },
        { label: 'Soil & Water Conservation Districts (SWCDs)', value: 'Soil & Water Conservation Districts (SWCDs)' },
        { label: 'County Government', value: 'County Government' },
        { label: 'City Government', value: 'City Government' },
        { label: 'USDA Natural Resources Conservation Service (NRCS)', value: 'USDA Natural Resources Conservation Service (NRCS)' },
        { label: 'US Forest Service (USFS)', value: 'US Forest Service (USFS)' },
        { label: 'USDA Farm Service Agency (FSA)', value: 'USDA Farm Service Agency (FSA)' },
        { label: 'Bureau of Land Management (BLM)', value: 'Bureau of Land Management (BLM)' },
        { label: 'US Fish & Wildlife Service (USFWS)', value: 'US Fish & Wildlife Service (USFWS)' },
        { label: 'Oregon Farm Bureau', value: 'Oregon Farm Bureau' },
        { label: 'Oregon Cattlemen’s Association', value: 'Oregon Cattlemen’s Association' },
        { label: 'Oregon Dairy Farmers Association', value: 'Oregon Dairy Farmers Association' },
        { label: 'Oregon Wheat Growers League', value: 'Oregon Wheat Growers League' },
        { label: 'Oregon Grass Seed Growers League', value: 'Oregon Grass Seed Growers League' },
        { label: 'Oregon Winegrowers Association', value: 'Oregon Winegrowers Association' },
        { label: 'Oregon Hazelnut Growers Association', value: 'Oregon Hazelnut Growers Association' },
        { label: 'Oregon Hop Growers Association', value: 'Oregon Hop Growers Association' },
        { label: 'Oregon Seed Council', value: 'Oregon Seed Council' },
        { label: 'Oregon Nursery Association', value: 'Oregon Nursery Association' },
        { label: 'Oregon Albacore Commission', value: 'Oregon Albacore Commission' },
        { label: 'Oregon Beef Council', value: 'Oregon Beef Council' },
        { label: 'Oregon Blueberry Commission', value: 'Oregon Blueberry Commission' },
        { label: 'Oregon Clover Seed Commission', value: 'Oregon Clover Seed Commission' },
        { label: 'Oregon Dairy Products Commission', value: 'Oregon Dairy Products Commission' },
        { label: 'Oregon Dungeness Crab Commission', value: 'Oregon Dungeness Crab Commission' },
        { label: 'Oregon Fine Fescue Commission', value: 'Oregon Fine Fescue Commission' },
        { label: 'Oregon Forage & Grassland Council', value: 'Oregon Forage & Grassland Council' },
        { label: 'Oregon Hay & Forage Association', value: 'Oregon Hay & Forage Association' },
        { label: 'National Alfalfa & Forage Alliance', value: 'National Alfalfa & Forage Alliance' },
        { label: 'Oregon Hazelnut Commission', value: 'Oregon Hazelnut Commission' },
        { label: 'Oregon Hemp Commission', value: 'Oregon Hemp Commission' },
        { label: 'Oregon Hop Commission', value: 'Oregon Hop Commission' },
        { label: 'Oregon Mint Commission', value: 'Oregon Mint Commission' },
        { label: 'Oregon Potato Commission', value: 'Oregon Potato Commission' },
        { label: 'Oregon Processed Vegetable Commission', value: 'Oregon Processed Vegetable Commission' },
        { label: 'Oregon Raspberry & Blackberry Commission', value: 'Oregon Raspberry & Blackberry Commission' },
        { label: 'Oregon Ryegrass Growers Seed Commission', value: 'Oregon Ryegrass Growers Seed Commission' },
        { label: 'Oregon Salmon Commission', value: 'Oregon Salmon Commission' },
        { label: 'Oregon Sheep Commission', value: 'Oregon Sheep Commission' },
        { label: 'Oregon Strawberry Commission', value: 'Oregon Strawberry Commission' },
        { label: 'Oregon Sweet Cherry Commission', value: 'Oregon Sweet Cherry Commission' },
        { label: 'Oregon Tall Fescue Commission', value: 'Oregon Tall Fescue Commission' },
        { label: 'Oregon Trawl Commission', value: 'Oregon Trawl Commission' },
        { label: 'Oregon Wheat Commission', value: 'Oregon Wheat Commission' },
        { label: 'University of Oregon', value: 'University of Oregon' },
        { label: 'Portland State University', value: 'Portland State University' },
        { label: 'Oregon Tech', value: 'Oregon Tech' },
        { label: 'The Nature Conservancy', value: 'The Nature Conservancy' },
        { label: 'Trout Unlimited', value: 'Trout Unlimited' },
        { label: 'Sustainable Northwest', value: 'Sustainable Northwest' },
        { label: 'Confederated Tribes of the Umatilla Indian Reservation', value: 'Confederated Tribes of the Umatilla Indian Reservation' },
        { label: 'Confederated Tribes of Warm Springs', value: 'Confederated Tribes of Warm Springs' },
        { label: 'Confederated Tribes of Grand Ronde', value: 'Confederated Tribes of Grand Ronde' },
        { label: 'Confederated Tribes of Siletz Indians', value: 'Confederated Tribes of Siletz Indians' },
        { label: 'Klamath Tribes', value: 'Klamath Tribes' },
        { label: 'Nutrien Ag Solutions', value: 'Nutrien Ag Solutions' },
        { label: 'Wilbur-Ellis', value: 'Wilbur-Ellis' },
        { label: 'Pacific Seafood', value: 'Pacific Seafood' },
        { label: 'Other (please let us know)', value: 0 }
        ];
    /*
7.	If space allows, we could also include additional follow-up questions for each listed organization. 
    It is also fine if these are not covered. 
    "How much do you trust information from XX (each organization they listed) ?” 
    “Not at all, Slightly, Moderately, Very, Extremely”  or 
    "What do you typically interact with XX?” "Technical knowledge, Policy/advocacy, Funding, Research, Farmer outreach, others"
8.	
Malena and Derek,

Thank you both for your helpful comments! Below are point-to-point responses. Here is the revised preview in Qualtrics.

Malena’s comments:
•	Since we’re targeting the Extension Conference, I wonder if the first two questions — "What is your area(s) of expertise?"
 and "What is the general size of operation (number of acres) you work/provide services for?" — are needed.
  They may not be relevant for this group.
•	It might be useful to learn about extension people’s expertise and clients.
•	I’d also suggest moving the question about organizations to spot 5. That might help the survey flow better.
•	The organization questions have been moved to spot 5.
•	In question 4, the font size of some options looks smaller. Also, could we try a different color for “Tools Development”? It’s a bit hard to distinguish right now.
•	The font size has been larger.
•	Lastly, for question 5, asking just for their email might be simpler.
              Done, only email is asked.

Derek’s comments:
If you keep the first question, it should be “Where is your primary home office located?” The options are not their primary organization.
Done. The question has been revised accordingly.
 
If you keep the third question about operation size, I would modify it to be “Is your primary audience large-scale or small-scale operations?”
 They can define this as they would like. Generally, large-scale operations are producing wholesale products, while 
 
 small-scale operations produce final products for direct marketing to consumers. A common large-scale exception would be growing hay. The operation scale is more important than acreage.   
Thanks, I see the values of large scale and small scale. People's definitions of large and small would be different. The acreage would be helpful to make them consistent.
 
Fourth question – Modify to “primary crops or livestock operations?”
The question has been revised accordingly.
 
Fifth question – I suggest adding an “Other” to each color list – Tools, Research, O&E. For my understanding, why is this list limited to these items? Are these Ag Water TAP priorities? I don’t feel like Yu Lu’s and my contributions are represented. Maybe this list is expanded in the future?
Thanks! The “other" is at the end, and we could continue to work on the list.

Many organizations are missing, such as Oregon Forage & Grassland Council, Oregon Hay & Forage Association, National Alfalfa & Forage Alliance, and the many related to small farm operations. It may be better to have folks provide their type 5, or provide their top 5 of a specific type, rather than have them choose from a list.
Agree that many are missing. Both the roster and name-generator approaches have trade-offs (coverage vs. clean data).
*/


    const surveySteps = [
        {
            title: 'Background Information', description: 'Tell us a little about yourself.  Your information will not be shared outside of the AgTAP',
            questions: [
                {
                    question: 'Which OSU Extension or Research unit is your primary organization?',
                    type: 'multiple-choice', code: 'primary_organization', show_other: 1,
                    options: units
                },
                {
                    question: 'What is your area(s) of expertise? (select all that apply)', 
                    type: 'multiple-answer', code: 'areas_of_expertise', show_other: 0, 
                    options:
                        [
                            { label: 'Irrigation Management', value: 'Irrigation Management' },
                            { label: 'Soil Health', value: 'Soil Health' },
                            { label: 'Water Quality', value: 'Water Quality' },
                            { label: 'Crop Management', value: 'Crop Management' },
                            { label: 'Livestock Management', value: 'Livestock Management' },
                            { label: 'Policy & Regulation', value: 'Policy & Regulation' },
                            { label: 'Other (please indicate below)', value: 'other' }
                        ]
                },
                {
                    question: 'What is general audience you work/provide services for? (select all that apply)?',
                    type: 'multiple-answer', code: 'audience', show_other: 1, options:
                        [
                            { label: 'Small-scale Producers', value: 'Small-scale Producers' },
                            { label: 'Large-scale Producers', value: 'Large-scale Producers' },
                            { label: 'Direct-to-Consumer Producers', value: 'Direct-to-Consumer Producers' },
                            { label: 'Wholesaler Producers', value: 'Wholesaler Producers' },
                            { label: "Organic Producers", value: 'Organic Producers' },
                            { label: "K-12 Education", value: 'K-12 Education' },
                            { label: 'Other Agricultural', value: 'Other Agricultural' },
                            { label: 'Other Non-Agricultural', value: 'Other Non-Agricultural' }
                        ]
                },
                {
                    question: 'What types of crops and livestock operations do you primarily work with? (select all that apply)',
                    type: 'multiple-answer', code: 'crop_types', show_other: 0, options:
                        [
                            { label: 'Cereals/Grains', value: 'Cereals/Grains' },
                            { label: 'Fruits', value: 'Fruits' },
                            { label: 'Vegetables', value: 'Vegetables' },
                            { label: 'Seed Crops', value: 'Seed Crops' },
                            { label: 'Hay/Forage', value: 'Hay/Forage' },
                            { label: 'Nursery/Greenhouse', value: 'Nursery/Greenhouse' },
                            { label: 'Vineyards', value: 'Vineyards' },
                            { label: 'Beef cattle', value: 'Beef cattle' },
                            { label: 'Dairy cattle', value: 'Dairy cattle' },
                            { label: 'Sheep/goats', value: 'Sheep/goats' },
                            { label: 'Hogs/Pigs', value: 'Hogs/Pigs' },
                            { label: 'Other', value: 'other' }
                        ]
                }
            ]
        },
        {
            title: 'Prioritize Technical Assistance Needs', 
            description: 'Indicate below what your priorities are for the AgWaterTAP program. Rate your priority for as many areas listed below as you like. Your responses will help us better tailor our program to meet your needs.',
            questions: [
                {
                    question: 'What are the MOST IMPORTANT areas that we should prioritize to best assist farmers, researchers, and policymakers?',
                    type: 'multi-rating',  code: 'priorities', count: 5, show_other: 1,
                    tooltips: [
                        'Not important',
                        'Low Priority',
                        'Moderate Priority',
                        'High Priority',
                        'Critical'
                    ],
                    options: [
                        { label: 'Irrigation efficiency and water conservation', value: 'Irrigation efficiency and water conservation' },
                        { label: 'Drought resilience and adaptation strategies', value: 'Drought resilience and adaptation strategies' },
                        { label: 'Soil health and management', value: 'Soil health and management' },
                        { label: 'Crop diversification and resilience', value: 'Crop diversification and resilience' },
                        { label: 'Livestock management and health', value: 'Livestock management and health' },
                        { label: 'Water quality and management', value: 'Water quality and management' },
                        { label: 'Policy and regulatory support', value: 'Policy and regulatory support' },
                        { label: 'Climate change impacts and mitigation', value: 'Climate change impacts and mitigation' },
                        { label: 'Technology adoption and innovation', value: 'Technology adoption and innovation' },
                        { label: 'Economic analysis and market access', value: 'Economic analysis and market access' },
                        { label: 'Groundwater Knowledge Visualization', value: 'Groundwater Knowledge Visualization' },
                        { label: 'Irrigation Scheduling/Decision-Support Tools', value: 'Irrigation Scheduling/Decision-Support Tools' },
                        { label: 'Online Realtime ET Summaries', value: 'Online Realtime ET Summaries' },
                        { label: 'Groundwater Management', value: 'Groundwater Management' },
                        { label: 'Updated Guides on Oregon-specific', value: 'Updated Guides on Oregon-specific' },
                        { label: 'Field Days Workshops', value: 'Field Days Workshops' },
                        { label: 'Testing Ag Performance Solutions (TAPS) Competition', value: 'Testing Ag Performance Solutions (TAPS) Competition' },
                        { label: 'Water on Wheels (WOW) Trailer', value: 'Water on Wheels (WOW) Trailer' },
                        { label: 'On-farm Demonstration Networks', value: 'On-farm Demonstration Networks' },
                        { label: 'Agrivoltaics', value: 'Agrivoltaics' },
                    ]
                },
                { question: "Have other ideas? Let us know below.", type: 'none', topbreak:true, show_other: 0 },
                { question: " ", type: 'none', topbreak:true, show_other: 0 },
                { question: "Other Priority:", type: 'text', code: 'priorities_other_1', show_other: 0 },
                { question: "Other Priority:", type: 'text', code: 'priorities_other_2', show_other: 0 },
                { question: "Other Priority:", type: 'text', code: 'priorities_other_3', show_other: 0 },
            ]
        },
        {
            title: 'Which organizations do you most frequently communicate with?', 
            description: 'Indicate up to five organizations you communicate with.  For each organization, please rate the frequency of communication with each organization that you work with below. We will use this information to help build a knowledge network for the state of Oregon.',
            questions: [
                { question: "Organization 1", type: 'multiple-choice', code: 'comm_org_1', show_other: 0, options: orgs },
                { question: "Rate the frequency of communication with Organization 1", 
                    type: 'rating', code: 'comm_freq_1', show_other: 0, count: 4, tooltips: ['Rarely','Occasionally','Frequently','Very Frequently'] },
                { question: "Rate your level of trust in Organization 1", 
                    type: 'rating', code: 'comm_trust_1', show_other: 0, count: 5, tooltips: ['Not at all','Slightly','Moderately','Very','Extremely'] },

                { question: "Organization 2", type: 'multiple-choice', code: 'comm_org_2', show_other: 0, topbreak: true, options: orgs },
                { question: "Rate the frequency of communication with Organization 2", 
                    type: 'rating', code: 'comm_freq_2', show_other: 0, count: 4, tooltips: ['Rarely','Occasionally','Frequently','Very Frequently'] },
                { question: "Rate your level of trust in Organization 2", 
                    type: 'rating', code: 'comm_trust_2', show_other: 0, count: 5, tooltips: ['Not at all','Slightly','Moderately','Very','Extremely'] },

                { question: "Organization 3", type: 'multiple-choice', code: 'comm_org_3', show_other: 0, topbreak: true, options: orgs },
                { question: "Rate the frequency of communication with Organization 3", 
                    type: 'rating', code: 'comm_freq_3', show_other: 0, count: 4, tooltips: ['Rarely','Occasionally','Frequently','Very Frequently'] },
                { question: "Rate your level of trust in Organization 3", 
                    type: 'rating', code: 'comm_trust_3', show_other: 0, count: 5, tooltips: ['Not at all','Slightly','Moderately','Very','Extremely'] },

                { question: "Organization 4", type: 'multiple-choice', code: 'comm_org_4', show_other: 0, topbreak: true, options: orgs },
                { question: "Rate the frequency of communication with Organization 4", 
                    type: 'rating', code: 'comm_freq_4', show_other: 0, count: 4, tooltips: ['Rarely','Occasionally','Frequently','Very Frequently'] },
                { question: "Rate your level of trust in Organization 4", 
                    type: 'rating', code: 'comm_trust_4', show_other: 0, count: 5, tooltips: ['Not at all','Slightly','Moderately','Very','Extremely'] },

                { question: "Organization 5", type: 'multiple-choice', code: 'comm_org_5', show_other: 0, topbreak: true, options: orgs },
                { question: "Rate the frequency of communication with Organization 5", 
                    type: 'rating', code: 'comm_freq_5', show_other: 0, count: 4, tooltips: ['Rarely','Occasionally','Frequently','Very Frequently'] },
                { question: "Rate your level of trust in Organization 5", 
                    type: 'rating', code: 'comm_trust_5', show_other: 0, count: 5, tooltips: ['Not at all','Slightly','Moderately','Very','Extremely'] },
                ]
        },
        {
            title: 'Wrapping Up', description: 'We are just about finished. Please provide any additional information below.',
            questions: [
                { question: "If you’re interested in joining our AgWaterTAP listserv and contributing your expertise to our team, please indicate your name and email address below.", type: 'none', show_other: 0 },
                { question: "Name:", type: 'text', code: 'name', show_other: 0 },
                { question: "Email address:", type: 'text', code: 'email', show_other: 0 },
                { question: 'Please share any additional comments or suggestions that could help improve our efforts moving forward.', type: 'text-area', placeholder: 'Your comments here...', code: 'comments', show_other: 0 }
            ]
        }
    ];


    // Check for user_guid cookie and redirect if present
    useEffect(() => {
        const _userID = getCookie("agwater_survey_user_id");
        if (_userID)
            userID.current = _userID;
        else {
            userID.current = uuidv4();
            setCookie("agwater_survey_user_id", userID.current, 365);
        } 
     }, []);


    const handleStartSurvey = () => {
        setShowSurvey(true);
    };

    const handleNext = () => {
        setCurrentStep(currentStep + 1);
        // Scroll to top of card
        const cardElement = document.querySelector('.ant-card');
        if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
        // Scroll to top of card
        const cardElement = document.querySelector('.ant-card');
        if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const onFinish = values => {
        handleNext();
        const data = []; 
        for (const key in values)
            data.push({question: key, response: values[key] ? values[key] : ''});

        const body = JSON.stringify({survey_id: 1, session_id: userID.current, data: data});
        console.log('Received values of form: ', body);

        // post the data to the server using fetch
        const url = 'https://agwater.org:5556/survey/data';        

        if (currentStep === surveySteps.length - 1) {
            fetch(url, {
                method: 'POST',
                headers: {
                    "X-API-Key": "survey-web-app",
                    'Content-Type': 'application/json'
                },
                body: body
            })
            .then(response => {
                if (response.ok) {
                    console.log('Survey data submitted successfully');

                } else {
                    console.error('Error submitting survey data');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    };

    if (showSurvey) {
        return (
            <div style={{ padding: '4px', paddingTop: '1em', display: 'flex', justifyContent: 'center' }}>
                <Card
                    title="AgWaterTAP Needs Assessment Survey"
                    style={{ width: '100%', maxWidth: '900px', textAlign: 'left' }}
                >
                    <div style={{ minHeight: '400px', marginBottom: '20px' }}>
                        {/* Survey content will go here based on currentStep */}
                        {currentStep < surveySteps.length ? (
                            <>
                                <Title level={3}>{surveySteps[currentStep].title}</Title>
                                <Title level={5}>{surveySteps[currentStep].description}</Title>
                                <Form
                                    layout="vertical"
                                    onFinish={onFinish}
                                    form={form}
                                >
                                    {surveySteps.map((step, i) => (
                                        <div key={'step_' + i} style={{ display: currentStep === i ? 'block' : 'none' }}>
                                            {step.questions.map((q, index) => (
                                                <div key={'step_' + i + '_' + index}>
                                                    {q.topbreak && <br />}

                                                    {q.type === 'multiple-choice' && (
                                                        <>
                                                        <Form.Item name={q.code} label={q.question} >

                                                            <AutoComplete
                                                                options={q.options}
                                                                placeholder="enter the organizations name"
                                                                onSelect={(value, option) => {
                                                                    if (value.toUpperCase().includes('OTHER')) {
                                                                        setShowOther(true);
                                                                    }
                                                                }}
                                                                filterOption={(inputValue, option) =>
                                                                    option.options ? false : option.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                                                }
                                                            />
                                                        </Form.Item>

                                                        {(showOther && q.show_other > 0 ) 
                                                            && (form.getFieldValue(q.code)) 
                                                            && (form.getFieldValue(q.code).toUpperCase().includes('OTHER'))
                                                            && ([...Array(q.show_other)].map((e, _i) => (
                                                                <div key={q.code + '-other-div-' + _i} style={{ display: currentStep === i ? 'flex' : 'none', alignItems: 'center', marginBottom: '10px' }}>
                                                                    <span key={'other_span_' + index + '_' + _i} style={{ marginLeft: '2em', paddingBottom: '1.5em' }}>Other:</span>
                                                                    <Form.Item key={q.code + '-other-' + _i} name={q.code + '-other-' + _i} style={{ display: currentStep === i ? 'inline-block' : 'none', marginLeft: '1em', width: '60%' }}>
                                                                        <Input key={'other_' + index + '_' + _i} placeholder="Please indicate any other options here." />
                                                                    </Form.Item>
                                                                </div>
                                                            )))}
                                                        </>
                                                    )}

                                                    {q.type === 'multiple-answer' && (
                                                        <>
                                                        <Form.Item name={q.code} label={q.question}>
                                                            <Select
                                                                mode="multiple"
                                                                allowClear
                                                                options={q.options}
                                                            />
                                                        </Form.Item>
                                                        {(showOther && q.show_other > 0 ) 
                                                            && (form.getFieldValue(q.code))
                                                            && (form.getFieldValue(q.code).toUpperCase().includes('OTHER'))
                                                            && ([...Array(q.show_other)].map((e, _i) => (
                                                                <div key={q.code + '-other-div-' + _i} style={{ display: currentStep === i ? 'flex' : 'none', alignItems: 'center', marginBottom: '10px' }}>
                                                                    <span key={'other_span_' + index + '_' + _i} style={{ marginLeft: '2em', paddingBottom: '1.5em' }}>Other:</span>
                                                                    <Form.Item key={q.code + '-other-' + _i} name={q.code + '-other-' + _i} style={{ display: currentStep === i ? 'inline-block' : 'none', marginLeft: '1em', width: '60%' }}>
                                                                        <Input key={'other_' + index + '_' + _i} placeholder="Please indicate any other options here." />
                                                                    </Form.Item>
                                                                </div>
                                                        )))}
                                                        </>
                                                    )}

                                                    {q.type === 'rating' && (
                                                        <div key={'div_rating_' + q.code} style={{ display: currentStep === i ? 'flex' : 'none', marginBottom: '10px', alignItems: 'center' }}>
                                                            <span style={{ marginRight: '10px'}}>{q.question}</span>
                                                            <Form.Item name={q.code} style={{  display: 'inline-block', margin: 0, minWidth: '' + q.count * 2 + 'em' }}>
                                                                <Rate key={q.code + '_rating'} count={q.count} tooltips={q.tooltips ? q.tooltips : []} />
                                                            </Form.Item>
                                                        </div>
                                                    )}

                                                    {q.type === 'multi-rating' && <hr/>}
                                                    {q.type === 'multi-rating' && q.tooltips.map((tooltip, idx) => (
                                                        <>
                                                            { idx > 0 && <br/> }
                                                            <Rate key={'mrating_' + i + '_' + index + '_' + idx}  disabled defaultValue={idx+1} count={q.count} /><span style={{marginLeft: '2em'}}>{tooltip}</span>
                                                        </>
                                                    ))}
                                                    {q.type === 'multi-rating' && <hr/>}

                                                    {q.type === 'multi-rating' && q.options.map((option, idx) => (
                                                        <div key={'div_mrating' + i + '_' + index + '_' + idx} style={{ display: currentStep === i ? 'flex' : 'none', marginBottom: '10px', alignItems: 'center' }}>
                                                            <span style={{ marginRight: '10px'}}>{option.label}</span>
                                                            <Form.Item name={q.code + '_' + option.value + '_rating'} style={{ display: 'inline-block', margin: 0, minWidth: '' + q.count * 2 + 'em' }}>
                                                                <Rate key={'mrating_' + i + '_' + index + '_' + idx} count={q.count} tooltips={q.tooltips ? q.tooltips : []} />
                                                            </Form.Item>
                                                        </div>
                                                    ))}

                                                    {q.type === 'text' && (
                                                        <Form.Item name={q.code} label={q.question} >
                                                            <Input key={'text_' + i + '_' + index} />
                                                        </Form.Item>
                                                    )}

                                                    {q.type === 'text-area' && (
                                                        <Form.Item name={q.code} label={q.question} >
                                                            <Input.TextArea key={'textarea_' + i + '_' + index} />
                                                        </Form.Item>
                                                    )}

                                                    {q.type === 'none' && (
                                                        <span>{q.question}</span>
                                                    )}

                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    <div style={{ textAlign: 'center' }}>
                                        {currentStep > 0 && (
                                            <Button style={{ marginRight: '10px', color: 'blue' }} onClick={handlePrev} >Previous</Button>
                                        )}
                                        {currentStep < surveySteps.length - 1 && (
                                            <Button type="primary" onClick={handleNext}>Next</Button>
                                        )}
                                        {currentStep === surveySteps.length - 1 && (
                                            <Button type="primary" htmlType="submit" >Submit Survey</Button>
                                        )}
                                    </div>

                                </Form>
                            </>
                        ) : (
                            <>
                            <Title level={2}>Thank you for completing the survey!</Title>
                            <Title level={4}>We value your time and feedback. Your responses have been recorded.</Title>
                            </>
                        )}
                    </div>

                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <Card
                title="AgWaterTAP: Agricultural Water Management Technical Assistance Program"
                style={{ width: '80%', textAlign: 'left' }}
            >
                <p>
                    <strong>An Oregon State University Research & Extension Initiative</strong>
                </p>
                <p>
                    <strong>Who are we?</strong><br />
                    We are an Oregon State University team of researchers providing technical assistance through research, outreach, and engagement activities for improving agricultural water management in Oregon.
                </p>
                <p>
                    <strong>Mission:</strong><br />
                    Support Oregon&apos;s agricultural community by providing collaborative, research-based technical assistance and resources that optimize water management and maintain thriving farms.
                </p>
                <p>
                    <strong>Vision:</strong><br />
                    A future where Oregon&apos;s growers, water managers, researchers, and communities work together for sustainable, innovative, and equitable agricultural water solutions.
                </p>
                <p>
                    Today, we&apos;d like your input to help us prioritize our research and Extension efforts across the state. What do you see as the most important areas we should focus on to best support farmers, researchers, and policymakers?
                </p>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleStartSurvey}
                    >
                        Start Survey
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default NeedsAssessment;