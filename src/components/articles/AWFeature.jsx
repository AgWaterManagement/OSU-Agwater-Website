import { useState, useEffect } from 'react';
import { useParams } from "react-router";
import PropTypes from 'prop-types';
import { Button } from 'antd'

import AWAuthor from './AWAuthor'

// AWFeatureDisplay show the full areticle details including the cover image, title, subtitle, authors, publication date, and body text.
// It is used by AWFeature to display the article details.

const AWFeatureDisplay = ({ article = null }) => {
    const overlayStyle = {
        position: 'absolute',
        left: '50%',
        bottom: '-4em',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '0px',
    };

    const containerStyle = {
        position: 'relative',
        display: 'inline-block',
        margin: '0px',
    };

    if (article != null)
        console.log(article.url)

    return (
        <>
            {(article == null) && (<span>No Article Available</span>)}
            {(article != null) && (
                <>
                    <div className='full-width' style={containerStyle}>
                        <img src={article.cover_image} style={{ width: '100%', padding:0 }} />

                        <div className='full-width' style={overlayStyle}>
                            <div className='padded'>
                                <div className="text-h4">{article.title}</div>
                                <div className="text-subtitle1">{article.subtitle}</div>

                                <AWAuthor name={article.lead_author} lead_site={article.lead_site} avatar={article.avatar} />
                                <div className="text-subtitle5">{article.additional_authors}</div>

                                <div className="text-subtitle5">{article.pub_date}</div>
                            </div>
                        </div>
                    </div>

                    <div id='divBodyText' className="aw-white-bg aw-black-text" style={{ padding: '0.5em' }}
                        dangerouslySetInnerHTML={{ __html: article.body_html }}></div>
                    <Button type="link" href={article.url} target="_blank" className="" >Read More...</Button>
                </>
            )}
        </>
    )
};

const AWFeature = () => {
    const [article, setArticle] = useState(null);

    const params = useParams();
    console.log('AWFeature article: ', params.id);

    // SANITIZE!!!!!
    //document.getElementById('divBodyText').innerHTML= article.body_html;

    useEffect(() => {
        fetch("https://agwater.org:5556/ArticleList")
            .then((res) => res.json())
            .then((articles) => {
                for (let article of articles) {
                    article['_id'] = article.title.replaceAll(' ', '_');
                    if (article['_id'] == params.id) {
                        setArticle(article);
                        break;
                    }
                }
            })
    }, []);

    return (
        <div className='full-width aw-white-bg' style={{ borderRadius: 10 }}>
            <AWFeatureDisplay article={article} />
        </div>
    )
};


AWFeatureDisplay.propTypes = {
    article: PropTypes.object,
}

// Export both components
export { AWFeature, AWFeatureDisplay };
export default AWFeature
