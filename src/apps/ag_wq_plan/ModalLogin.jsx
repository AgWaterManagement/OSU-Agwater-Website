import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import AgWqplanLogin from './AgWqplanLogin';

const ModalLogin = ({
  open,
  onCancel,
  role,
  onLoginSuccess,
  onLoginFailure,
  onLogout,
  showCancel = false,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      destroyOnHidden
    >
      <AgWqplanLogin
        role={role}
        showCancel={showCancel}
        onLoginSuccess={onLoginSuccess}
        onLoginFailure={onLoginFailure}
        onLogout={onLogout}
      />
    </Modal>
  );
};

ModalLogin.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  role: PropTypes.string,
  onLoginSuccess: PropTypes.func,
  onLoginFailure: PropTypes.func,
  onLogout: PropTypes.func,
  showCancel: PropTypes.bool,
};

export default ModalLogin;
