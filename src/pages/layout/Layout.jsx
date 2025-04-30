import { useState } from 'react';
//import { Input } from 'antd';
import { Route, Routes, Link } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import SideMenu from '../side_menu/SideMenu';

import Home from '../home/Home'
import SearchPage from '../search_page/SearchPage';
import AgTAP from '../ag_tap/AgTAP';
import Tools from '../tools/Tools'
import Resources from '../resources/Resources'
import About from '../about/About'
import Feature from '../../components/articles/AWFeature';
import Dashboards from '../../apps/dashboards/Dashboards';
import IrrigWaterUse from '../../apps/irrig_water_use/IrrigWaterUse';
import OregonCropWaterUse from '../../apps/oregon_crop_water_use/OregonCropWaterUse';
import SubmitArticle from '../submit_article/SubmitArticle';
import Test from '../test/Test';

//import awLogo from '../../assets/images/AgWaterLogo.jpg'
import osuLogo from '../../assets/images/OSU_horizontal_2C_O_over_W.png'
import osuLogo2 from '../../assets/images/OSU_horizontal_2C_W_over_B.png'

import { MenuUnfoldOutlined, MenuFoldOutlined, SearchOutlined } from '@ant-design/icons';

const AppLayout = () => {
    const [sideBarCollapsed, setSideBarCollapsed] = useState(true);

    function openSidebar() {  // menu is closed, open it
        setSideBarCollapsed(false);
    }

    function closeSidebar() {
        setSideBarCollapsed(true);
    }

    const isDesktopOrLaptop = useMediaQuery({ query: '(min-width: 1224px)' })
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 800px)' })
    //const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
    //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })


    //const isDesktopDevice = useMediaQuery({ query: "(min-device-width: 1200px)", });  
    isMobile ? console.log('on mobile') : isTabletOrMobile ? console.log('on tablet') : console.log('on laptop/desktop');


    const topMenu = (<>
        <Link className='nav-item' to="/agTap" >AgTAP</Link>
        <Link className='nav-item' to="/tools">Tools</Link>
        <Link className='nav-item' to="/resources">Resources</Link>
        <Link className='nav-item' to="/about">About</Link>
        {/* <Link className='nav-item' to="/login">Login</Link> */}
        <Link className='nav-item' to="/search"><SearchOutlined /></Link>
    </>
    )

    return (
        <>
            <div className="wrapper">

                {/* Set up page top banner/top navigation menu */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', backgroundColor: 'rgb(215,63,9)', 'paddingLeft': '3px' }}>
                    <span style={{ paddingLeft: '0.2em', paddingRight: '0.4em' }}>
                        {sideBarCollapsed ? (<MenuUnfoldOutlined style={{ fontSize: 'x-large', color: 'black' }} onClick={openSidebar} />)
                            : (<MenuFoldOutlined style={{ fontSize: 'x-large' }} onClick={closeSidebar} />)}
                    </span>

                    <Link className='top-link' to="/">
                        <img src={osuLogo2} className="logo" alt="logo" />
                    </Link>

                    {/* app bar title */}
                    {isDesktopOrLaptop && (
                        <Link className='top-link' to="/" style={{ paddingLeft: '1em' }}>
                            <span className='osu-brand'>Agricultural Water Management in Oregon</span>
                        </Link>
                    )}

                    {/* this nav should be right-justified on desktop, separate menu on mobile*/}
                    {isDesktopOrLaptop && (<>
                        <nav className='nav-main' >
                            {topMenu}
                        </nav>
                    </>)}
                </div>

                {/* mobile banner */}
                {isTabletOrMobile && (
                    <div style={{ textAlign: 'center', backgroundColor: 'white' }}>
                        <Link className='top-link' to="/" style={{ paddingLeft: '1em', color: 'black', fontSize: 'large', fontFamily: 'OSU-text' }}>
                            <span>Agricultural Water Management in Oregon</span>
                        </Link>
                    </div>
                )}


                {/* mobile nav menu */}
                {isTabletOrMobile && (<div>
                    <nav className='nav-main' style={{ textAlign: 'center', backgroundColor: 'darkslategray', padding: '0.25em' }} >
                        {topMenu}
                    </nav>
                </div>)}

                <article>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/agTap" element={<AgTAP />} />
                        <Route path="/tools" element={<Tools />} />
                        <Route path="/resources" element={<Resources />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/feature/:id" element={<Feature/>} />
                        <Route path="/apps/irrigWaterUse" element={<IrrigWaterUse />} />
                        <Route path="/apps/oregonCropWaterUse" element={<OregonCropWaterUse/>} />
                        <Route path="/submitArticle/:id" element={<SubmitArticle />} />
                        <Route path="/login" element={<Home />} />
                        <Route path="/dashboards" element={<Dashboards />} />
                        <Route path="/test" element={<Test />} />
                    </Routes>
                </article>

                {!sideBarCollapsed && (
                    <aside className="aside"><SideMenu /></aside>
                )}

                <footer className="footer">
                    <a href='http://oregonstate.edu'>
                        <img src={osuLogo} className="osu-logo" alt="Oregon State University" />
                    </a>
                </footer>
            </div>


            <hr />

        </>

    )
}

export default AppLayout;
