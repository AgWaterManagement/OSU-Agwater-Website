import React from 'react';

import { Form } from 'antd';

const CropDetails = (form) => {
    const handleChange = (e) => {
    //    const { name, value } = e.target;
    //    form.setFieldsValue({ [name]: value });
    }


  return (
      <Form.Item label="Crop Name" name="cropName" required>
          <input
              type="text"
              name="cropName"
              value={form.cropName}
              onChange={handleChange}
              required
          />
      </Form.Item>
  );
};

export default CropDetails;