import PropTypes from 'prop-types';

import { Button } from 'antd'

const AWFactSheet = ({link, title, author}) => {
  const assetURL = 'https://agwater.org/' + link;
  return (
    <>
    <div className="full-width" style={{paddingBottom:'0.7em'}}>
    <Button type="link" href={assetURL} target="_blank" style={{paddingBottom:'0.7em'}}>
      { title }
    </Button>
    </div>
    </>
);
};


AWFactSheet.propTypes = {
  link: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  author: PropTypes.string.isRequired
}

export default AWFactSheet;
