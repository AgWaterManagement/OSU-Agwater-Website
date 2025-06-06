import './Documentation.css'

const Documentation = () => (
   <div className='content-container' >

   <div className='topic_head-container'>
  
     <div className='content-container-header' >Documentation</div>

      <div className='intro-text'>
  
         <p>Getting Started</p>
         <p>
            1. Clone the GitHub repository to your local computer.<br />
            <a href="https://github.com/AgWaterManagement/OSU-Agwater-Website" target="_blank" >https://github.com/AgWaterManagement/OSU-Agwater-Website</a>
         </p>
         <p>
            2. Navigate to the project directory:
            <br />
            <code>cd OSU-Agwater-Website</code>
         </p>
         <p>
            3. Install dependencies: <br />
            <code>npm install</code></p>
         <p>
            4. Start the development server. On a Mac, type 
               <code>npm run dev</code>, or on Windows, 
            run the <code>test.bat</code> file.
         </p>
         <p>
            5. To view the web site in your browser, navigate to <a href="http://127.0.0.1:3000/" target="_blank">http://127.0.0.1:3000/</a>.
         </p>
         <p>
            Note: To avoid routing errors, you may need to add <code>/src/pages/test/Test.jsx</code> to your 
            local development project. This file can be used as a template to test out new 
            features or components.
         </p>
         <p>
            Deployment
         </p>
         <p>
            1. To build the project for production, run <code>deploy.bat</code> on Windows.
         </p>
         <p>
            2. TBD. Copy files to server.
         </p>
       </div>
      </div>
   </div>
  );
  
  export default Documentation;