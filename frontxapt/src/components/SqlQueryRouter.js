import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SqlQueryComponent from './SqlQueryComponent';
import SqlQueryComponentV2 from './SqlQueryComponentV2';

const SqlQueryRouter = () => {
  const [searchParams] = useSearchParams();
  const version = searchParams.get('v') || 'v1';

  return version === 'v2' ? <SqlQueryComponentV2 /> : <SqlQueryComponent />;
};

export default SqlQueryRouter;
