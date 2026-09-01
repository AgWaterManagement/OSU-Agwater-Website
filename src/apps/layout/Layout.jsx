import { useState, useEffect } from 'react';
//import { Input } from 'antd';
import { Link } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import SideMenu from '../side_menu/SideMenu';
import AppRoutes from '../routes/AppRoutes';

//import awLogo from '../../assets/images/AgWaterLogo.jpg'
import osuLogo from '../../assets/images/OSU_horizontal_2C_O_over_W.png'
import osuLogo2 from '../../assets/images/OSU_horizontal_2C_W_over_B.png'
import agTapLogo from '../../assets/images/AgTAPLogo2.png'


import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { ConfigProvider, Row, Col, Dropdown } from 'antd';
import {darkTheme, lightTheme} from '../../themes.js'; // Assuming you have a theme file for Ant Design


// Helper functions for cookies
function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

const AppLayout = () => {
    const [sideBarCollapsed, setSideBarCollapsed] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const onThemeMenuClick = ({ key }) => {
        setIsDarkMode(key === 'dark');
        setCookie('agwater_theme', key === 'dark' ? 'dark' : 'light');
    };

    const themeMenu = {
        items: [
            { key: 'dark', label: 'Dark mode' },
            { key: 'light', label: 'Light mode' },
        ],
        selectable: true,
        selectedKeys: [isDarkMode ? 'dark' : 'light'],
        onClick: onThemeMenuClick,
    };


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
        {/*<Link className='nav-item' to="/apps/agWqPlanAdminPanel" >Ag WQPlan Admin</Link> */}
        <Link className='nav-item' to="/tools" >Tools</Link>
        <Link className='nav-item' to="/resources">Resources</Link>
        <Link className='nav-item' to="/about">About</Link>
        {/* <Link className='nav-item' to="/login">Login</Link> */}
        <Link className='nav-item' to="/search"><SearchOutlined /></Link>
        <Dropdown menu={themeMenu} trigger={['click']} placement="bottomRight">
            <span className='nav-item' style={{ marginRight: '1em', cursor: 'pointer' }}>
                <SettingOutlined />
            </span>
        </Dropdown>
    </>
    )

    
    
      useEffect(() => {
        getCookie('agwater_theme') === 'dark' ? setIsDarkMode(true) : setIsDarkMode(false);        
      }, []);
    

    return (
        <>
            <div style={{backgroundColor: isDarkMode ? '#000000' : '#f0f0f0'}}>

                {/* Set up page top banner/top navigation menu */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', backgroundColor: 'rgb(215,63,9)', 'paddingLeft': '3px' }}>
                    {/* Sidebar menu is commented out for testing */}
                    {/* <span style={{ paddingLeft: '0.2em', paddingRight: '0.4em' }}>
                        {sideBarCollapsed ? (<MenuUnfoldOutlined style={{ fontSize: 'x-large', color: 'black' }} onClick={openSidebar} />)
                            : (<MenuFoldOutlined style={{ fontSize: 'x-large' }} onClick={closeSidebar} />)}
                    </span> */}

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

                <ConfigProvider theme={isDarkMode ? darkTheme : lightTheme}>
                    <AppRoutes theme={isDarkMode ? darkTheme : lightTheme} />
                </ConfigProvider>

                {!sideBarCollapsed && (
                    <aside className="aside"><SideMenu /></aside>
                )}

                <footer className="footer clearfix">
                    <hr />
                    <Row>
                        <Col xs={24} sm={12}>
                            <Row>
                                <Col xs={24} style={{ textAlign: 'left' }}>
                                <a href='http://oregonstate.edu'>
                                    <img src={osuLogo} className="osu-logo" alt="Oregon State University" />
                                </a>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={24} style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.9em' }}>
                                    &copy; {new Date().getFullYear()} Oregon State University. All rights reserved.
                                </p>
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={24} sm={12} >
                            <a href='https://agwater.oregonstate.edu'>
                                <img src={agTapLogo} alt="AgTAP Logo" style={{ width: '480px', height: 'auto', float: 'right' }} />
                            </a>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={24}>
                            <p style={{ textAlign: 'center', marginTop: '3em', fontSize: '0.9em' }}>
                                This site developed by the Agricultural Water Team at Oregon State University.
                                <br />
                                For questions or feedback, please <a href='/contact'>contact us</a>.
                            </p>
                            <p style={{ textAlign: 'center', marginTop: '3em', fontSize: '0.9em' }}>
                                Privacy Statement: 
                                <br />
                                See <a href='https://oregonstate.edu/official-web-disclaimer'>OSU&apos;s Privacy Statement</a> for more information.
                            </p>
                        </Col>
                    </Row>
                </footer>
            </div>

        </>

    )
}

export default AppLayout;
