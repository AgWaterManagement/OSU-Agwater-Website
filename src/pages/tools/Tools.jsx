import ToolTable from '../../components/tool_table/ToolTable';

import { useState, useRef} from 'react';
import { Input, Checkbox, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Tools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnderDevelopment, setShowUnderDevelopment] = useState(false);

  return (
    <div>

      <Title style={{ marginLeft: '0.25em' }} level={4}>Apps and Tools for Agricultural Water Management</Title>

      <Paragraph style={{ marginLeft: '1em' }}>
        Below are apps and tools to inform and assist with understanding and managing water resources
        in Oregon, the region, and the US, with a particular focus on tools for agricultural water management.
      </Paragraph>

      <Input
        placeholder="Search tools by title, description, or keywords"
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        allowClear
        style={{ maxWidth: 480, marginBottom: 8, marginTop: 8, marginLeft: '1em' }}
      />
      
      <div style={{ marginBottom: 16, marginLeft: '1em' }}>
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

