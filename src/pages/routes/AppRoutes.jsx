import { Route, Routes } from 'react-router-dom';
import Home from '../home/Home';
import SearchPage from '../search_page/SearchPage';
import AgTAP from '../ag_tap/AgTAP';
import Tools from '../tools/Tools';
import Resources from '../resources/Resources';
import About from '../about/About';
import Feature from '../../components/articles/AWFeature';
import NotFound from './NotFound';

import Dashboards from '../../apps/dashboards/Dashboards';
import IrrigWaterUse from '../../apps/irrig_water_use/IrrigWaterUse';
import OregonCropWaterUse from '../../apps/oregon_crop_water_use/CropWaterUse';
import AgSNA from '../../apps/ag_sna/AgSNA';
import VegNutrientPlan from '../../apps/veg_nutrient_plan/VegNutrientPlan';
import Wotus from '../../apps/wotus/Wotus';
import Drought from '../../apps/drought/Drought';
import CropCoeffCalculator from '../../apps/crop_coeff_calculator/CropCoeffCalculator';
//import UserRegistration from '../../apps/crop_management_system/UserRegistration';

import Agrimet from '../../apps/agrimet/Agrimet';
import Calculators from '../../pages/calculators/Calculators';

import SubmitArticle from '../submit_article/SubmitArticle';
import SubmitSourceForm from '../../components/ollama_chat/SubmitSourceForm';
import ShowSources from '../../components/ollama_chat/ShowSources';
import Documentation from '../doc/Documentation';
import Chat from '../../pages/chat/Chat';
import EvalChat from '../../components/ollama_chat/EvalChat';

import FundingSources from '../funding_sources/FundingSources';
import Test from '../test/Test';

import RagLlmEval from '../../pages/rag_llm_eval/RagLlmEval';

import ExperimentCard from '../../pages/sensor_experiment_cards/SensorExperimentCards';

import GetSensorObservations from '../../pages/get_sensor_observations/GetSensorObservations';

import AgWqPlan from '../../apps/ag_wq_plan/AgWqPlan';
import AgWqPlanEditor from '../../apps/ag_wq_plan/AgWqPlanEditor';
import AgWqPlanAdminPanel from '../../apps/ag_wq_plan/AgWqPlanAdminPanel';

import NewExperiment from '../../pages/new_experiment/NewExperiment';
import NeedsAssessment from '../../components/needs_assessment/NeedsAssessment';
import UploadObservations from '../../pages/upload_observations/UploadObservations';
import SmartTAPPilot1 from '../../pages/Smart_TAP_Pilot_1/SmartTAPPilot1';

import DroughtSurvey from '../../pages/survey/DroughtSurvey';
import DroughtSurvey1 from '../../pages/survey/DroughtSurvey1';
import SurveyResults from '../../pages/survey/SurveyResults';
import Contact from '../../pages/contact_form/Contact';

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agTap" element={<AgTAP />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/feature/:id" element={<Feature />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/surveyResults" element={<SurveyResults />} >
            <Route path=":id" element={<SurveyResults />} />
        </Route>
        <Route path="/pages/calculators" element={<Calculators />} />
        <Route path="/apps/irrigWaterUse" element={<IrrigWaterUse />} />
        <Route path="/apps/oregonCropWaterUse" element={<OregonCropWaterUse />} />
        <Route path="/apps/vegNutrientPlan" element={<VegNutrientPlan />} />

        <Route path="/apps/agWqPlan" element={<AgWqPlan />} />
        <Route path="/apps/agWqPlanEditor" element={<AgWqPlanEditor />} />
        <Route path="/apps/agWqPlanAdminPanel" element={<AgWqPlanAdminPanel />} />

        <Route path="/apps/agSNA" element={<AgSNA />} />        
        <Route path="/apps/wotus" element={<Wotus />} />
        <Route path="/apps/drought" element={<Drought />} />
        <Route path="/droughtSurvey" element={<DroughtSurvey />} />
        <Route path="/droughtSurvey1" element={<DroughtSurvey1 />} />
        <Route path="/apps/cropCoeffCalculator" element={<CropCoeffCalculator />} />

        <Route path="/apps/agrimet" element={<Agrimet />} />

        <Route path="/funding" element={<FundingSources />} />


        <Route path="/submitArticle/:id" element={<SubmitArticle />} />
        <Route path="/submitSource" element={<SubmitSourceForm />} />
        <Route path="/showSources" element={<ShowSources />} />

        <Route path="/login" element={<Home />} />
        <Route path="/dashboards" element={<Dashboards />} />
        <Route path="/doc" element={<Documentation />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/evalchat" element={<EvalChat />} />
        <Route path="/test" element={<Test />} />

        <Route path="/needs" element={<NeedsAssessment />} />

        <Route path="/ragLlmEval" element={<RagLlmEval />} />

        <Route path="/experimentCards" element={<ExperimentCard />} />

        <Route path="/getSensorObservations" element={<GetSensorObservations />} />

        <Route path="/newExperiment" element={<NewExperiment />} />

        <Route path="/uploadObservations" element={<UploadObservations />} />

        <Route path="/apps/smartTap" element={<SmartTAPPilot1 />} />


        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />

    </Routes>
);

export default AppRoutes;
