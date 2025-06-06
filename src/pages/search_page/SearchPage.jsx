import { Input } from 'antd';
import { useState } from 'react';
import { Link } from "react-router-dom";
const { Search } = Input;


const SearchPage = () => {

  const OnClickAbstract = (e) => {
    let title = e.currentTarget.id;
    console.log('Clicked abstract for:', title);
    title = title.replaceAll('_', ' ');

    const url = '/feature/' + encodeURIComponent(title);
    window.open(url, '_blank');
  }

  //const isDesktopOrLaptop = useMediaQuery({query: '(min-width: 1224px)' })
  //const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  //const isMobile = useMediaQuery({ query: '(max-width: 800px)' })
  //const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
  //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })

 

 /* function onSearch() {

    const keywords = document.getElementById('searchInput').value.trim();
    fetch('/Search?' + new URLSearchParams({keywords: keywords}))
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Search successful:', data);



        } else {
          alert('Search failed. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while searching. Please try again.');
      });
    } */
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  function onSearch() {
    const keywords = document.getElementById('searchInput').value.trim();
    setLoading(true);
    const url = 'https://agwater.org:5556/SearchArticles?' + new URLSearchParams({ keywords: keywords });
    console.log('Search URL:', url);

    fetch(url)
      .then(response => response.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          setResults(data.results.articles || []);
          console.log('Search successful:', data);
        } else {
          setResults([]);
          alert('Search failed. Please try again.');
        }
      })
      .catch(error => {
        setLoading(false);
        setResults([]);
        console.error('Error:', error);
        alert('An error occurred while searching. Please try again.');
      });
  }

  return (
    <div className='content-container'
      style={{
        height: '800px', textAlign: 'center'
      }}>

      <div className='open-sans' style={{ fontSize: 'xx-large', paddingTop: '3em' }}>Search this site</div>
      <div className='open-sans' style={{ fontSize: 'large', paddingTop: '2em' }}>Enter your search terms in the field below.</div>
      <br />
  
      <div style={{ fontSize: 'large' }}>
        <Search id="searchInput" placeholder="input search text" allowClear onSearch={onSearch}
          style={{ width: 400, paddingBottom:'1em', fontSize: 'xx-large' }} />
      </div>

      <div style={{padding:'1em'  }}>

        Common searches: <br/>
        <span id='heatStress' className='common-search'> Heat Stress, </span>
        <span id='groundWater' className='common-search'>Groundwater, </span>
        <span id='drought' className='common-search'>Drought</span>
      </div>

      <div style={{ marginTop: '2em', color: 'white' }}>
        {loading && <div>Loading...</div>}
        {!loading && results != null && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5em' }}>Search Results:</div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {results.map((item, index) => (
                <li key={index} style={{ marginBottom: '1em', color: 'white', background: '#222', padding: '1em', borderRadius: '8px' }}>
                  <div style={{ fontSize: 'medium' }}>
                    <Link id={index} to={'/feature/' + encodeURIComponent(item.title)} >{item.title}</Link>
                    <div id={item.title.replaceAll(' ', '_')} onClick={OnClickAbstract}>{item.abstract}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!loading && results.length === 0 && (
          <div style={{ fontStyle: 'italic', color: '#aaa' }}>No results found.</div>
        )}
      </div>
      

    </div>

  )
};


export default SearchPage;
