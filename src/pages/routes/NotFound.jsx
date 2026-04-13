import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      padding: '24px'
    }}>
      <Result
      style = {{color:'yellow'}}
        status="404"
        title="Whoops!"
        subTitle={<span style={{ color: 'white' }}>Sorry, the page you tried to visit does not exist.</span>}
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Go to Home Page
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
