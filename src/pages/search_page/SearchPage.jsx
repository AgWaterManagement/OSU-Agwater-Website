import { Input } from 'antd';
//import { Route, Routes, Link } from 'react-router-dom';
//import {useMediaQuery} from 'react-responsive';

//import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;


const SearchPage = () => {

  //const onClick = (e) => {
  //  setCurrent(e.key);  
  //};

  //const isDesktopOrLaptop = useMediaQuery({query: '(min-width: 1224px)' })
  //const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  //const isMobile = useMediaQuery({ query: '(max-width: 800px)' })
  //const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
  //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })

  function onSearch() {

    fetch('/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchTerms: document.getElementById('searchInput').value
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/search_results';
        } else {
          alert('Search failed. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while searching. Please try again.');
      });
  }

  return (
    <div className='full-width'
      style={{
        height: '800px', textAlign: 'center', backgroundColor: 'black',
        fontFamily: 'OSU-text'
      }}>

      <div className='open-sans' style={{ fontSize: 'xx-large', paddingTop: '3em' }}>Search this site</div>
      
      
      <div className='open-sans' style={{ fontSize: 'large', paddingTop: '2em' }}>Enter your search terms in the field below.</div>
      <br />
  
      <div style={{ fontSize: 'large' }}>
        <Search placeholder="input search text" allowClear onSearch={onSearch}
          style={{ width: 400, paddingBottom:'1em', fontSize: 'xx-large' }} />
      </div>

      <div style={{padding:'1em'  }}>

        Common searches: <br/>
        <span id='heatStress' className='common-search'> Heat Stress, </span>
        
        <span id='groundWater' className='common-search'>Ground Water, </span>
        
        <span id='drought' className='common-search'>Drought</span>
        
         
      </div>


      

    </div>

  )
};


export default SearchPage;
