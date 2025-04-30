import PropTypes from 'prop-types';

const AWAuthor = ({name, lead_site, avatar}) => {

  return (
  <div className='full-width'>

    <img className='float-left' src={'https://agwater.org/avatars/' + avatar}  
      style={{width:'32px', marginLeft:0, marginRight:'0.5em', marginTop:'0.5em', marginBottom:'0em'}} />
    <span style={{fontSize:'small'}}>{name}, {lead_site}</span>
  </div>
)};

AWAuthor.propTypes = {
  name: PropTypes.string.isRequired,
  lead_site: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired,
}

export default AWAuthor;
