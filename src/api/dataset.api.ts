
import axios, { ResponseData } from './index';
import { AxiosPromise } from 'axios';

interface ReqArguInterface {
  user_name: string;
  password: number|string;
}

export const getDataset = (data: ReqArguInterface): AxiosPromise<ResponseData> => {
  return axios.request({
    url: '/api/dataset',
    data,
    method: 'GET',
  })
}