
import { Typography } from 'antd';
import OllamaChat from '../../components/ollama_chat/OllamaChat';

const { Title, Paragraph } = Typography;

const Chat = () => (
  <div style={{ padding: '0.5em' }}>
 
    <Title level={3}>Ag Water Chat</Title>
    <Paragraph><i>The Ag Water Chat is an AI-driven chatbox that is trained using a variety of Extension and other curated information sources 
        about agriculture, water and soils in the Pacific Northwest.  Because it is AI-driven, it can sometimes produce unexpected results - 
        it is recommended you check the sources the AI uses to generate the provided response - links to these are  provided at
         the end of each response.
        </i></Paragraph>

    <Paragraph><i>Note: The chat is currently in beta testing, and may not always work as expected.  If you have any issues, please contact us at
        <a style={{ textDecoration: 'none' }} href="mailto:ag-water@oregonstate.edu"> agwater support</a>.</i></Paragraph>
    <OllamaChat />
   </div>
);

export default Chat;

