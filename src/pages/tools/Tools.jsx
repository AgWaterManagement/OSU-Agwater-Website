import ToolTable from '../../components/tool_table/ToolTable';

import { useState, useRef} from 'react';
import { Input, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
const Tools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnderDevelopment, setShowUnderDevelopment] = useState(false);

  return (
    <div className='content-container' >

      <div className='content-container-header'>Apps and Tools for Agricultural Water Management</div>

      <p className='intro-text'>
        Below are apps and tools to inform and assist with understanding and managing water resources
        in Oregon, the region, and the US, with a particular focus on tools for agricultural water management.
      </p>

      <Input
        placeholder="Search tools by title, description, or keywords"
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        allowClear
        style={{ maxWidth: 480, marginBottom: 8, marginTop: 8 }}
      />
      
      <div style={{ marginBottom: 16 }}>
        <Checkbox
          checked={showUnderDevelopment}
          onChange={(e) => setShowUnderDevelopment(e.target.checked)}
        >
          Show tools under development
        </Checkbox>
      </div>
      <hr />

      <ToolTable showUnderDevelopment={showUnderDevelopment} searchTerm={searchTerm} maxTools={-1} />
      
    </div>
  );
};

export default Tools;

