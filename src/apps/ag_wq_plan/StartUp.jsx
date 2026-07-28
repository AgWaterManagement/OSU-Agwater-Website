import { useState } from 'react';
import { Select, Typography, Button, Divider } from 'antd';
import PropTypes from 'prop-types';
//import UserTypeGuide from './UserTypeGuide';
import ModalLogin from './ModalLogin';

const { Title, Paragraph, Text } = Typography;

const StartUp = ({
    userRole, setUserRole,
    selectedTMDLs, setSelectedTMDLs,
    availableTMDLs,
    setLoginName, setUserID, setLoggingIn,
    setCurrent
}) => {

    const [loginModalOpen, setLoginModalOpen] = useState(false);

    return (
        <>
            <div style={{ marginBottom: 16, marginTop: 16, textAlign: 'center' }}>

                {userRole === null ? (
                    <>
                        <Text style={{ fontSize: '1.2em' }}>
                            Please log in to get started
                        </Text>
                        <br />
                        <Text style={{ fontSize: '1.0em' }}>
                            Users with accounts can log in to save their plans and access saved or shared plans
                        </Text>
                        <br />
                        <br />

                        <Button type="primary" onClick={() => setLoginModalOpen(true)}>Log in to the Ag water Quality Planner</Button>
                        <ModalLogin
                            open={loginModalOpen}
                            onCancel={() => setLoginModalOpen(false)}
                            role={userRole}
                            showCancel={false}
                            onLoginSuccess={(result) => {
                                console.log("Login successful:", result);
                                setLoginName(result.user.username);
                                setUserRole(result.user.role);
                                setUserID(result.user.id);
                                setLoggingIn(false);
                                setLoginModalOpen(false);
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
                        />
                        <br />
                        <Divider style={{ width: '20em' }}>OR</Divider>

                        <Text style={{ fontSize: '1.2em' }}>
                            Select your user type to get started making a water quality plan
                        </Text>
                        <br />
                        <Text style={{ fontSize: '1.0em' }}>
                            Note that you will not be able to save your plan unless you log in. If you do not have an account,
                            consider creating one.
                        </Text>
                        <br />
                        <br />
                        <Select
                            value={userRole}
                            onChange={setUserRole}
                            style={{ width: '30em', maxWidth: '100%' }}
                            options={[
                                { label: 'Landowner', value: 'Landowner' },
                                { label: 'Resource Conservationist', value: 'Resource Conservationist' },
                                { label: 'ODA Water Quality Specialist', value: 'ODA Water Quality Specialist' },
                            ]} />
                        <br />
                        <br />
                        <br />
                    </>
                ) : (
                    <>
                        <Button type="primary" style={{ marginRight: '1em' }} onClick={() => setCurrent(0)}>
                            Start New Plan
                        </Button>

                        <Button type="primary" style={{ marginLeft: '1em' }} onClick={() => setCurrent(0)}>
                            Access Existing Plan
                        </Button>
                    </>
                )}
            </div>

            {/* User type guidance and TMDL filter */}

            {/*}
            <UserTypeGuide
                userType={userType}
                selectedTMDLs={selectedTMDLs}
                onTMDLChange={setSelectedTMDLs}
                availableTMDLs={availableTMDLs}
            >
            </UserTypeGuide> */}
        </>
    )
};

StartUp.propTypes = {
    userRole: PropTypes.string,
    setUserRole: PropTypes.func.isRequired,
    selectedTMDLs: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])),
    setSelectedTMDLs: PropTypes.func.isRequired,
    availableTMDLs: PropTypes.array,
    setLoginName: PropTypes.func.isRequired,
    setUserID: PropTypes.func.isRequired,
    setLoggingIn: PropTypes.func.isRequired,
    setCurrent: PropTypes.func.isRequired,
};

export default StartUp;