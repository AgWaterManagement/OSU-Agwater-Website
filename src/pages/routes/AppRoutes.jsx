import { Route, Routes } from 'react-router-dom';
import Home from '../home/Home';
import SearchPage from '../search_page/SearchPage';
import AgTAP from '../ag_tap/AgTAP';
import Resources from '../resources/Resources';
import About from '../about/About';
import Feature from '../../components/articles/AWFeature';

import Dashboards from '../../apps/dashboards/Dashboards';
import IrrigWaterUse from '../../apps/irrig_water_use/IrrigWaterUse';
import OregonCropWaterUse from '../../apps/oregon_crop_water_use/OregonCropWaterUse';
import VegNutrientPlan from '../../apps/veg_nutrient_plan/VegNutrientPlan';
import CropManagementSystem from '../../apps/crop_management_system/CropManagementSystem';
import Agrimet from '../../apps/agrimet/Agrimet';
import Calculators from '../../pages/calculators/Calculators';

import SubmitArticle from '../submit_article/SubmitArticle';
import SubmitSourceForm from '../../components/ollama_chat/SubmitSourceForm';
import ShowSources from '../../components/ollama_chat/ShowSources';
import Documentation from '../doc/Documentation';
import Chat from '../../pages/chat/Chat';
import EvalChat from '../../components/ollama_chat/EvalChat';

import Test from '../test/Test';

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agTap" element={<AgTAP />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/feature/:id" element={<Feature />} />

        <Route path="/pages/calculators" element={<Calculators />} />
        <Route path="/apps/irrigWaterUse" element={<IrrigWaterUse />} />
        <Route path="/apps/oregonCropWaterUse" element={<OregonCropWaterUse />} />
        <Route path="/apps/vegNutrientPlan" element={<VegNutrientPlan />} />
        <Route path="/apps/cms" element={<CropManagementSystem />} />
        <Route path="/apps/agrimet" element={<Agrimet />} />

        <Route path="/submitArticle/:id" element={<SubmitArticle />} />
        <Route path="/submitSource" element={<SubmitSourceForm />} />
        <Route path="/showSources" element={<ShowSources />} />

        <Route path="/login" element={<Home />} />
        <Route path="/dashboards" element={<Dashboards />} />
        <Route path="/doc" element={<Documentation />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/evalchat" element={<EvalChat />} />
        <Route path="/test" element={<Test />} />
    </Routes>
);

export default AppRoutes;
