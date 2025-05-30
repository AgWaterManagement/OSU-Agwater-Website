import { Button } from "antd";
import './AWButtonContainer.css'; 


const AWButtonContainer = ({ items, onClick }) => {

    return (
        <>
            <div className="button-container">

                {items.map((item, index) => (
                    <Button key={index} id={'btn_' + item.key} variant='solid' color={item.type == 'primary' ? 'primary' : 'default'}
                        className={item.type == 'primary' ? 'ant-btn-color-primary' : 'ant-btn-color-default'}
                        onClick={onClick}
                        icon={item.icon}>{item.label}</Button>
                ))}

            </div>
        </>
    )
}

export default AWButtonContainer;