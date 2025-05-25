import { Route, Routes } from 'react-router-dom';
import Home from '../home/Home';
import SearchPage from '../search_page/SearchPage';
import AgTAP from '../ag_tap/AgTAP';
import Tools from '../tools/Tools';
import Resources from '../resources/Resources';
import About from '../about/About';
import Feature from '../../components/articles/AWFeature';
import Dashboards from '../../apps/dashboards/Dashboards';
import IrrigWaterUse from '../../apps/irrig_water_use/IrrigWaterUse';
import OregonCropWaterUse from '../../apps/oregon_crop_water_use/OregonCropWaterUse';
import SubmitArticle from '../submit_article/SubmitArticle';
import Documentation from '../doc/Documentation';
import Test from '../test/Test';

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agTap" element={<AgTAP />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/feature/:id" element={<Feature />} />
        <Route path="/apps/irrigWaterUse" element={<IrrigWaterUse />} />
        <Route path="/apps/oregonCropWaterUse" element={<OregonCropWaterUse />} />
        <Route path="/submitArticle/:id" element={<SubmitArticle />} />
        <Route path="/login" element={<Home />} />
        <Route path="/dashboards" element={<Dashboards />} />
        <Route path="/doc" element={<Documentation />} />
        <Route path="/test" element={<Test />} />
    </Routes>
);

export default AppRoutes;
