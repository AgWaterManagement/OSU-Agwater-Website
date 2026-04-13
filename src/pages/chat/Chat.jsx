
import OllamaChat from '../../components/ollama_chat/OllamaChat';


const Chat = () => (
  <div className='content-container' >
 
    <div className='content-container-header' >Ag Water Chat</div>
    <p><i>The Ag Water Chat is an AI-driven chatbox that is trained using a variety of Extension and other curated information sources 
        about agriculture, water and soils in the Pacific Northwest.  Because it is AI-driven, it can sometimes produce unexpected results - 
        it is recommended you check the sources the AI uses to generate the provided response - links to these are  provided at
         the end of each response.
        </i></p>

    <p><i>Note: The chat is currently in beta testing, and may not always work as expected.  If you have any issues, please contact us at
        <a style={{ textDecoration: 'none' }} href="mailto:ag-water@oregonstate.edu"> agwater support</a>.</i></p>
    <OllamaChat />
   </div>
);

export default Chat;

