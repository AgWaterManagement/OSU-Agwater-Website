import { Row, Col, Card, } from 'antd';


import Maria from '../../assets/images/maria-150X150.jpg';
import Bolte from '../../assets/images/bolte-150X150.jpg';
import Malena from '../../assets/images/malena-150X150.jpg';
import Floyid from '../../assets/images/Floyid-150X150.jpg';
import Salini from '../../assets/images/salini-150X150.jpg';
import Manuel from '../../assets/images/Jamarillo-150X150.jpg';
import Jen from '../../assets/images/Jen-150X150.jpg';

const AWTeam = ({ team }) => {
    return (

        <div className="flex-container" style={{ textAlign: 'left'}}>
            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Maria Zamora, Ph.D" bordered={true} style={{ height: '100%' }}>

                    <img src={Maria} />
                    <a href="https://bee.oregonstate.edu/users/maria-zamora-re" target="_blank">Dr. Maria Zamora Re</a> is an Agricultural Water Management and Irrigation Engineering Extension
                    specialist in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
                    Her research is focused on irrigation scheduling and water allocation, evaluating evapotranspiration-based methods and Smart-irrigation tools
                    to allow growers to use more efficiently water resources. Dr. Zamora Re has investigated different irrigation and N fertilizer best management practices (BMPs),
                    aiming to reduce potential N leaching from agricultural fields without impacts on yields. Her research interests
                    lie in the water efficiency and conservation area, while helping to improve decision-making using smart irrigation and management tools.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Malena Orduna Alegria, Ph.D" bordered={true} style={{ height: '100%' }}>
                    <img src={Malena} />
                    <a href="https://bee.oregonstate.edu/users/malena-orduna-alegria" target="_blank">Dr. Malena Orduna Alegria </a>
                    is an Assistant Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
                    She specializes in examining the interelation in sociological and water resources systems, exploring factors and
                    solutions for water scarcity in agricultural landscapes, analysis of complex water networks.  Additional Interests include
                    Serious Games, Agent Based Modelling, and Irrigation optimization.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Salini Sasidharan, Ph.D" bordered={true} style={{ height: '100%' }}>
                    <img src={Salini} />
                    <a href="https://bee.oregonstate.edu/users/salini-sasidharan" target="_blank">Dr. Salini Sasidhran </a>
                    is an Assistant Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
                    She specializes in examining groundwater issues in Oregon and beyond. Her research includes understanding groundwater
                    systems, their interactions with surface waters, through fieldwork and computer modeling.  Her work includes characterizing
                    aquifer change and exploring engineering options for Aquifer Storage and Recharge (ASR) around the state.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Manuel Garcia-Jamarillo, Ph.D" bordered={true} style={{ height: '100%' }}>
                    <img src={Manuel} />
                    <a href="https://emt.oregonstate.edu/users/manuel-garcia-jaramillo" target="_blank">Dr. Manuel Garcia-Jamarillo </a>
                    is an Assistant Professor in the <a href="https://emt.oregonstate.edu/">Environmental and Molecular Toxicology department</a> at Oregon State University.
                    He and his team use state-of-the-art tools and techniques to monitor a wide variety of water sources for potential contaminents.
                    They combine risk-based approaches with effects-directed analysis (EDA) to identify unknown toxic chemical contaminants
                    in water and understand the impact of contaminants on animals and human health.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Floyid Nicolas, Ph.D" bordered={true} style={{ height: '100%' }}>
                    <img src={Floyid} />
                    <a href="https://bee.oregonstate.edu/users/floyid-nicolas" target="_blank">Dr. Floyid Nicolas </a>
                    is an Assistant Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
                    He specializes in irrigation management, crop water use, crop production modeling, and associate decision support tools.
                    He is located at the <a href='https://agsci.oregonstate.edu/coarec/central-oregon-agricultural-research-and-extension-center'>
                        Central Oregon Research and Extension Center</a> in Madras.
                </Card>
            </div>


            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="John Bolte, Ph.D" bordered={true} style={{ height: '100%' }}>
                    <img src={Bolte} />
                    <a href="https://bee.oregonstate.edu/users/john-bolte" target="_blank">Dr. John Bolte </a>
                    is a Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
                    He specializes in modeling a variety of coupled human/natural systems, including exploring the effects of a changing climate,
                    population growth and development, and valued landscape functions and ecosystem services.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400, display: team == 'website' ? 'block':'none' }}>
                <Card title="Troy Peters, Ph.D" bordered={true} style={{ height: '100%' }}>
                    <img src='https://s3.wp.wsu.edu/uploads/sites/888/2023/03/Troy-Peters-1-396x436.jpg' />
                    <a href="https://bsyse.wsu.edu/people/faculty/peters/" target="_blank">Dr. Troy Peters</a> works in the Land, Air, Water Resources, and Environmental Engineering (LAWREE) emphasis area within
                    the <a href="https://bsyse.wsu.edu/">Biological Systems Engineering department at Washington State University</a>. His primary focus is on agricultural irrigation.
                    This includes deficit irrigation, irrigation water hydraulics, irrigation scheduling and management, irrigation automation,
                    sprinkler irrigation efficiency, low energy precision application (LEPA), low elevation spray application (LESA),
                    and crop water use estimation. Troy is located at the <a href="https://iarec.wsu.edu/" target="_blank">Irrigated Agriculture Research and Extension Center</a> in Prosser, WA,
                    and is also affiliated with the <a href="https://cpaas.wsu.edu/" target="_blank">Center for Precision and Automated Agricultural Systems</a>.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400, display: team == 'website' ? 'block':'none' }}>
                <Card title="Jen Martin" bordered={true} style={{ height: '100%' }}>
                    <img src={Jen} />
                    <a href="https://bee.oregonstate.edu/users/jennifer-martin" target="_blank">Jen Martin </a> 
                    is a Faculty Research Assistant in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department </a> 
                    at Oregon State University. She specializes in scientific software and web app development and is a developer for the Agricultural 
                    Water Management website. Jen has contributed to projects across a wide range of scientific fields including genomics, bioinformatics, 
                    geophysics, oceanography, epidemiology, psychology, demography, and digital cartography.
                </Card>
            </div>
 
        </div>
    )
};


export default AWTeam;

