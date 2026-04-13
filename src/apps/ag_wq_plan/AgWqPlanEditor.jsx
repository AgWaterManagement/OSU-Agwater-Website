import { useState } from 'react';
import {
  Button,
  Layout,
  Tabs,
  Card,
  Alert,
  Typography,
} from 'antd';

import CommoditiesEditor from './CommoditiesEditor';
import ConcernsEditor from './ConcernsEditor';
import ConcernQuestionsEditor from './ConcernQuestionsEditor';
import GoalsEditor from './GoalsEditor';
import PracticesEditor from './PracticesEditor';

import AgWqplanLogin from "./AgWqplanLogin";

const { Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const API_BASE = 'https://agwater.org:5556';

/**
 * AgWqPlanEditor Component
 * 
 * Provides a comprehensive admin interface for managing:
 * - Practices
 * - Concern Questions
 * - Categories
 * - Commodities
 * 
 * All data is persisted via the /agwqplan/* routes defined in ag_wqplan.py
 */
const AgWqPlanEditor = () => {
  const [activeTab, setActiveTab] = useState('practices');
  const [loggingIn, setLoggingIn] = useState(true);
  const [loginName, setLoginName] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const items = [
    {
      key: 'commodities',
      label: 'Commodities',
      children: <CommoditiesEditor apiBase={API_BASE} />,
    },
    {
      key: 'concerns',
      label: 'Concerns',
      children: <ConcernsEditor apiBase={API_BASE} />,
    },
    {
      key: 'concern_questionss',
      label: 'Concern Questions',
      children: <ConcernQuestionsEditor apiBase={API_BASE} />,
    },
    {
      key: 'goals',
      label: 'Goals',
      children: <GoalsEditor apiBase={API_BASE} />,
    },
    {
      key: 'practices',
      label: 'Practices',
      children: <PracticesEditor apiBase={API_BASE} />,
    },
  ];

  return (
    <>
    {loggingIn && (
      <AgWqplanLogin
        onLoginSuccess={(result) => {console.log("Login successful:", result);
          setLoginName(result.user.username);
          setUserRole(result.user.role);
          setLoggingIn(false);
        } }
        onLoginFailure={(error) => {console.error("Login failed:", error);
          setLoggingIn(false);
        }}
        onLogout={() => {console.log("Logged out");
          setLoginName(null);
          setUserRole(null);
          setLoggingIn(false);
        }}
      ></AgWqplanLogin>
    )}
    {!loginName && !loggingIn && (
      <div style={{ padding: 4, textAlign: 'right' }} >
        <Button type="text" onClick={() => setLoggingIn(true)}>
          Sign In
        </Button>
      </div>  
    )}
    { loginName && (
      <div style={{ padding: 4, textAlign: 'right', color: 'white', fontSize:'small' }} >
        Signed in as <b>{loginName}</b>
        {userRole && <span> ({userRole})</span>}
        <Button ghost onClick={() => {
          setLoggingIn(false);
          setLoginName(null);
          setUserRole(null);
        }} style={{ marginLeft: 8 }}>
          Sign Out
        </Button>
      </div>
    )}

       <Content style={{ padding: '8px 8px', backgroundColor: '#001529', minHeight: '100vh' }}>
        <Card>
          <Title level={3} style={{ marginTop: 0 }}>
            AG Water Quality Plan Editor
          </Title>
          <Paragraph>
            Manage agricultural water quality practices, concern questions, categories, and
            commodities.
          </Paragraph>

          <Alert
            message="Data Management"
            description="Use these tabs to add, edit, or remove planner data."
            type="info"
            showIcon
            style={{ marginBottom: 16, backgroundColor: '#333' }}
          />

          <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Oregon Ag Water Quality Plan Data Editor
      </Footer>
    </>
  );
};

export default AgWqPlanEditor;
