import AWArticles from '../../components/articles/AWArticles';

const HomePage = () => (
    <div className='content-container'>

        <div className='topic_head-container'>

            <h2 className="main-title">Agricultural Water Management in the Pacific Northwest</h2>

            <p className='intro-text'>
                Water is essential to agriculture, and efficient use of water is increasingly important in the face of water scarcity and increasing
                drought risk resulting from competing demands and a changing climate.  This site, developed through a consortium of Pacific Northwest universities,
                provides access to recent articles, calculators and other tools, and information resources for irrigators, agricultural water managers,
                agencies, and other stakeholders to more effectively manage water resources in the region.
            </p>

            <h3 className="content-container-header" style={{marginBottom:0, paddingBottom:0}}>Latest News...</h3>
        </div>
        <div>
            <AWArticles showFilters={false} showSearch={false}></AWArticles>
        </div>
        
    </div>
);

export default HomePage;
