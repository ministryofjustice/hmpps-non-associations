import RestClient from '../restClient'
import Component from './interfaces/component'
import { ComponentApiClient } from './interfaces/componentApiClient'

export default class ComponentApiRestClient implements ComponentApiClient {
  // eslint-disable-next-line no-empty-function
  constructor(private restClient: RestClient) {}

  async getComponent(component: 'header' | 'footer', userToken: string): Promise<Component> {
    return this.restClient.get<Component>({
      path: `/${component}`,
      headers: { 'x-user-token': userToken },
    })
  }
}
