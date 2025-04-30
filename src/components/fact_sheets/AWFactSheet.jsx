import PropTypes from 'prop-types';

const AWFactSheet = ({link, title, author}) => {
  const assetURL = 'https://agwater.org/' + link;
  return (
    <>
    <div className="full-width" style={{paddingBottom:'0.7em'}}>
      <a style={{color:'darkblue'}} href={assetURL} target="_blank">{ title }</a> - {author}
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
