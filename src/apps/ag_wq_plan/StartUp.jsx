import { useMemo } from 'react';
import { Select, Typography, Form } from 'antd';
import PropTypes from 'prop-types';
import UserTypeGuide from './UserTypeGuide';
import AgWqplanLogin from './AgWqplanLogin';
import ValidationError from './ValidationError';

const { Title, Paragraph, Text } = Typography;

const StartUp = ({
    userType, setUserType,
    selectedTMDLs, setSelectedTMDLs,
    availableTMDLs,
    setLoginName, setUserRole, setLoggingIn }) => {

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
                        { label: 'SWCD / Technical Assistant', value: 'SWCD / TA' },
                        { label: 'ODA - Compliance', value: 'ODA - Compliance' },
                        { label: 'Board / TMDL', value: 'Board / TMDL' },
                    ]} />

                <br />
            </div>

            {userType === 'ODA - Compliance' && (
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
                    showCancel={false}
                />
            )}


            <br />


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