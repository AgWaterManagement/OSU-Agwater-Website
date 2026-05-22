// Import React and Ant Design components for form building
import PropTypes from 'prop-types';
import {  } from 'antd';
import { ExclamationCircleTwoTone } from '@ant-design/icons';

const ValidationError = ({message}) => {
  return (
    <>
    <ExclamationCircleTwoTone twoToneColor="red" style={{fontSize:'1.2em', marginRight:'0.5em'}} /> 
    <span style={{color:'red', fontSize:'1.1em', fontStyle: 'italic'}}>{message}</span>
    </>
  )
};

ValidationError.propTypes = {
  message: PropTypes.string,
};

export default ValidationError;