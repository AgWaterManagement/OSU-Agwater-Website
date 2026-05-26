import { useMemo } from 'react';
import { Select, Typography, Button, Card } from 'antd';
import PropTypes from 'prop-types';
import UserTypeGuide from './UserTypeGuide';
import AgWqplanLogin from './AgWqplanLogin';
import ValidationError from './ValidationError';

const { Title, Paragraph, Text } = Typography;

const StartUp = ({
    userType, setUserType,
    selectedTMDLs, setSelectedTMDLs,
    availableTMDLs,
    setLoginName, setUserRole, setLoggingIn,
    setCurrent }) => {

    return (
        <>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Text style={{ fontSize: '1.2em' }}>
                    Please select your user and operation type to get started:
                </Text>
                <br />
                <br />
                <Select
                    value={userType}
                    onChange={setUserType}
                    style={{ width: '30em', maxWidth: '100%' }}
                    options={[
                        { label: 'Landowner', value: 'Landowner' },
                        { label: 'Resource Conservationist', value: 'Resource Conservationist' },
                        { label: 'ODA Water Quality Specialist', value: 'ODA Water Quality Specialist' },
                    ]} />
                <br />
            </div>

            {(userType === 'ODA Water Quality Specialist' || userType === 'Resource Conservationist') && (
                <Card style={{marginLeft: 'auto', marginRight: 'auto', maxWidth: 480}}>
                <AgWqplanLogin
                    onLoginSuccess={(result) => {
                        console.log("Login successful:", result);
                        setLoginName(result.user.username);
                        setUserRole(result.user.role);
                        setLoggingIn(false);
                    }}
                    onLoginFailure={(error) => {
                        console.error("Login failed:", error);
                        setLoggingIn(false);
                    }}
                    onLogout={() => {
                        console.log("Logged out");
                        setLoginName(null);
                        setUserRole(null);
                        setLoggingIn(false);
                    }}
                    role={userType}
                    showCancel={false}
                />
            </Card>
            )}

            <br />
            <div style={{textAlign: 'center', marginBottom: 16}}>
                <Button type="primary" style={{marginRight: '1em'}} onClick={() => setCurrent(0)}>
                    Start New Plan
                </Button>

                <Button type="primary" style={{marginLeft: '1em'}} onClick={() => setCurrent(0)}>
                    Access Existing Plan
                </Button>
            </div>

            {/* User type guidance and TMDL filter */}
            <UserTypeGuide
                userType={userType}
                selectedTMDLs={selectedTMDLs}
                onTMDLChange={setSelectedTMDLs}
                availableTMDLs={availableTMDLs}
            >
            </UserTypeGuide>
        </>
    )
};

export default StartUp;      