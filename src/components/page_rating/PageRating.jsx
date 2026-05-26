import { Rate } from "antd";
import PropTypes from 'prop-types';

const PageRating = ({ pageID }) => {
 
    const onChange = (value) => {
        console.log('Page rating for ' + pageID + ': ', value);
    };

    return (
        <>
            <span style={{float: 'right', marginTop:'0.2em', marginRight: '1em'}}>Rate this tool: <Rate onChange={onChange} />
            </span>
        </>
    );
}

PageRating.propTypes = {
    pageID: PropTypes.string.isRequired,
};

export default PageRating;