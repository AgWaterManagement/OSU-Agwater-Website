import { ToolOutlined, ReadOutlined, LinkOutlined } from '@ant-design/icons';
import { Menu } from 'antd';


//import MessageSvg from '../../components/icons/vite.svg'; // path to your '*.svg' file.

const items = [
  {
    key: 'articles',
    label: 'Articles',
    icon: <ReadOutlined />,
    children: [
      {
        key: 'g1',
        label: 'Item 1',
        type: 'group',
        children: [
          {
            key: '1',
            label: 'Option 1',
          },
          {
            key: '2',
            label: 'Option 2',
          },
        ],
      },
      {
        key: 'g2',
        label: 'Item 2',
        type: 'group',
        children: [
          {
            key: '3',
            label: 'Option 3',
          },
          {
            key: '4',
            label: 'Option 4',
          },
        ],
      },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    icon: <ToolOutlined />,
    children: [
      {
        key: 'drip',
        label: 'Drip Irrigation Flow Calculator',
      },
      {
        key: 'cc',
        label: 'Crop Coefficent Calculator',
      },
    ],
  },

  {
    key: 'resources',
    label: 'Resources',
    icon: <LinkOutlined />,
  },
  {
    key: 'irrigWaterUse',
    label: 'Irrigation Water Use',
    type: 'group',
  },
];


const SideMenu = () => {
  const onClick = (e) => {
    console.log('click ', e);
  };
  return (
    <>
    <Menu
      onClick={onClick}
      style={{
        width: '100%',

      }}
      defaultSelectedKeys={['1']}
      defaultOpenKeys={['tools']}
      mode="inline"
      items={items}
    />
    </>
  );
};

export default SideMenu;