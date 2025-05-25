import AWArticles from '../../components/articles/AWArticles';

const HomePage = () => (
    <div className='full-width padded'>

        <h2 className="aw-light-accent-text">Agricultural Water Management in the Pacific Northwest</h2>

        <span className="aw-white-text">
            Water is essential to agriculture, and efficient use of water is increasingly important in the face of water scarcity and increasing
            drought risk resulting from competing demands and a changing climate.  This site, developed through a consortium of Pacific Northwest universities,
            provides access to recent articles, calculators and other tools, and information resources for irrigators, agricultural water managers,
            agencies, and other stakeholders to more effectively manage water resources in the region.
        </span>

        <h3 className="aw-light-text" style={{marginBottom:0, paddingBottom:0}}>Latest News...</h3>
        <div className='content-container'>
            <AWArticles showFilters={false} showSearch={false}></AWArticles>
        </div>
        <hr/>
        
    </div>
);

export default HomePage;
