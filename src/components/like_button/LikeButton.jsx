
import { Button } from 'antd';
import { StarOutlined } from '@ant-design/icons';


const LikeButton = () => (
    <>
    <span className='float-right'>
    <Button type="primary" icon={<StarOutlined />} iconPosition='start'>
        Like
    </Button>

    &nbsp;<span>0 Likes</span>
    </span>
    </>
);


export default LikeButton;


