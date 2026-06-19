import { Card, Typography} from 'antd';

const { Link } = Typography;


import Maria from '../../assets/images/maria-150X150.jpg';
import Bolte from '../../assets/images/bolte-150X150.jpg';
import Malena from '../../assets/images/malena-150X150.jpg';
import Floyid from '../../assets/images/Floyid-150X150.jpg';
import Salini from '../../assets/images/salini-150X150.jpg';
import Manuel from '../../assets/images/Jamarillo-150X150.jpg';
import Derek from '../../assets/images/DerekGodwin-150x150.jpg';
import Yu from '../../assets/images/YuLu-150X150.jpg';
import Sean from '../../assets/images/sean-higgens-150x150.jpg';
import PropTypes from 'prop-types';

const AWTeam = ({ team }) => {
    return (

        <div className="flex-container" style={{ textAlign: 'left'}}>
            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Maria Zamora, Ph.D" style={{ height: '100%' }}>

                    <img src={Maria} />
                    <Link href="https://bee.oregonstate.edu/users/maria-zamora-re" target="_blank">Dr. Maria Zamora Re</Link> is an Agricultural Water Management and Irrigation Engineering Extension
                    specialist in the <Link href="https://bee.oregonstate.edu" target="_blank">Biological & Ecological Engineering department</Link> at Oregon State University.
                    Her research is focused on irrigation scheduling and water allocation, evaluating evapotranspiration-based methods and Smart-irrigation tools
                    to allow growers to use more efficiently water resources. Dr. Zamora Re has investigated different irrigation and N fertilizer best management practices (BMPs),
                    aiming to reduce potential N leaching from agricultural fields without impacts on yields. Her research interests
                    lie in the water efficiency and conservation area, while helping to improve decision-making using smart irrigation and management tools.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Malena Orduna Alegria, Ph.D" style={{ height: '100%' }}>
                    <img src={Malena} />
                    <Link href="https://bee.oregonstate.edu/users/malena-orduna-alegria" target="_blank">Dr. Malena Orduna Alegria </Link>
                    is an Assistant Professor in the <Link href="https://bee.oregonstate.edu" target="_blank">Biological & Ecological Engineering department</Link> at Oregon State University.
                    She specializes in examining the interelation in sociological and water resources systems, exploring factors and
                    solutions for water scarcity in agricultural landscapes, analysis of complex water networks.  Additional Interests include
                    Serious Games, Agent Based Modelling, and Irrigation optimization.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Salini Sasidharan, Ph.D" style={{ height: '100%' }}>
                    <img src={Salini} />
                    <Link href="https://bee.oregonstate.edu/users/salini-sasidharan" target="_blank">Dr. Salini Sasidhran </Link>
                    is an Assistant Professor in the <Link href="https://bee.oregonstate.edu" target="_blank">Biological & Ecological Engineering department</Link> at Oregon State University.
                    She specializes in examining groundwater issues in Oregon and beyond. Her research includes understanding groundwater
                    systems, their interactions with surface waters, through fieldwork and computer modeling.  Her work includes characterizing
                    aquifer change and exploring engineering options for Aquifer Storage and Recharge (ASR) around the state.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Manuel Garcia-Jamarillo, Ph.D" style={{ height: '100%' }}>
                    <img src={Manuel} />
                    <Link href="https://emt.oregonstate.edu/users/manuel-garcia-jaramillo" target="_blank">Dr. Manuel Garcia-Jamarillo </Link>
                    is an Assistant Professor in the <Link href="https://emt.oregonstate.edu/" target="_blank">Environmental and Molecular Toxicology department</Link> at Oregon State University.
                    He and his team use state-of-the-art tools and techniques to monitor a wide variety of water sources for potential contaminents.
                    They combine risk-based approaches with effects-directed analysis (EDA) to identify unknown toxic chemical contaminants
                    in water and understand the impact of contaminants on animals and human health.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Floyid Nicolas, Ph.D" style={{ height: '100%' }}>
                    <img src={Floyid} />
                    <Link href="https://bee.oregonstate.edu/users/floyid-nicolas" target="_blank">Dr. Floyid Nicolas </Link>
                    is an Assistant Professor in the <Link href="https://bee.oregonstate.edu" target="_blank">Biological & Ecological Engineering department</Link> at Oregon State University.
                    He specializes in irrigation management, crop water use, crop production modeling, and associate decision support tools.
                    He is located at the <Link href='https://agsci.oregonstate.edu/coarec/central-oregon-agricultural-research-and-extension-center' target="_blank">
                        Central Oregon Research and Extension Center</Link> in Madras.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="Derek Godwin" style={{ height: '100%' }}>
                    <img src={Derek} />
                    <Link href="https://bee.oregonstate.edu/users/derek-godwin" target="_blank">Derek Godwin</Link> is an Extension statewide Watershed Management faculty in the <Link href="https://bee.oregonstate.edu" target="_blank">Department of 
                    Biological and Ecological Engineering</Link>. He is a Professor and has been working for OSU&apos;s Extension Service 
                    since 1994 in both program and administration positions. He specializes in education and research related to 
                    minimizing impacts of urban and agriculture land use practices on surface water quality, such as the implementation of 
                    green infrastructure, low-impact development, riparian enhancement and stream restoration practices. He works with watershed 
                    councils, Soil and Water Conservation Districts, land managers and policy makers to use a holistic watershed approach to 
                    address ecosystem concerns while maintaining economic stability. Derek earned a Master’s of Science degree in Bioresource 
                    Engineering at Oregon State University and a Bachelor’s of Science degree in Forest Management and Wildlife at Virginia 
                    Polytechnic Institute and State University (Virginia Tech).
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400 }}>
                <Card title="John Bolte, Ph.D" style={{ height: '100%' }}>
                    <img src={Bolte} />
                    <Link href="https://bee.oregonstate.edu/users/john-bolte" target="_blank">Dr. John Bolte </Link>
                    is a Professor in the <Link href="https://bee.oregonstate.edu" target="_blank">Biological & Ecological Engineering department</Link> at Oregon State University.
                    He specializes in modeling a variety of coupled human/natural systems, including exploring the effects of a changing climate,
                    population growth and development, and valued landscape functions and ecosystem services.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400, display: team == 'website' ? 'block':'none' }}>
                <Card title="Troy Peters, Ph.D" style={{ height: '100%' }}>
                    <img src='https://s3.wp.wsu.edu/uploads/sites/888/2023/03/Troy-Peters-1-396x436.jpg' />
                    <Link href="https://bsyse.wsu.edu/people/faculty/peters/" target="_blank">Dr. Troy Peters</Link> works in the Land, Air, Water Resources, and Environmental Engineering (LAWREE) emphasis area within
                    the <Link href="https://bsyse.wsu.edu/" target="_blank">Biological Systems Engineering department at Washington State University</Link>. His primary focus is on agricultural irrigation.
                    This includes deficit irrigation, irrigation water hydraulics, irrigation scheduling and management, irrigation automation,
                    sprinkler irrigation efficiency, low energy precision application (LEPA), low elevation spray application (LESA),
                    and crop water use estimation. Troy is located at the <Link href="https://iarec.wsu.edu/" target="_blank">Irrigated Agriculture Research and Extension Center</Link> in Prosser, WA,
                    and is also affiliated with the <Link href="https://cpaas.wsu.edu/" target="_blank">Center for Precision and Automated Agricultural Systems</Link>.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400, display: team == 'website' ? 'block':'none' }}>
                <Card title="Yu Lu" style={{ height: '100%' }}>
                    <img src={Yu} alt="Yu Lu" />
                    <Link href="https://bee.oregonstate.edu/users/yu-lu" target="_blank">Dr. Yu Lu</Link> is an Assistant Professor of Practice
                    in Human Dimensions of Agricultural Water Management in the <Link href="https://bee.oregonstate.edu" target="_blank">Biological & Ecological Engineering department</Link> at Oregon State University.
                    She is an interdisciplinary environmental social scientist studying how people, institutions, and ecosystems interact
                    under climate and market risks and emerging technologies, and how policy and governance can better support resilient livelihoods and landscapes.
                    Using quantitative and qualitative methods, including surveys, interviews, social network analysis, and machine learning, Dr. Lu's work aims to
                    inform agricultural and conservation policy and governance in support of sustainable and resilient agricultural systems in Oregon and beyond.
                </Card>
            </div>

            <div className="flex-item" style={{ minWidth: 400, display: team == 'website' ? 'block':'none' }}>
                <Card title="Sean Higgins" style={{ height: '100%' }}>
                    <img src={Sean} alt="Sean Higgins" />
                    Sean Higgins has recently received his Bachelor of Science in Computer Science at Oregon State University, 
                    and he is delighted to begin utilizing his education towards the development of a Retrieval-Augmented Generation 
                    Large-Language Model (RAG-LLM), an AI system that uses extra documents and resources to provide answers related to 
                    agriculture and water use. He hopes that this system will be useful in providing helpful and accurate information 
                    to those who have questions about agriculture and water use.
                </Card>
            </div>
 
        </div>
    )
};


AWTeam.propTypes = {
    team: PropTypes.string
};
export default AWTeam;

