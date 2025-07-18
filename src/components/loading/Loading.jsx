import React from 'react';
import { Spin } from 'antd';

export const Loading = ({ tip }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.7)',
    }}
  >
    <Spin size="large" tip={tip} fullscreen  />
  </div>
);

export default Loading;

