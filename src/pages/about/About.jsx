
import './About.css'

import AWTeam from '../../components/team/AWTeam';


const About = () => (
  <div className='content-container' >

  <div className='topic_head-container'>

    <div className='content-container-header' >About This Site</div>

    <p className='intro-text'>
      This site provides agricultural water users and other stakeholders current information and tools for more efficiently
      managing Oregon&apos;s water resources in agricultural regions.  Developed in response to HB2010, a legislative initiative
      designed to better protect and utilize our increasingly scarce water resources by providing support for research, outreach and
      engagement, primarily through <a href='https:/oregonstate.edu'>Oregon State University&apos;s</a> Research and Extension programs.
      This site is a resource for information and tools related to agricultural water management in Oregon, provided by
      Oregon State University, to link OSU&apos;s research and Extension water community to practioners, agencies, and other interested parties
      around the state to better understand and manage our water resources.
    </p>
    <hr/>
    <p className='intro-text'>This site is developed with contributions from the following team.</p>
        
  </div>

            <AWTeam team='website'></AWTeam>


          

  </div>
);

export default About;

