import React from 'react';

import { Form } from 'antd';

const Management = (form) => {

    const inputStyle = {color: 'white'};

    const handleChange = (e) => {
    //    const { name, value } = e.target;
    //    form.setFieldsValue({ [name]: value });
    }

    return (
        <div style={{color:'white'} }>
            <Form.Item label="Fertilization" name="fertilization">
                <input
                    type="text"
                    style={inputStyle}
                    name="fertilization"
                    value={form.fertilization || ""}
                    onChange={handleChange}
                />
            </Form.Item>
            <Form.Item label="Irrigation" name="irrigation">
                <input
                    type="text"
                    style={inputStyle}
                    name="irrigation"
                    value={form.irrigation || ""}
                    onChange={handleChange}
                />
            </Form.Item>
            <Form.Item label="Pest Control" name="pestControl">
                <input
                    style={inputStyle}
                    type="text"
                    name="pestControl"
                    value={form.pestControl || ""}
                    onChange={handleChange}
                />
            </Form.Item>
        </div>
    );
};

export default Management;


/*

const getAdditionalItems = () => {
    return (
        <>
            <Form.Item label="Planting Date" name="plantingDate" required>
                <input
                    type="date"
                    name="plantingDate"
                    value={form.plantingDate}
                    onChange={handleChange}
                    required
                />
            </Form.Item>
            <Form.Item label="Area (acres)" name="area" required>
                <input
                    type="number"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                />
            </Form.Item>
            <Form.Item label="Notes" name="notes">
                <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                />
            </Form.Item>
            <Form.Item>
                <button type="submit">Submit</button>
            </Form.Item>
        </>
    )
}*/