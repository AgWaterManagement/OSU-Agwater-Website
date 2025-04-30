
import { Card } from 'antd';


import './About.css'

import AWTeam from '../../components/team/AWTeam';


const About = () => (
  <div className='content-container' >

   <div className='content-container-header' >About This Site</div>

    <div style={{ paddingLeft: '0em' }} >
      <p>
        This site provides agricultural water users and other stakeholders current information and tools for more efficiently
        managing Oregon&apos;s water resources in agricultural regions.  Developed in response to HB2010, a legislative initiative
        designed to better protect and utilize our increasingly scarce water resources by providing support for research, outreach and
        engagement, primarily through <a href='https:/oregonstate.edu'>Oregon State University&apos;s</a> Research and Extension programs.
        This site is a resource for information and tools related to agricultural water management in Oregon, provided by
        Oregon State University, to link OSU&apos;s research and Extension water community to practioners, agencies, and other interested parties
        around the state to better understand and manage our water resources.
      </p>
      <hr/>
      <p>This site is developed with contributions from the following team.</p>
      <br />

            <AWTeam></AWTeam>


            {/* }

      <div className="flex-container" style={{ textAlign: 'left' }}>
        <div className="flex-item" style={{ minWidth: 340 }}>
          <Card title="Maria Zamora, Ph.D" bordered={true} style={{ height: '100%' }}>

            <img src={maria} />
            <a href="https://bee.oregonstate.edu/users/maria-zamora-re" target="_blank">Dr. Maria Zamora Re</a> is an Agricultural Water Management and Irrigation Engineering Extension
            specialist in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
            Her research is focused on irrigation scheduling and water allocation, evaluating evapotranspiration-based methods and Smart-irrigation tools
            to allow growers to use more efficiently water resources. Dr. Zamora Re has investigated different irrigation and N fertilizer best management practices (BMPs),
            aiming to reduce potential N leaching from agricultural fields without impacts on yields. Her research interests
            lie in the water efficiency and conservation area, while helping to improve decision-making using smart irrigation and management tools.
          </Card>
        </div>

        <div className="flex-item" style={{ minWidth: 340 }}>
          <Card title="Malena Orduna Alegria, Ph.D" bordered={true} style={{ height: '100%' }}>
            <img src={malena} />
            <a href="https://bee.oregonstate.edu/users/maria-zamora-re" target="_blank">Dr. Malena Orduna Alegria </a>
            is an Assistant Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
            She specializes in examining the interelation in sociological and water resources systems, exploring factors and
            solutions for water scarcity in agricultural landscapes, analysis of complex water networks.  Additional Interests include
            Serious Games, Agent Based Modelling, and Irrigation optimization.
          </Card>
        </div>

        <div className="flex-item" style={{ minWidth: 340 }}>
          <Card title="Floyid Nicolas, Ph.D" bordered={true} style={{ height: '100%' }}>
            <img src={floyid} />
            <a href="https://bee.oregonstate.edu/users/floyid-nicolas" target="_blank">Dr. Floyid Nicolas </a>
            is an Assistant Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
            He specializes in irrigation management, crop water use, crop production modeling, and associate decision support tools.
            He is located at the <a href='https://agsci.oregonstate.edu/coarec/central-oregon-agricultural-research-and-extension-center'>
            Central Oregon Research and Extension Center</a> in Madras.
          </Card>
        </div>

        <div className="flex-item" style={{ minWidth: 340 }}>
          <Card title="Salini Sasidharan, Ph.D" bordered={true} style={{ height: '100%' }}>
            <img src={salini} />
            <a href="https://bee.oregonstate.edu/users/salini-sasidharan" target="_blank">Dr. Salini Sasidhran </a>
            is an Assistant Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
            She specializes in examining groundwater issues in Oregon and beyond. Her research includes understanding groundwater
            systems, their interactions with surface waters, through fieldwork and computer modeling.  Her work includes characterizing
            aquifer change and exploring engineering options for Aquifer Storage and Recharge (ASR) around the state.
          </Card>
        </div>

        <div className="flex-item" style={{ minWidth: 340 }}>
          <Card title="John Bolte, Ph.D" bordered={true} style={{ height: '100%' }}>
            <img src={bolte} />
            <a href="https://bee.oregonstate.edu/users/john-bolte" target="_blank">Dr. John Bolte </a>
            is an Professor in the <a href="https://bee.oregonstate.edu">Biological & Ecological Engineering department</a> at Oregon State University.
            He specializes in modeling a variety of coupled human/natural systems, including exploring the effects of a changing climate,
            population growth and development, and valued landscape functions and ecosystem services.
          </Card>
        </div>

        <div className="flex-item" style={{ minWidth: 340 }}>
          <Card title="Troy Peterson, Ph.D" bordered={true} style={{ height: '100%' }}>
            <img src='https://s3.wp.wsu.edu/uploads/sites/888/2023/03/Troy-Peters-1-396x436.jpg' />
              <a href="https://bsyse.wsu.edu/people/faculty/peters/" target="_blank">Dr. Troy Peters</a> works in the Land, Air, Water Resources, and Environmental Engineering (LAWREE) emphasis area within
              the <a href="https://bsyse.wsu.edu/">Biological Systems Engineering department at Washington State University</a>. His primary focus is on agricultural irrigation.
              This includes deficit irrigation, irrigation water hydraulics, irrigation scheduling and management, irrigation automation,
              sprinkler irrigation efficiency, low energy precision application (LEPA), low elevation spray application (LESA),
              and crop water use estimation. Troy is located at the <a href="https://iarec.wsu.edu/" target="_blank">Irrigated Agriculture Research and Extension Center</a> in Prosser, WA,
              and is also affiliated with the <a href="https://cpaas.wsu.edu/" target="_blank">Center for Precision and Automated Agricultural Systems</a>.
          </Card>
                </div>
      </div>
        */}

    </div>
  </div>
);

export default About;

