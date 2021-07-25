import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosPromise,
  AxiosResponse,
  CancelToken,
} from "axios";
import config from "../constants/env.config";

const {
  api: { devApiBaseUrl, proApiBaseUrl },
} = config;
const apiBaseUrl =
  process.env.NODE_ENV === "production" ? proApiBaseUrl : devApiBaseUrl;

const CancelToken = axios.CancelToken;

// 设置超时时间
axios.defaults.timeout = 5000;
axios.defaults.withCredentials = true;
axios.defaults.headers.post["Content-Type"] = "application/json; charset=utf-8";
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

export interface ResponseData {
  code: number;
  data?: any;
  msg: string;
}

interface PendingType {
  [propsName: string]: any;
}

const pending: PendingType = {};

export default class HttpRequest {
  constructor(public baseUrl: string = apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  public request(options: AxiosRequestConfig): AxiosPromise {
    const instance: AxiosInstance = axios.create();
    options = this.mergeConfig(options);
    this.interceptors(instance, options.url);
    return instance(options);
  }

  private interceptors(instance: AxiosInstance, url?: string) {
    instance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        let requestData = this.getRequestIdentify(config, true);

        this.removePending(requestData, true);

        config.cancelToken = new CancelToken((c) => {
          pending[requestData] = c;
        });
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    instance.interceptors.response.use(
      (response: AxiosResponse) => {

        let requestData = this.getRequestIdentify(response.config);
        this.removePending(requestData);

        const { data } = response;
        const { code, msg } = data;
        if (code !== 0) {
          console.error(msg);
        }
        return response.data;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  private getRequestIdentify = (
    config: AxiosRequestConfig,
    isRequest: boolean = false
  ) => {
    let url = config.url;

    let data = null;
    if (config.method === "get") {
      data = config.params;
    } else {
      data = config.data;
    }
    return encodeURIComponent(url + JSON.stringify(data || ""));
  };

  private removePending = (key: string, isRequest: boolean = false) => {
    if (pending[key] && isRequest) {
      pending[key]("取消重复请求");
    }

    delete pending[key]; // 把这条记录从 pending 中移除
  };

  private mergeConfig(options: AxiosRequestConfig): AxiosRequestConfig {
    return Object.assign({ baseURL: this.baseUrl }, options);
  }
}
